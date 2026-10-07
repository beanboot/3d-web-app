import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Renders the model into the respective canvas on the about page
function loadMiniScene(canvasId, modelPath) {
    const canvas = document.getElementById(canvasId);
    canvas.style.display = 'block';

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, 200);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2e1a);

    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / 200, 0.1, 100);
    camera.position.set(0, 1, 2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        scene.add(gltf.scene);

        // Centering the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const centre = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(centre);
        camera.position.set(0, 0, box.getSize(new THREE.Vector3()).length());
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

document.querySelectorAll('.load-model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        loadMiniScene(btn.dataset.canvas, btn.dataset.model);
        btn.style.display = 'none';
    });
});