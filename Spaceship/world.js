
import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

/** @typedef {(ImprovedNoise | SimplexNoise) & {size: number}} Noise */

/**
 * Create a terrain plane with a custom noise and material.
 * @param {number} size Width and depth
 * @param {number} height Y height
 * @param {Noise[] | Noise | never[]} noise Noise generator
 * @param {THREE.Material} material Material
 */
export function makeTerrain(size, height, noise, material) {
    const planeGeom = new THREE.PlaneGeometry(size, size, 255, 255);
    const vertices = planeGeom.attributes.position.array;

    const noises = noise instanceof Array? noise : [noise];

    for ( let j = 0; j < vertices.length; j += 3 ) {
        let y = 0.0;
        for (let noise of noises) {
            const invSize = noise.size || 1.0;
            y += noise.noise(vertices[ j ] * invSize, vertices[ j + 1 ] * invSize, 0.0);
        }

        vertices[ j + 2 ] = y * height;
    }
    planeGeom.rotateX(Math.PI * -0.5);
    planeGeom.computeVertexNormals();

    const plane = new THREE.Mesh(planeGeom, material);
    plane.position.set(0, -1, 0);
    plane.name = "TERRAIN";
    return plane;
}
