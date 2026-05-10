import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Helper function to interleave arrays
function interleave(a, b) {
	const result = [];
	const len = Math.max(a.length, b.length);
	for (let i = 0; i < len; i++) {
		if (i < a.length) result.push(a[i]);
		if (i < b.length) result.push(b[i]);
	}
	return result;
}

const container = document.getElementById("scene-container");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	container.clientWidth / container.clientHeight,
	0.1,
	1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Sky colours
const dayColor = new THREE.Color(0x4488ff);
const nightColor = new THREE.Color(0x010108);

const floorGeometry = new THREE.CylinderGeometry(15, 15, 0.5, 64);
const floorMaterials = [
	new THREE.MeshLambertMaterial({ color: 0x6b4226 }), // Side (brown)
	new THREE.MeshLambertMaterial({ color: 0x4a7c3f }), // Top (green)
	new THREE.MeshLambertMaterial({ color: 0x6b4226 }), // Bottom (brown)
];
const floor = new THREE.Mesh(floorGeometry, floorMaterials);
floor.position.y = -0.25;
floor.receiveShadow = true;
scene.add(floor);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sun = new THREE.Mesh(
	new THREE.SphereGeometry(2, 16, 16),
	new THREE.MeshBasicMaterial({ color: 0xffdd00 }),
);
scene.add(sun);

const moon = new THREE.Mesh(
	new THREE.SphereGeometry(1.4, 16, 16),
	new THREE.MeshBasicMaterial({ color: 0xdddddd }),
);
scene.add(moon);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
const moonLight = new THREE.DirectionalLight(0x90c9e8, 1);
scene.add(sunLight);
scene.add(moonLight);

// Shadow settings
renderer.shadowMap.enabled = true;
sunLight.castShadow = true;
moonLight.castShadow = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.bias = -0.0001;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.camera.updateProjectionMatrix();

moonLight.shadow.mapSize.width = 4096;
moonLight.shadow.mapSize.height = 4096;
moonLight.shadow.bias = -0.0001;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 200;
moonLight.shadow.camera.left = -30;
moonLight.shadow.camera.right = 30;
moonLight.shadow.camera.top = 30;
moonLight.shadow.camera.bottom = -30;
moonLight.shadow.camera.updateProjectionMatrix();

const controls = new OrbitControls(camera, renderer.domElement);

let plantModel = null;
let canModel = null;

const loader = new GLTFLoader();
loader.load(
	"assets/plant1.glb",
	(gltf) => {
		plantModel = gltf.scene;
		scene.add(plantModel);

		plantModel.rotation.y = Math.PI / 2;

		plantModel.traverse((node) => {
			if (node.isMesh) {
				node.userData.originalColor = node.material.color.clone();
				node.castShadow = true;
				node.receiveShadow = true;
			}
		});

		console.log("Model loaded!");
	},
	(progress) => {
		console.log("Loading...", (progress.loaded / progress.total) * 100 + "%");
	},
	(error) => {
		console.error("Error loading model:", error);
	},
);

let canMixer = null;
let canAction = null;
const clock = new THREE.Clock();

loader.load(
	"assets/watering_can.glb",
	(gltf) => {
		canModel = gltf.scene;
		scene.add(canModel);

		canModel.position.set(2.5, 0, 2.5);
		canModel.scale.set(0.8, 0.8, 0.8);
		canModel.rotation.y = Math.PI / 1.35;

		// Animation settings
		const mixer = new THREE.AnimationMixer(canModel);
        const action = mixer.clipAction(gltf.animations[0]);
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;

        canMixer = mixer;
        canAction = action;

		canModel.traverse((node) => {
			if (node.isMesh) {
				node.castShadow = true;
				node.receiveShadow = true;
			}
		});

		console.log("Model loaded!");
	},
	(progress) => {
		console.log("Loading...", (progress.loaded / progress.total) * 100 + "%");
	},
	(error) => {
		console.error("Error loading model:", error);
	},
);

// Sets camera and controls
camera.position.set(0, 8, 12);
controls.target.set(0, 3, 0);

// Prevents camera from going under floor and limits zoom
controls.maxPolarAngle = Math.PI / 1.8;
controls.minDistance = 5;
controls.maxDistance = 14;
controls.enablePan = false;
controls.update();

// Cloud logic
function makeClouds(n, h, r) {
	let clouds = [];

	for (let i = 0; i < n; i++) {
		const cloud = new THREE.Group();
		const material = new THREE.MeshLambertMaterial({ color: 0xffffff });

		// Each cloud is a cluster of spheres
		const puffs = [
			[0, 0, 0, 1],
			[1.2, 0.2, 0, 0.8],
			[-1.2, 0.1, 0, 0.7],
			[0.5, 0.5, 0, 1],
			[-0.5, 0.4, 0, 1],
		];

		puffs.forEach(([px, py, pz, r]) => {
			const geo = new THREE.SphereGeometry(r, 7, 7);
			const puff = new THREE.Mesh(geo, material);
			puff.position.set(px, py, pz);
			cloud.add(puff);
		});

		cloud.userData.radius = r * 3;
		cloud.userData.height = h + Math.random() * 3;
		clouds.push(cloud);
	}

	return clouds;
}
const clouds = interleave(makeClouds(5, 5, 5), makeClouds(5, 10, 10));
clouds.forEach((c) => scene.add(c));

