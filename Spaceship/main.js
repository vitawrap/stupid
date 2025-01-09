/** @module Main */

import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Controls} */
let controls;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.Camera} */
let camera;

/** @type {THREE.Object3D} */
let object;

/** @type {THREE.LoadingManager} */
let manager;

/** @type {THREE.Mesh} 
 * Collision mesh for planets
 */
let planets;

/* Util */

/**
 * Move value towards goal with a max delta
 * @param {Number} a 
 * @param {Number} b 
 * @param {Number} maxDelta 
 * @returns {Number} Updated value
 */
Math.moveTowards = (a, b, maxDelta) => {
    if (Math.abs(b - a) <= maxDelta)
        return b;
    return a + Math.sign(b - a) * maxDelta;
}

/* Game */

class AppletControl extends THREE.Controls {

    constructor( object, domElement = null ) {
        super(object, domElement);
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

        const object = this.object;
        if ('input' in object)
            object.input(event.code, true);
    }

    /**
     * Key up event handler
     * @param {KeyboardEvent} event 
     */
    onKeyUp(event) {
        if (this.enabled === false) return;

        const object = this.object;
        if ('input' in object)
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

const YAW_PI = new THREE.Euler(0, Math.PI, 0);

/**
 * @param {Number} dt fraction of a second
 * @this {THREE.Mesh} THREE mesh
 */
function spaceshipTick(dt) {

    // Rotate based on velocity derived from steer
    this.velocity.x = Math.moveTowards(this.velocity.x, this.steer.x, dt);
    this.velocity.y = Math.moveTowards(this.velocity.y, this.steer.y, dt);
    this.velocity.z = Math.moveTowards(this.velocity.z, this.steer.z, dt);
    this.rotateZ(this.velocity.z * dt);
    this.rotateY(this.velocity.y * dt);
    this.rotateX(this.velocity.x * dt);

    // Displace
    this.linVel = Math.moveTowards(this.linVel, this.move, dt);
    let heading = new THREE.Vector3();
    this.getWorldDirection(heading);

    // Raycast test
    let raycaster = this.raycaster;
    raycaster.set(this.position, heading);
    let hits = raycaster.intersectObject(planets, false, []);
    if (hits.length && hits[0].distance < 20)
        console.log("critical: ", hits[0].distance);

    heading.multiplyScalar(30 * (1 + this.linVel) * dt);
    this.position.add(heading);

    // Player ship: Manipulate the camera as well.
    if (this.player) {
        let thisQuat = this.quaternion.clone();
        let relQuat = new THREE.Quaternion();
        relQuat.setFromEuler(YAW_PI);
        thisQuat.multiply(relQuat);
        camera.quaternion.slerp(thisQuat, Math.min(10 * dt, 1.0));

        const time = performance.now().valueOf();
        let camPos = new THREE.Vector3(
            0 + (Math.sin(time * 0.1) * 0.003),
            1.5 + (Math.sin(time * 0.08) * 0.004),
            -4 - this.linVel);
        camPos = this.localToWorld(camPos);
        camera.position.copy(camPos);
    }
}

/**
 * @param {string} keycode KeyboardEvent code
 * @param {boolean} down true: down, false: up
 */
function spaceshipInput(keycode, down) {
    switch (keycode) {
        // Throttle
        case 'ShiftLeft':
        case 'ShiftRight': this.move = down * -2.0; break;
        case 'Space': this.move = down * 2.0;  break;

        // Pitch
        case 'KeyW': this.steer.x = down * 2.0;  break;
        case 'KeyS': this.steer.x = down * -2.0; break;

        // Yaw
        case 'KeyA': this.steer.y = down * 2.0;  break;
        case 'KeyD': this.steer.y = down * -2.0; break;

        // Roll
        case 'KeyE': this.steer.z = down * 2.0;  break;
        case 'KeyQ': this.steer.z = down * -2.0; break;
    }
}

/**
 * @this {THREE.Mesh} THREE mesh
 */
function spaceshipInit(isPlayer) {
    this.player = isPlayer;                     // Flag for locally controlled spaceship
    this.velocity = new THREE.Vector3(0, 0, 0); // Angular velocity
    this.steer = new THREE.Vector3(0, 0, 0);    // input strength: for each axis (PYR)
    
    this.linVel = 0.0;                          // Linear velocity (forward)
    this.move = 0.0;                            // input strength: forward

    this.raycaster = new THREE.Raycaster();     // Ship raycaster
    this.raycaster.firstHitOnly = true;         // BVH setting
}

/* Application code */

function gameInitialize() {
    controls = new AppletControl();
    manager = new THREE.LoadingManager();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 8000);
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 600);
    renderer.domElement.className = "main-canvas";
    renderer.setAnimationLoop(gameAnimate);

    const display = document.getElementById("canvas-display");
    display.appendChild(renderer.domElement);
    controls.domElement = renderer.domElement;
    controls.connect();

    const loader = new PLYLoader(manager);
    loader.load("Spaceship/assets/ship.ply", (buf) => {
        const material = new THREE.MeshPhongMaterial();
        object = new THREE.Mesh(buf, material);
        scene.add(object);
        object.position.z = -4
        
        object.tick = spaceshipTick;
        object.input = spaceshipInput;
        spaceshipInit.bind(object)(true);

        controls.object = object;
    });

    // spawn some planets as a test, their visuals are separated from the collision
    const position = new THREE.Vector3();
    const geoms = [];
    const visuals = [];
    for (let i = 0; i < 200; ++i) {
        position.set(
            (Math.random() * 8000) - 4000,
            (Math.random() * 8000) - 4000,
            (Math.random() * 8000) - 4000);
        
        let mat = new THREE.MeshPhongMaterial();
        mat.color.set(Math.random(), Math.random(), Math.random());
        const pgeom = new THREE.SphereGeometry(Math.random() * 200, 16, 8);
        let visual = new THREE.Mesh(pgeom, mat);
        pgeom.translate(position);
        geoms.push(pgeom);
        visuals.push(visual);
    }
    const geom = BufferGeometryUtils.mergeGeometries(geoms, true);
    planets = new THREE.Mesh(geom);
    planets.visible = false;
    scene.add(planets, ...visuals);

    planets.raycast = acceleratedRaycast;
    geom.boundsTree = new MeshBVH(geom);

    const amb = new THREE.AmbientLight( 0x404040 );
    const sun = new THREE.DirectionalLight( 0xFFFFFF, 0.8 );
    scene.add( amb, sun );
}

let lastNow = performance.timeOrigin;

function gameAnimate() {
    const now = performance.now();
    const dt = (now - lastNow) * 0.001; // fraction of a second

    controls.update(dt);

    scene.traverse((object) => {
        if ('tick' in object)
            object.tick(dt);
    });

    renderer.render(scene, camera);
    lastNow = now;
}

// TODO: Play button initializes the app
gameInitialize();