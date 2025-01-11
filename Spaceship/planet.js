/** @module Planet */
/**
 * Planet aspect and properties generator
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshBVH } from './three-mesh-bvh.js';

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

    /** @type {THREE.Scene?} */
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
        if (this.#scene !== undefined)
            return this.#scene;
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
            
            let mat = new THREE.MeshPhongMaterial();
            mat.color.copy(v.color);
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
     * Find the closest registered planet to a point.
     * @param {THREE.Vector3} toPoint Point to use as reference
     * @returns {Planet} The closest planet if there was any.
     */
    getClosestPlanet(toPoint) {
        const bestDist = Number.MAX_VALUE;
        const planet = null;
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
}

