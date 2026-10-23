import * as THREE from "three";

// ========================================
// 1. 기본 설정
// ========================================

const container = document.getElementById("game-container");
const startButton = document.getElementById("start-button");
const introPanel = document.getElementById("intro-panel");
const habitatName = document.getElementById("habitat-name");
const bottomMessage = document.getElementById("bottom-message");

const speciesPanel = document.getElementById("species-panel");
const speciesEmoji = document.getElementById("species-emoji");
const speciesName = document.getElementById("species-name");
const speciesType = document.getElementById("species-type");
const speciesDescription = document.getElementById("species-description");
const closeSpeciesButton = document.getElementById("close-species");

const discoveryCount = document.getElementById("discovery-count");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8dba0);
scene.fog = new THREE.Fog(0xb8dba0, 18, 65);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    150
);

camera.position.set(0, 1.7, 8);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);

// ========================================
// 2. 빛과 하늘
// ========================================

const ambientLight = new THREE.HemisphereLight(
    0xe8ffe0,
    0x536344,
    2.2
);

scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xfff2d0, 2.5);
sunlight.position.set(-12, 22, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);

scene.add(sunlight);

// ========================================
// 3. 바닥과 숲 만들기
// ========================================

const groundGeometry = new THREE.PlaneGeometry(120, 120);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x60864b,
    roughness: 1
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;

scene.add(ground);

const forestGroup = new THREE.Group();
scene.add(forestGroup);

function makeTree(x, z, scale = 1) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 2.2, 7),
        new THREE.MeshStandardMaterial({ color: 0x765033 })
    );

    trunk.position.y = 1.1;
    trunk.castShadow = true;
    tree.add(trunk);

    const leafColors = [0x2f6b3b, 0x3f8045, 0x4f914d];

    for (let i = 0; i < 3; i++) {
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.25 - i * 0.18, 2.0, 7),
            new THREE.MeshStandardMaterial({
                color: leafColors[i],
                roughness: 1
            })
        );

        leaves.position.y = 2.3 + i * 0.85;
        leaves.castShadow = true;
        tree.add(leaves);
    }

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    forestGroup.add(tree);
}

function makeRock(x, z, scale = 1) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.7, 0),
        new THREE.MeshStandardMaterial({
            color: 0x858b79,
            roughness: 1
        })
    );

    rock.position.set(x, 0.35 * scale, z);
    rock.scale.set(scale * 1.3, scale, scale);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;

    forestGroup.add(rock);
}

function makeGrass(x, z) {
    const grass = new THREE.Group();

    const grassMaterial = new THREE.MeshStandardMaterial({
        color: [0x6a9b49, 0x7da84c, 0x91b85b][
            Math.floor(Math.random() * 3)
        ]
    });

    for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.65, 4),
            grassMaterial
        );

        blade.position.set(
            (Math.random() - 0.5) * 0.35,
            0.3,
            (Math.random() - 0.5) * 0.35
        );

        blade.rotation.z = (Math.random() - 0.5) * 0.6;
        grass.add(blade);
    }

    grass.position.set(x, 0, z);
    forestGroup.add(grass);
}

// 나무를 배치한다.
// 플레이어가 시작하는 중앙 통로는 비워 둔다.

for (let i = 0; i < 100; i++) {
    let x = (Math.random() - 0.5) * 55;
    let z = (Math.random() - 0.5) * 55;

    if (Math.abs(x) < 4 && z > -8 && z < 12) {
        continue;
    }

    makeTree(
        x,
        z,
        0.7 + Math.random() * 0.8
    );
}

// 바위 배치

for (let i = 0; i < 28; i++) {
    const x = (Math.random() - 0.5) * 45;
    const z = (Math.random() - 0.5) * 45;

    makeRock(
        x,
        z,
        0.5 + Math.random() * 0.8
    );
}

// 풀 배치

for (let i = 0; i < 180; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;

    makeGrass(x, z);
}

// ========================================
// 4. 관찰할 생물 정보
// ========================================

