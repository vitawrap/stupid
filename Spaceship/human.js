/** @module Human */
/**
 * The human object is used for the player, but also
 * eventually for NPCs.
 */

import * as THREE from 'three';
import { Game } from './main.js';
import { moveTowards } from './util.js';

const VECTOR_UP = new THREE.Vector3(0, 1, 0);
const WALK_SPEED = 32.0

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const eye = new THREE.Vector3();

/**
 * Human object
 */
export class Human extends THREE.Object3D {
    /** @type {THREE.Mesh} */
    visual = null;

    /** @type {number} */
    eyeHeight = 1.0;

    /** @type {number} */
    angle = 0.0;    // absolute yaw in radians

    /** @type {number} */
    steer = 0.0;    // yaw velocity in rad/sec

    /** @type {THREE.Vector2} */
    move = new THREE.Vector2(0, 0);

    /**
     * Construct human with game interface
     * @param {Game} game Game interface
     * @param {THREE.Mesh} visual Visual mesh
     */
    constructor(visual = null) {
        super();
        if (visual) {
            this.visual = visual;
            this.add(visual);
        }
    }

    /**
     * @param {Number} dt fraction of a second
     */
    tick(dt) {
        let scene = game.scene;

        this.angle += this.steer * dt;

        // rotating the parent object only works for
        // cylinders, ovoids and capsules, not boxes...
        this.setRotationFromAxisAngle(VECTOR_UP, this.angle);

        // Add forward and right vectors from move
        const walkSpeed = -WALK_SPEED * dt;
        this.getWorldDirection(forward);
        right.crossVectors(forward, VECTOR_UP);
        forward.multiplyScalar(this.move.y * walkSpeed);
        right.multiplyScalar(this.move.x * walkSpeed);

        this.position.add(right);
        this.position.add(forward);

        // TODO: Intersect and apply counter-forces from BVH.

        // Specific to player character
        if (this === scene.object) {
            let camera = scene.camera;
            eye.copy(VECTOR_UP);
            eye.multiplyScalar(this.eyeHeight);
            eye.copy(this.position);

            camera.quaternion.copy(this.quaternion);
            camera.position.copy(eye);
        }
    }

    /**
     * @param {string} keycode KeyboardEvent code
     * @param {boolean} down true: down, false: up
     */
    input(keycode, down) {
        switch (keycode) {
            // Walk
            case 'KeyW': this.move.y = down * 1.0;  break;
            case 'KeyS': this.move.y = down * -1.0; break;

            // Yaw
            case 'KeyA': this.steer = down * 1.0;  break;
            case 'KeyD': this.steer = down * -1.0; break;

            // Strafe
            case 'KeyE': this.move.x = down * 1.0;  break;
            case 'KeyQ': this.move.x = down * -1.0; break;
        }
    }
}