// Star logic
const starGeometry = new THREE.BufferGeometry();
const starCount = 500;
const starPositions = [];

for (let i = 0; i < starCount; i++) {
	const theta = Math.random() * Math.PI * 2;
	const phi = Math.random() * Math.PI;
	const r = 80;
	starPositions.push(
		r * Math.sin(phi) * Math.cos(theta),
		r * Math.sin(phi) * Math.sin(theta),
		r * Math.cos(phi),
	);
}
starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

let waterLevel = 1.0; // 0 = dead, 1 = fully watered
const waterBar = document.getElementById("water-bar");
let lastWatered = 0;
const waterCooldown = 3; // Seconds before draining resumes after watering
let waterTimer = 0;

function updateWater(delta) {
	waterTimer += delta;

	waterBar.style.width = waterLevel * 100 + "%";

	// Change bar colour as it drains
	if (waterLevel > 0.5) {
		waterBar.style.background = "#4488ff";
	} else if (waterLevel > 0.25) {
		waterBar.style.background = "#ffaa00";
	} else {
		waterBar.style.background = "#ff4444";
	}

	// Scales plant based on water level
	if (plantModel) {
		const minScale = 0.5;
		const maxScale = 1.5;
		const scale = minScale + (waterLevel * (maxScale - minScale));
		
		plantModel.traverse((node) => {
			if (node.isMesh && node.userData.originalColor && node.userData.originalColor.g > node.userData.originalColor.r) {
				node.scale.set(scale, scale, scale);
			}
		});
	}

	// Plant gets more brown as water level depletes
	if (plantModel) {
		plantModel.traverse((node) => {
			if (node.isMesh && node.userData.originalColor && node.userData.originalColor.g > node.userData.originalColor.r) {
				node.material.color.lerpColors(
					node.userData.originalColor,
					new THREE.Color(0x361E0D),
					1 - waterLevel,
				);
			}
		});
	}

	// Delay after watering plant before draining
    if (waterTimer - lastWatered < waterCooldown) return;

	waterLevel = Math.max(0, waterLevel - 0.0005);
}

let cloudAngle = 0;
let dayAngle = Math.PI / 2.5;

function animate() {
	requestAnimationFrame(animate);

	// Update animation clock
	const delta = clock.getDelta();
	if (canMixer) canMixer.update(delta);

	cloudAngle += 0.0002;
	dayAngle += 0.0005;

	// Sun and moon on opposite sides of the same orbit
	sun.position.x = Math.cos(dayAngle) * 60;
	sun.position.y = Math.sin(dayAngle) * 60;

	moon.position.x = Math.cos(dayAngle + Math.PI) * 60;
	moon.position.y = Math.sin(dayAngle + Math.PI) * 60;

	sunLight.position.copy(sun.position);
	moonLight.position.copy(moon.position);

	// Lerps between sky colours
	const t = (sun.position.y / 60 + 1) / 2; // 0 = night, 1 = day
	const skyColor = nightColor.clone().lerp(dayColor, t);
	renderer.setClearColor(skyColor);

	// Light intensity based on sun position
	sunLight.intensity = t * 1.5;
	moonLight.intensity = (1 - t) * 0.5;
	ambientLight.intensity = 0.1 + t * 0.4;

	clouds.forEach((c, i) => {
		const offset = (i / clouds.length) * Math.PI * 2;
		c.position.x = Math.cos(cloudAngle + offset) * c.userData.radius;
		c.position.z = Math.sin(cloudAngle + offset) * c.userData.radius;
		c.position.y = c.userData.height;
		c.lookAt(0, c.position.y, 0);
	});

	starMaterial.opacity = 1 - t;
	starMaterial.transparent = true;

	updateWater(delta);

	controls.update();
	renderer.render(scene, camera);
}
animate();

// Reset button
document.getElementById("reset-btn").addEventListener("click", () => {
	camera.position.set(0, 8, 12);
	controls.target.set(0, 3, 0);
	controls.update();
});

// Flip time of day button
document.getElementById("time-btn").addEventListener("click", () => {
	dayAngle += Math.PI;
});

let watering = false;

// Water plant button
document.getElementById("water-btn").addEventListener("click", () => {
	if (canAction && !watering) {
		// Play animation
        canAction.reset();
        canAction.play();

		watering = true;

		// Update water level after delay
		setTimeout(() => {
            waterLevel = Math.min(1.0, waterLevel + 0.5);
			lastWatered = waterTimer;
			watering = false;
        }, 3000);
    }
});

let wireframe = false;

// Wireframe
document.getElementById("wireframe-btn").addEventListener("click", () => {
    wireframe = !wireframe;
    scene.traverse((node) => {
        if (node.isMesh) {
            node.material.wireframe = wireframe;
        }
    });
});