const speciesData = [
    {
        name: "다람쥐",
        emoji: "🐿️",
        type: "포유류",
        description:
            "다람쥐는 숲에서 씨앗과 열매 등을 먹으며 살아갑니다. 먹이를 땅속에 숨기기도 하며, 일부 씨앗은 새로운 식물로 자랄 수 있습니다.",
        color: 0xb97a45,
        x: -3,
        z: 1
    },
    {
        name: "사슴",
        emoji: "🦌",
        type: "포유류",
        description:
            "사슴은 풀과 나뭇잎 등을 먹는 초식동물입니다. 숲의 식물과 동물 사이의 먹이 관계를 이루는 생물입니다.",
        color: 0xa76c3d,
        x: 5,
        z: -5
    },
    {
        name: "여우",
        emoji: "🦊",
        type: "포유류",
        description:
            "여우는 작은 동물과 곤충 등 다양한 먹이를 먹습니다. 생태계에서 먹이 관계를 이루며 살아갑니다.",
        color: 0xc66c35,
        x: -7,
        z: -9
    },
    {
        name: "나비",
        emoji: "🦋",
        type: "곤충",
        description:
            "나비는 꽃의 꿀을 먹기도 합니다. 나비를 비롯한 여러 곤충은 꽃가루를 옮기는 수분 과정에 도움을 줍니다.",
        color: 0x6b7fe0,
        x: 8,
        z: 4
    },
    {
        name: "버섯",
        emoji: "🍄",
        type: "균류",
        description:
            "버섯은 균류에 속합니다. 많은 균류는 죽은 생물의 유기물을 분해하여 물질이 생태계에서 순환하도록 돕습니다.",
        color: 0xd95745,
        x: -2,
        z: -13
    },
    {
        name: "소나무",
        emoji: "🌲",
        type: "식물",
        description:
            "소나무는 바늘 모양의 잎을 가진 상록 침엽수입니다. 식물은 광합성을 통해 생태계에 필요한 유기물을 생산합니다.",
        color: 0x35784b,
        x: 12,
        z: -12
    }
];

// ========================================
// 5. 생물의 3D 모형 만들기
// ========================================

const interactableObjects = [];
const discoveredSpecies = new Set();

function addBodyPart(parent, geometry, material, x, y, z) {
    const part = new THREE.Mesh(geometry, material);

    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;

    parent.add(part);

    return part;
}

function makeAnimal(species) {
    const animal = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: species.color,
        roughness: 0.85
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e382d,
        roughness: 1
    });

    // 몸통
    addBodyPart(
        animal,
        new THREE.SphereGeometry(0.48, 10, 8),
        bodyMaterial,
        0,
        0.65,
        0
    );

    // 머리
    addBodyPart(
        animal,
        new THREE.SphereGeometry(0.3, 10, 8),
        bodyMaterial,
        0,
        1.12,
        -0.32
    );

    // 눈
    addBodyPart(
        animal,
        new THREE.SphereGeometry(0.045, 8, 8),
        darkMaterial,
        -0.12,
        1.18,
        -0.57
    );

    addBodyPart(
        animal,
        new THREE.SphereGeometry(0.045, 8, 8),
        darkMaterial,
        0.12,
        1.18,
        -0.57
    );

    // 귀
    addBodyPart(
        animal,
        new THREE.ConeGeometry(0.12, 0.32, 5),
        bodyMaterial,
        -0.18,
        1.43,
        -0.32
    );

    addBodyPart(
        animal,
        new THREE.ConeGeometry(0.12, 0.32, 5),
        bodyMaterial,
        0.18,
        1.43,
        -0.32
    );

    // 다리
    for (const x of [-0.25, 0.25]) {
        for (const z of [-0.25, 0.25]) {
            addBodyPart(
                animal,
                new THREE.CylinderGeometry(0.07, 0.08, 0.42, 6),
                bodyMaterial,
                x,
                0.25,
                z
            );
        }
    }

    animal.position.set(species.x, 0, species.z);

    // 관찰할 때 생물 정보를 찾을 수 있도록 등록
    animal.userData.species = species;

    animal.traverse((object) => {
        if (object.isMesh) {
            object.userData.species = species;
            interactableObjects.push(object);
        }
    });

    scene.add(animal);

    return animal;
}

