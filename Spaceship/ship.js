
import * as THREE from 'three';
import { Game } from './main.js';

/** @typedef {THREE.Object3D & {game: Game, state: Number, timer: Number}} Spaceship */

const YAW_PI = new THREE.Euler(0, Math.PI, 0);
export const SHIP_STATE_IDLE = -1;
export const SHIP_STATE_FLY = 0;
export const SHIP_STATE_ORBIT = 1;
export const SHIP_STATE_ORIENT = 2;

export const SHIP_STAT_MAX = 100;

/**
 * @param {Number} dt fraction of a second
 * @this {Spaceship} ship object
 */
export function spaceshipTick(dt) {
    let game = this.game;
    let isLocal = this === game.scene.object;

    switch (this.state) {
        case SHIP_STATE_FLY:
            // Rotate based on velocity derived from steer
            this.velocity.x = Math.moveTowards(this.velocity.x, this.steer.x, dt);
            this.velocity.y = Math.moveTowards(this.velocity.y, this.steer.y, dt);
            this.velocity.z = Math.moveTowards(this.velocity.z, this.steer.z, dt);
            this.rotateZ(this.velocity.z * dt);
            this.rotateY(this.velocity.y * dt);
            this.rotateX(this.velocity.x * dt);

            // Displace
            this.linVel = Math.moveTowards(this.linVel, this.move, dt);
            const heading = new THREE.Vector3();
            this.getWorldDirection(heading);
            heading.multiplyScalar(30 * (1 + this.linVel) * dt);
            this.position.add(heading);

            // Get closest distance to planet
            /** @type {MeshBVH} */ const bvh = game.scene.planets.bvh;
            const target = bvh.closestPointToPoint(this.position);
            if (target.distance <= 20 && isLocal) {
                const shipPos = this.position.clone();
                const shipNor = new THREE.Vector3();
                this.getWorldDirection(shipNor);
                this.shipNormal = shipNor.multiplyScalar(1.1);  // small offset to get out of dist
                this.orbitNormal = shipPos.sub(target.point).normalize();
                this.timer = 1.0;
                this.state = SHIP_STATE_IDLE;
                game.gui.hideOrbitPrompt(false);
            }
        break;

        // Ship has to back up (interp this.shipNormal -> this.orbitNormal)
        case SHIP_STATE_ORIENT:
            this.timer -= (dt * 0.5);
            const vec = this.orbitNormal.clone();
            vec.lerp(this.shipNormal, this.timer);
            vec.add(this.position);
            this.lookAt(vec);
            if (this.timer <= 0.0)
                this.state = SHIP_STATE_FLY;
        break;

        // Simulate flying into orbit
        case SHIP_STATE_ORBIT:
            this.timer -= (dt * 0.5);
            const scl = Math.max(this.timer, 0.01);
            this.visual.scale.copy(new THREE.Vector3(scl, scl, scl));
            if (this.timer <= 0.0) {
                this.state = SHIP_STATE_IDLE;
                if (isLocal)
                    game.scene.planets?.enterClosestPlanet(game, this.position);
                return;
            }
        break;
    }

    // Player ship: Manipulate the camera as well.
    if (isLocal) {
        let camera = game.scene.camera;

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

        // GUI update
        game.gui.setEnergyBar(this.energy / SHIP_STAT_MAX);
        game.gui.setHealthBar(this.health / SHIP_STAT_MAX);
    }
}

/**
 * @param {string} keycode KeyboardEvent code
 * @param {boolean} down true: down, false: up
 * @this {Spaceship} ship object
 */
export function spaceshipInput(keycode, down) {
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
 * @this {Spaceship} ship object
 */
export function spaceshipInit(game, visual) {
    this.game = game;                           // Access to game interface
    this.velocity = new THREE.Vector3(0, 0, 0); // Angular velocity
    this.steer = new THREE.Vector3(0, 0, 0);    // input strength: for each axis (PYR)
    
    this.linVel = 0.0;                          // Linear velocity (forward)
    this.move = 0.0;                            // input strength: forward
    this.state = SHIP_STATE_FLY;                // Ship state
    this.timer = 0.0;                           // State timer

    this.energy = SHIP_STAT_MAX;                // Ship energy (nitro)
    this.health = SHIP_STAT_MAX;                // Ship integrity

    // Child mesh object
    if (visual instanceof THREE.Mesh) {
        visual.scale.set(1, 1, 1);
        this.visual = visual;
    }
}