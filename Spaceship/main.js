/** @module Main */

import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.Camera} */
let camera;

/** @type {THREE.Object3D} */
let object;

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
        const material = new THREE.MeshPhongMaterial();
        object = new THREE.Mesh(buf, material);
        scene.add(object);
        object.position.z = -4
        object.rotateX(2.4);
        object.rotateY(0.5);
    });

    const amb = new THREE.AmbientLight( 0x404040 );
    const sun = new THREE.DirectionalLight( 0xFFFFFF, 0.8 );
    scene.add( amb, sun );
}

function gameAnimate() {
    if (object != undefined)
        object.rotateY(0.1);

    renderer.render(scene, camera);
}

gameInitialize();