function makeButterfly(species) {
    const butterfly = new THREE.Group();

    const wingMaterial = new THREE.MeshStandardMaterial({
        color: species.color,
        side: THREE.DoubleSide,
        roughness: 0.6
    });

    const wingGeometry = new THREE.SphereGeometry(0.22, 8, 6);

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.scale.set(1, 0.65, 0.2);
    leftWing.position.x = -0.18;
    butterfly.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.scale.set(1, 0.65, 0.2);
    rightWing.position.x = 0.18;
    butterfly.add(rightWing);

    addBodyPart(
        butterfly,
        new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        0,
        0,
        0
    );

    butterfly.position.set(species.x, 1.5, species.z);
    butterfly.userData.species = species;

    butterfly.traverse((object) => {
        if (object.isMesh) {
            object.userData.species = species;
            interactableObjects.push(object);
        }
    });

    scene.add(butterfly);

    return butterfly;
}

function makeMushroom(species) {
    const mushroom = new THREE.Group();

    addBodyPart(
        mushroom,
        new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8),
        new THREE.MeshStandardMaterial({ color: 0xf0e6ca }),
        0,
        0.18,
        0
    );

    addBodyPart(
        mushroom,
        new THREE.SphereGeometry(0.3, 10, 6),
        new THREE.MeshStandardMaterial({ color: species.color }),
        0,
        0.42,
        0
    );

    mushroom.position.set(species.x, 0, species.z);
    mushroom.userData.species = species;

    mushroom.traverse((object) => {
        if (object.isMesh) {
            object.userData.species = species;
            interactableObjects.push(object);
        }
    });

    scene.add(mushroom);

    return mushroom;
}

function makePineTree(species) {
    const pine = new THREE.Group();

    addBodyPart(
        pine,
        new THREE.CylinderGeometry(0.14, 0.2, 1.7, 7),
        new THREE.MeshStandardMaterial({ color: 0x765033 }),
        0,
        0.85,
        0
    );

    for (let i = 0; i < 3; i++) {
        addBodyPart(
            pine,
            new THREE.ConeGeometry(0.9 - i * 0.15, 1.4, 7),
            new THREE.MeshStandardMaterial({ color: species.color }),
            0,
            1.5 + i * 0.75,
            0
        );
    }

    pine.position.set(species.x, 0, species.z);
    pine.userData.species = species;

    pine.traverse((object) => {
        if (object.isMesh) {
            object.userData.species = species;
            interactableObjects.push(object);
        }
    });

    scene.add(pine);

    return pine;
}

const movingAnimals = [];

for (const species of speciesData) {
    if (species.name === "나비") {
        movingAnimals.push(makeButterfly(species));
    } else if (species.name === "버섯") {
        makeMushroom(species);
    } else if (species.name === "소나무") {
        makePineTree(species);
    } else {
        movingAnimals.push(makeAnimal(species));
    }
}

// ========================================
// 6. 생물 정보 표시
// ========================================

function showSpeciesInfo(species) {
    if (!species) {
        return;
    }

    speciesEmoji.textContent = species.emoji;
    speciesName.textContent = species.name;
    speciesType.textContent = species.type;
    speciesDescription.textContent = species.description;

    speciesPanel.classList.remove("hidden");

    if (!discoveredSpecies.has(species.name)) {
        discoveredSpecies.add(species.name);
        discoveryCount.textContent = String(discoveredSpecies.size);
    }

    bottomMessage.textContent = `${species.name}을(를) 발견했어요!`;
}

function closeSpeciesInfo() {
    speciesPanel.classList.add("hidden");
}

closeSpeciesButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeSpeciesInfo();
});

