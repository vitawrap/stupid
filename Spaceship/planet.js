/** @module Planet */
/**
 * Planet aspect and properties generator
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshBVH } from './three-mesh-bvh.js';
import { Game } from './main.js';
import { Human } from './human.js';
import { makeTerrain } from './world.js';

const textures = [
    "Spaceship/assets/planet1.jpg",
    "Spaceship/assets/planet2.jpg",
    "Spaceship/assets/planet1.jpg"
];

/**
 * Properties for a single planet.
 * This stores a planet's properties as well as potential
 * changes made by the user. (TBD)
 */
export class Planet {
    /** @type {PlanetManager} */
    #manager;

    /** @type {string} */
    #name;

    /** @type {import('./main.js').GameScene?} */
    #scene;

    // MUTABLE:

    /** @type {number} */
    seed;

    /** @type {number} */
    radius;

    /** @type {THREE.Color} */
    color = new THREE.Color();

    /** @type {THREE.Vector3} */
    position = new THREE.Vector3();

    /**
     * Construct a planet, for use with a manager.
     * @param {string} name Name of this planet
     * @param {PlanetManager} manager Planet manager instance
     */
    constructor(name, manager) {
        this.#name = name;
        this.#manager = manager;
        manager.push(this);
    }

    /** Get the planet's name */
    get name() { return this.#name; }

    /** Remove from the manager */
    dispose() {
        this.#manager.remove(this);
    }

    /** Getter to lazy-load scene when needed */
    get scene() {
        if (this.#scene === undefined) {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000.0);

            const sky = new THREE.Color(~this.color.getHex() & 0xFFFFFF).addScalar(0.3);
            scene.fog = new THREE.FogExp2(sky, 0.0025);
            scene.background = sky

            const tex = this.#manager.textureLoader.load(this.textureName);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(128, 128);
            const mat = new THREE.MeshLambertMaterial({ color: this.color, map: tex })

            const plane = makeTerrain(2048, 10.0, [], mat);
            
            const amb = new THREE.AmbientLight( 0x404040 );
            const sun = new THREE.DirectionalLight( 0xFFFFFF, 0.8 );
            sun.position.set(0.3, 0.5, 0.0).normalize()
            
            scene.add(amb, sun, plane);
            this.#scene = scene;
            this.#scene.camera = camera;

            // const boxGeom = new THREE.ConeGeometry(1.5, 3);
            // const boxMat = new THREE.MeshPhongMaterial({ color: 0xDDDDDD });
            // const caster = new THREE.Raycaster();
            // caster.far = 200.0;
            // const vec = new THREE.Vector3();
            // const down = new THREE.Vector3(0, -1, 0);
            // for (let i = 0; i < 100; ++i) {
            //     const box = new THREE.Mesh(boxGeom, boxMat);
            //     vec.set(
            //         (Math.random() * 400.0) - 200.0,
            //         50.0,
            //         (Math.random() * 400.0) - 200.0);

            //     caster.set(vec, down);
            //     /** @type {THREE.Intersection[]} */
            //     const inters = caster.intersectObject(plane, false);
            //     if (inters.length)
            //         vec.copy(inters[0].point);
            //     box.position.copy(vec);
            //     plane.add(box);
            // }

            // add player
            const human = new Human();
            scene.add(human);
            scene.object = human;
        }
        return this.#scene;
    }

    /** Get texture name from planet seed */
    get textureName() {
        return textures[Math.abs(this.seed) % textures.length];
    }
}

/**
 * Planets should be managed by a planet manager (a galaxy)
 */
export class PlanetManager {
    /** @type {Map<string, Planet>} */
    #planets = new Map();

    /** @type {(THREE.BufferGeometry & {boundsTree: MeshBVH})?} */
    #geometry;

    /** @type {THREE.Mesh?} */
    #mesh;

    /** @type {THREE.TextureLoader} */
    #textureLoader;

    /**
     * Construct PlanetManager for a game interface.
     * @param {Game} game Game instance with manager data
     */
    constructor(game) {
        this.#textureLoader = new THREE.TextureLoader(game.manager);
    }

    /**
     * Note: Constructing planets with a manager pushes them automatically.
     * @param {Planet} planet New planet to add
     */
    push(planet) {
        this.#planets.set(planet.name, planet);
    }

    /**
     * Note: This is equivalent to calling {@link Planet.dispose} on a Planet.
     * @param {Planet} planet Planet to remove
     */
    remove(planet) {
        if (this.#planets.has(planet.name))
            this.#planets.delete(planet.name);
    }

    /**
     * Add all planets to scene, with collision.
     * @param {import('./main').GameScene} scene Scene to fill
     */
    addToScene(scene) {
        const position = new THREE.Vector3();
        const geoms = [];
        const visuals = [];
        for (const [k, v] of this.#planets) {
            position.copy(v.position);

            let mat = new THREE.MeshPhongMaterial({
                color: v.color,
                map: this.#textureLoader.load(v.textureName)
            });
            const pgeom = new THREE.SphereGeometry(v.radius, 16, 8);
            
            let visual = new THREE.Mesh(pgeom.clone(), mat);
            visual.position.copy(position);
            visual.tick = function(dt) { this.rotateZ(dt * 0.01); };
            visuals.push(visual);
    
            pgeom.translate(position);
            geoms.push(pgeom);
        }
        this.#geometry = BufferGeometryUtils.mergeGeometries(geoms, true);
        this.#mesh = new THREE.Mesh(this.#geometry);
        this.#mesh.visible = false;
        scene.add(this.#mesh, ...visuals);
        this.#geometry.boundsTree = new MeshBVH(this.#geometry);
    }

    /**
     * Get the geometry BVH if it has been created
     */
    get bvh() {
        return this.#geometry?.boundsTree;
    }

    /**
     * Get the BVH mesh object if it has been created
     */
    get mesh() {
        return this.#mesh;
    }

    /**
     * Get the texture loader of this manager
     */
    get textureLoader() {
        return this.#textureLoader;
    }

    /**
     * Find the closest registered planet to a point.
     * @param {THREE.Vector3} toPoint Point to use as reference
     * @returns {Planet} The closest planet if there was any.
     */
    getClosestPlanet(toPoint) {
        let bestDist = Number.MAX_VALUE;
        let planet = null;
        for (const [k, v] of this.#planets) {
            const dist = v.position.distanceToSquared(toPoint) - (v.radius*v.radius);
            if (dist < bestDist) {
                bestDist = dist;
                planet = v;
            }
        }
        return planet;
    }

    /**
     * Check if point is in a planet
     * @param {THREE.Vector3} point Test point
     */
    isInsidePlanet(point) {
        const planet = this.getClosestPlanet(point);
        if (planet !== null)
            return planet.position.distanceTo(point) < planet.radius;
        return false;
    }

    /**
     * Switch scene to a planet's scene.
     * @param {Game} game Game whose scene must be changed
     * @param {THREE.Vector3} point Test point
     */
    enterClosestPlanet(game, point) {
        const planet = this.getClosestPlanet(point);
        if (planet !== null) {
            const scene = planet.scene;
            game.setScene(scene, scene.camera, scene.object);
            return true;
        }
        return false;
    }
}

