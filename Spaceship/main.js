/** @module Main */

import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

import { GUI } from './gui.js';
import { moveTowards, seededRandomBuilder } from './util.js';
import { Planet, PlanetManager } from './planet.js';
import * as Ship from './ship.js';

Math.moveTowards = moveTowards;

/** @typedef {THREE.Scene & {camera: THREE.Camera, object: THREE.Object3D?, initialize: function(): void}} GameScene */

export class Game {
    /** @type {THREE.WebGLRenderer} */
    renderer;

    /** @type {THREE.Controls} */
    controls;

    /** @type {GUI} */
    gui;

    /** @type {GameScene} */
    scene;

    /** @type {THREE.LoadingManager} */
    manager;

    /**
     * Set up a new scene
     * @param {GameScene} scene Scene instance
     * @param {THREE.Camera} camera New camera
     * @param {THREE.Object3D} object Control object
     */
    setScene(scene, camera = null, object = null) {
        scene.camera = camera;
        scene.object = object;
        this.scene = scene;
    }
}

/** @type {Game} */
globalThis.game = null;

/* Game */

class AppletControl extends THREE.Controls {

    constructor( domElement = null ) {
        super(null, domElement);
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);

        if (domElement != null)
            this.connect();
    }

    /**
     * Key down event handler
     * @param {KeyboardEvent} event 
     */
    onKeyDown(event) {
        if (this.enabled === false) return;

        const object = game.scene?.object;
        if (object !== undefined && 'input' in object)
            object.input(event.code, true);
    }

    /**
     * Key up event handler
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {
        if (this.enabled === false) return;

        const object = game.scene?.object;
        if (object !== undefined && 'input' in object)
            object.input(event.code, false);
    }

    connect() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    disconnect() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }

    dispose() {
        this.disconnect();
    }

    update(delta) {
        if (this.enabled === false) return;
    }
}

/** 
 * Sets the "planet" variable
 * @param {GameScene} scene Scene containing game objects
 * @param {function(): Number} seededRand Seeded random function (optionally with bound args)
 */
function initPlanets(scene, seededRand) {
    // spawn some planets as a test, their visuals are separated from the collision
    for (let i = 0; i < 100; ++i) {
        let planet = new Planet(i.toString(), scene.planets);
        planet.seed = (seededRand() * Number.MAX_SAFE_INTEGER) | 0;
        planet.color.set(seededRand(), seededRand(), seededRand());
        planet.radius = seededRand() * 200;
        planet.position.set(
            (seededRand() * 8000) - 4000,
            (seededRand() * 8000) - 4000,
            (seededRand() * 8000) - 4000);
    }
    scene.planets.addToScene(scene);
}

/* Application code */

/**
 * Fired from HTML
 */
function gameInitialize(img) {
    if (img instanceof HTMLElement)
        img.remove();

    game = new Game();
    let gui = new GUI("canvas-display");
    let controls = new AppletControl();
    let manager = new THREE.LoadingManager();

    let renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById("3js-viewer"),
        antialias: false
    });
    renderer.setSize(800, 600);
    renderer.domElement.className = "main-canvas";

    game.controls = controls;
    game.renderer = renderer;
    game.manager = manager;
    game.gui = gui;

    /** @type {GameScene} */
    let scene = new THREE.Scene();
    scene.initialize = function() {
        let camera = new THREE.PerspectiveCamera(75, 1, 0.1, 8000);
        scene.camera = camera;

        // Get or initialize seed in local storage
        let seed = localStorage.getItem("seed");
        if (seed === null) {
            seed = Math.random() * Number.MAX_SAFE_INTEGER;
            localStorage.setItem("seed", seed);
        }

        scene.planets = new PlanetManager(game);
        const seededRandom = seededRandomBuilder(seed);
        initPlanets(scene, seededRandom);

        // load space skybox for scene
        const skyLoader = new THREE.CubeTextureLoader();
        skyLoader.setPath("Spaceship/assets/");
        const textureCube = skyLoader.load([
            'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'
        ]);
        scene.background = textureCube;
        
        const loader = new PLYLoader(manager);
        loader.load("Spaceship/assets/ship.ply", (buf) => {
            const material = new THREE.MeshPhongMaterial();
            const spVisual = new THREE.Mesh(buf, material);
            let object = new THREE.Object3D();
            object.add(spVisual);
            scene.add(object);
            object.position.z = -4;
            
            scene.object = object;
            object.tick = Ship.spaceshipTick;
            object.input = Ship.spaceshipInput;
            Ship.spaceshipInit.bind(object)(game, spVisual);

            gui.addEventListener("orbitaccept", (e) => {
                gui.hideOrbitPrompt(true);
                if (scene.object.state == Ship.SHIP_STATE_IDLE)
                    scene.object.state = Ship.SHIP_STATE_ORBIT;
            });
        
            gui.addEventListener("orbitdeny", (e) => {
                gui.hideOrbitPrompt(true);
                if (scene.object.state == Ship.SHIP_STATE_IDLE)
                    scene.object.state = Ship.SHIP_STATE_ORIENT;
            });
        });

        const amb = new THREE.AmbientLight( 0x404040 );
        const sun = new THREE.DirectionalLight( 0xFFFFFF, 0.8 );
        sun.tick = function(dt) {
            this.position.set(Math.sin(performance.now() * 0.00001),
                Math.cos(performance.now() * 0.00001, 0));
        }
        scene.add( amb, sun );
    }

    game.scene = scene;
    scene.initialize();

    controls.domElement = renderer.domElement;
    controls.connect();
    gui.connect();

    renderer.setAnimationLoop(gameAnimate);
}

let lastNow = performance.timeOrigin;

function gameAnimate() {
    const now = performance.now();
    const dt = (now - lastNow) * 0.001; // fraction of a second

    game.controls.update(dt);

    game.scene.traverse((object) => {
        if ('tick' in object)
            object.tick(dt);
    });

    game.renderer.render(game.scene, game.scene.camera);
    lastNow = now;
}

// Give access to HTML scripts
globalThis.gameInitialize = gameInitialize;
