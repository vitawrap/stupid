/** @module Human */
/**
 * The human object is used for the player, but also
 * eventually for NPCs.
 */

import * as THREE from 'three';
import { Game } from './main';

/**
 * Human object
 */
export class Human extends THREE.Object3D {
    /** @type {Game} */
    game;

    /**
     * Construct human with game interface
     * @param {Game} game Game interface
     */
    constructor(game) {
        super();
        this.game = game;
    }

    /**
     * @param {Number} dt fraction of a second
     */
    tick(dt) {
        let game = this.game;
        let scene = game.scene;

        // Specific to player character
        if (this === scene.object) {
            
        }
    }

    /**
     * @param {string} keycode KeyboardEvent code
     * @param {boolean} down true: down, false: up
     */
    input(keycode, down) {

    }
}
