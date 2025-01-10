/** @module Util */

import * as THREE from 'three';

/**
 * Move value towards goal with a max delta
 * @param {Number} a 
 * @param {Number} b 
 * @param {Number} maxDelta 
 * @returns {Number} Updated value
 */
export function moveTowards(a, b, maxDelta) {
    if (Math.abs(b - a) <= maxDelta)
        return b;
    return a + Math.sign(b - a) * maxDelta;
}

/**
 * Use THREE's seeded random, but with an increasing seed.
 * @param {Number} initialSeed Seed to start builder with
 */
export function seededRandomBuilder(initialSeed) {
    let seed = initialSeed;
    return () => {
        ++seed;
        return THREE.MathUtils.seededRandom(seed);
    };
}