// ========================================
// 7. 키보드와 마우스로 이동하기
// ========================================

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
};

let isPlaying = false;

const movementSpeed = 7;
const playerHeight = 1.7;
const mouseSensitivity = 0.002;

let yaw = 0;
let pitch = 0;

const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key in keys) {
        keys[key] = true;
    }

    if (key === "e" && isPlaying) {
        observeInFront();
    }

    if (key === "escape") {
        bottomMessage.textContent =
            "마우스 잠금이 해제되었어요. 다시 화면을 클릭하면 탐험할 수 있어요.";
    }
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (key in keys) {
        keys[key] = false;
    }
});

document.addEventListener("mousemove", (event) => {
    if (!isPlaying || document.pointerLockElement !== renderer.domElement) {
        return;
    }

    yaw -= event.movementX * mouseSensitivity;
    pitch -= event.movementY * mouseSensitivity;

    const limit = Math.PI / 2 - 0.05;

    pitch = Math.max(-limit, Math.min(limit, pitch));

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

function observeInFront() {
    raycaster.setFromCamera(screenCenter, camera);

    const hits = raycaster.intersectObjects(interactableObjects, false);

    if (hits.length === 0) {
        bottomMessage.textContent =
            "생물을 화면 중앙에 맞추고 E 키를 눌러 관찰해 보세요.";
        return;
    }

    const hit = hits[0];

    if (hit.distance > 8) {
        bottomMessage.textContent =
            "생물에게 조금 더 가까이 다가가 보세요.";
        return;
    }

    const species = hit.object.userData.species;

    if (species) {
        showSpeciesInfo(species);
    }
}

startButton.addEventListener("click", () => {
    isPlaying = true;
    introPanel.classList.add("hidden");

    renderer.domElement.requestPointerLock();

    bottomMessage.textContent =
        "WASD로 이동하세요. 생물을 바라보고 E 키를 누르면 관찰할 수 있어요.";
});

renderer.domElement.addEventListener("click", () => {
    if (!isPlaying) {
        return;
    }

    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
        return;
    }

    observeInFront();
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === renderer.domElement) {
        bottomMessage.textContent =
            "탐험 중! 생물을 바라보고 E 키를 누르거나 클릭해서 관찰하세요.";
    }
});

// ========================================
// 8. 플레이어 이동
// ========================================

const clock = new THREE.Clock();

function updateMovement(delta) {
    if (!isPlaying) {
        return;
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const direction = new THREE.Vector3();

    if (keys.w) direction.add(forward);
    if (keys.s) direction.sub(forward);
    if (keys.d) direction.sub(right);
    if (keys.a) direction.add(right);

    if (direction.lengthSq() > 0) {
        direction.normalize();

        const speed = keys.shift ? movementSpeed * 1.5 : movementSpeed;

        camera.position.addScaledVector(
            direction,
            speed * delta
        );
    }

    // 탐험 구역 바깥으로 나가지 않게 한다.
    camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -48,
        48
    );

    camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -48,
        48
    );

    camera.position.y = playerHeight;
}

// ========================================
// 9. 동물과 나비의 움직임
// ========================================

let elapsedTime = 0;

function updateCreatures(delta) {
    elapsedTime += delta;

    movingAnimals.forEach((animal, index) => {
        const species = animal.userData.species;

        if (species && species.name === "나비") {
            animal.position.y =
                1.5 + Math.sin(elapsedTime * 2.5) * 0.25;

            animal.rotation.y =
                Math.sin(elapsedTime * 0.8) * 0.35;
        } else {
            animal.rotation.y =
                Math.sin(elapsedTime * 0.5 + index) * 0.12;
        }
    });
}

// ========================================
// 10. 화면 크기가 바뀌면 조정
// ========================================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ========================================
// 11. 3D 화면 계속 실행하기
// ========================================

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    updateMovement(delta);
    updateCreatures(delta);

    renderer.render(scene, camera);
}

animate();
