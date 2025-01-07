/** @module Main */

import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.Camera} */
let camera;

function gameInitialize() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 600);
    renderer.domElement.className = "main-canvas";
    renderer.setAnimationLoop(gameAnimate);

    const display = document.getElementById("canvas-display");
    display.appendChild(renderer.domElement);

    const loader = new PLYLoader();
    loader.load("Spaceship/assets/ship.ply", (buf) => {
        let object = new THREE.Mesh(buf);
        scene.add(object);
        object.position.z = -4
        object.rotateX(3);
        object.rotateY(0.5);
    });
}

function gameAnimate() {
    renderer.render(scene, camera);
}

gameInitialize();