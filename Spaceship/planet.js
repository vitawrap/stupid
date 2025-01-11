/** @module Planet */
/**
 * Planet aspect and properties generator
 */

import { Vector3 } from 'three';

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

    // MUTABLE:

    /** @type {number} */
    radius;

    /** @type {Vector3} */
    position;

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
}

/**
 * Planets should be managed by a planet manager (a galaxy)
 */
export class PlanetManager {
    /** @type {Map<string, Planet>} */
    #planets = new Map();

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
     * Find the closest registered planet to a point.
     * @param {Vector3} toPoint Point to use as reference
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
     * @param {Vector3} point Test point
     */
    isInsidePlanet(point) {
        const planet = this.getClosestPlanet(point);
        if (planet !== null)
            return planet.position.distanceTo(point) < planet.radius;
        return false;
    }
}

