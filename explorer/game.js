
import * as THREE from "three";

// ================================================
// BIOMAP EXPLORER - 3D 생태 탐험
// ================================================

// 설정
const config = window.BIOMAP_CONFIG || {};
let currentCountry = config.country || "대한민국";
let currentHabitat = config.habitat || "산림";
let currentSeason = "봄";
let isNight = false;
let isPlaying = false;
let yaw = 0;
let pitch = 0;
let elapsed = 0;
let isDragging = false;
let dragMoved = false;
let previousMouseX = 0;
let previousMouseY = 0;

const discovered = new Set();
const interactable = [];
const animatedCreatures = [];
const scenery = [];
const keys = Object.create(null);

// HTML 요소
const container = document.getElementById("game-container");
const introPanel = document.getElementById("intro-panel");
const startButton = document.getElementById("start-button");
const habitatName = document.getElementById("habitat-name");
const speciesPanel = document.getElementById("species-panel");
const speciesEmoji = document.getElementById("species-emoji");
const speciesName = document.getElementById("species-name");
const speciesType = document.getElementById("species-type");
const speciesDescription = document.getElementById("species-description");
const closeSpeciesButton = document.getElementById("close-species");
const discoveryCount = document.getElementById("discovery-count");
const bottomMessage = document.getElementById("bottom-message");
const timeToggle = document.getElementById("time-toggle");
const timeLabel = document.getElementById("time-label");
const seasonSelect = document.getElementById("season-select");

// 서식지 데이터
// 각 생물 데이터: 이름, 이모지, 분류, 설명, 활동 시간
const habitats = {
    "대한민국": {
        "산림": {
            ground: "#78975b",
            species: [
                ["반달가슴곰", "🐻", "동물", "숲에서 열매와 다양한 먹이를 먹으며 살아갑니다.", "dawn"],
                ["고라니", "🦌", "동물", "한국의 숲과 풀밭에서 볼 수 있는 사슴과 동물입니다.", "dawn"],
                ["다람쥐", "🐿️", "동물", "도토리와 나무 열매 등을 먹고 살아갑니다.", "day"],
                ["부엉이", "🦉", "동물", "주로 밤에 활동하며 작은 동물을 사냥합니다.", "night"],
                ["나비", "🦋", "곤충", "꽃의 꿀을 먹으며 식물의 수분을 돕습니다.", "day"],
                ["소나무", "🌲", "식물", "사계절 내내 푸른 잎을 유지하는 침엽수입니다.", "day"],
                ["참나무", "🌳", "식물", "도토리를 맺어 숲의 여러 동물에게 먹이를 제공합니다.", "day"],
                ["고사리", "🌿", "식물", "그늘지고 습한 숲 바닥에서 자라는 양치식물입니다.", "day"]
            ]
        },
        "습지": {
            ground: "#648b65",
            species: [
                ["수달", "🦦", "동물", "물가에서 생활하며 물고기 등을 먹습니다.", "night"],
                ["왜가리", "🐦", "동물", "얕은 물에서 물고기와 작은 동물을 잡아먹습니다.", "day"],
                ["개구리", "🐸", "동물", "물과 육지를 오가며 살아가는 양서류입니다.", "night"],
                ["잠자리", "🪷", "곤충", "물가에서 번식하고 날아다니며 작은 곤충을 잡습니다.", "day"],
                ["수련", "🌸", "수생식물", "잎이 물 위에 떠서 자라는 수생식물입니다.", "day"],
                ["갈대", "🌾", "식물", "습지와 물가에서 무리 지어 자랍니다.", "day"]
            ]
        }
    },
    "브라질": {
        "열대우림": {
            ground: "#39794b",
            species: [
                ["재규어", "🐆", "동물", "열대우림의 먹이사슬에서 중요한 역할을 하는 포식자입니다.", "night"],
                ["나무늘보", "🦥", "동물", "나무 위에서 느리게 움직이며 생활합니다.", "day"],
                ["큰부리새", "🦜", "동물", "큰 부리를 가진 새로 열대우림의 열매를 먹습니다.", "day"],
                ["카피바라", "🐹", "동물", "물가 주변에서 무리 지어 생활하는 대형 설치류입니다.", "dawn"],
                ["잎꾼개미", "🐜", "곤충", "잎 조각을 운반해 균류를 기르며 먹이로 이용합니다.", "day"],
                ["브로멜리아", "🌺", "식물", "잎 사이에 물을 모으기도 하는 열대 식물입니다.", "day"],
                ["야자나무", "🌴", "식물", "따뜻하고 습한 열대 지역에서 자라는 나무입니다."]
            ]
        },
        "습지": {
            ground: "#4e8262",
            species: [
                ["카피바라", "🐹", "동물", "물가에서 생활하며 풀을 먹습니다.", "dawn"],
                ["카이만", "🐊", "동물", "남아메리카의 습지와 강에서 살아가는 악어류입니다.", "night"],
                ["큰부리새", "🦜", "동물", "열대 지역의 숲과 습지 주변에서 먹이를 찾습니다.", "day"],
                ["수련", "🌸", "수생식물", "물 위에 잎과 꽃을 펼치는 수생식물입니다.", "day"],
                ["갈대", "🌾", "식물", "얕은 물과 습한 땅에서 자랍니다.", "day"]
            ]
        }
    },
    "호주": {
        "유칼립투스 숲": {
            ground: "#80905c",
            species: [
                ["코알라", "🐨", "동물", "유칼립투스 잎을 주로 먹고 나무 위에서 생활합니다.", "night"],
                ["캥거루", "🦘", "동물", "강한 뒷다리로 뛰어 이동하는 유대류입니다.", "dawn"],
                ["앵무새", "🦜", "동물", "나무에서 열매와 씨앗 등을 먹습니다.", "day"],
                ["비단벌레", "🪲", "곤충", "숲 생태계의 다양한 생물과 함께 살아가는 곤충입니다.", "day"],
                ["유칼립투스", "🌳", "식물", "호주에 널리 분포하는 나무입니다.", "day"],
                ["뱅크시아", "🌺", "식물", "독특한 꽃차례를 가진 호주 원산 식물입니다.", "day"]
            ]
        },
        "건조 지대": {
            ground: "#b59a68",
            species: [
                ["붉은캥거루", "🦘", "동물", "건조한 호주 내륙 지역에 적응한 유대류입니다.", "dawn"],
                ["에뮤", "🐦", "동물", "날지 못하지만 긴 다리로 빠르게 달리는 큰 새입니다.", "day"],
                ["도마뱀", "🦎", "동물", "건조한 환경에서 살아가는 파충류입니다.", "day"],
                ["뱅크시아", "🌺", "식물", "호주의 여러 환경에 적응해 자라는 식물입니다.", "day"],
                ["아카시아", "🌳", "식물", "건조한 지역에서도 자라는 종이 많은 나무입니다.", "day"]
            ]
        }
    },
    "케냐": {
        "사바나": {
            ground: "#b3a16a",
            species: [
                ["사자", "🦁", "동물", "무리를 이루어 생활하는 대형 고양잇과 동물입니다.", "night"],
                ["기린", "🦒", "동물", "긴 목으로 높은 나무의 잎을 먹습니다.", "day"],
                ["얼룩말", "🦓", "동물", "초식동물로 무리를 이루어 생활합니다.", "day"],
                ["코끼리", "🐘", "동물", "식물을 먹으며 주변 환경을 변화시키기도 합니다.", "dawn"],
                ["쇠똥구리", "🪲", "곤충", "동물의 배설물을 이용해 생태계의 물질 순환을 돕습니다.", "day"],
                ["아카시아", "🌳", "식물", "가시와 작은 잎을 가진 종이 많은 사바나 나무입니다.", "day"],
                ["풀", "🌱", "식물", "많은 초식동물에게 중요한 먹이가 됩니다.", "day"]
            ]
        },
        "초원": {
            ground: "#a9a269",
            species: [
                ["치타", "🐆", "동물", "빠르게 달릴 수 있는 고양잇과 포식자입니다.", "day"],
                ["얼룩말", "🦓", "동물", "초원에서 풀을 먹으며 살아갑니다.", "day"],
                ["영양", "🦌", "동물", "풀과 잎을 먹는 초식동물입니다.", "dawn"],
                ["타조", "🐦", "동물", "날지 못하지만 빠르게 달리는 큰 새입니다.", "day"],
                ["풀", "🌱", "식물", "초원 생태계의 바탕이 되는 식물입니다.", "day"]
            ]
        }
    },
    "캐나다": {
        "침엽수림": {
            ground: "#627f58",
            species: [
                ["무스", "🫎", "동물", "추운 북쪽 숲과 습지에서 살아가는 대형 사슴과 동물입니다.", "dawn"],
                ["비버", "🦫", "동물", "나무를 이용해 물가에 댐을 만들기도 합니다.", "night"],
                ["여우", "🦊", "동물", "작은 포유류와 여러 먹이를 이용하는 포식자입니다.", "night"],
                ["올빼미", "🦉", "동물", "어두운 시간에 활동하는 종이 많습니다.", "night"],
                ["가문비나무", "🌲", "식물", "추운 지역의 숲에서 자라는 침엽수입니다.", "day"],
                ["이끼", "🌿", "식물", "습한 바닥과 나무 표면 등에서 자랍니다.", "day"]
            ]
        },
        "호수 주변": {
            ground: "#66896b",
            species: [
                ["비버", "🦫", "동물", "호수와 강 주변에서 생활하는 반수생 포유류입니다.", "night"],
                ["수달", "🦦", "동물", "물속에서 먹이를 찾는 데 적응한 포유류입니다.", "dawn"],
                ["오리", "🦆", "동물", "호수에서 헤엄치며 먹이를 찾습니다.", "day"],
                ["개구리", "🐸", "동물", "물가에서 살아가는 양서류입니다.", "night"],
                ["수련", "🌸", "수생식물", "호수의 잔잔한 물 위에서 자랄 수 있습니다.", "day"],
                ["갈대", "🌾", "식물", "호숫가의 얕은 물과 습한 땅에서 자랍니다.", "day"]
            ]
        }
    }
};

// 계절별 색상
const seasonColors = {
    "봄": {
        ground: "#8eae70",
        leaves: ["#78aa55", "#9bc66c", "#5f9349"],
        flower: true
    },
    "여름": {
        ground: "#5e8d4c",
        leaves: ["#377b3c", "#4e9849", "#77ae50"],
        flower: true
    },
    "가을": {
        ground: "#a28c58",
        leaves: ["#bd793e", "#d4a34e", "#9b6639"],
        flower: false
    },
    "겨울": {
        ground: "#b6c5b1",
        leaves: ["#52765a", "#6d886b", "#879c80"],
        flower: false
    }
};

const flowerColors = ["#f3a4b8", "#f2d16b", "#d5a9ed", "#ffffff"];

// ================================================
// Three.js 장면 구성
// ================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b8dba0");
scene.fog = new THREE.Fog("#b8dba0", 24, 85);

const camera = new THREE.PerspectiveCamera(
    70,
    1,
    0.1,
    150
);
camera.position.set(0, 1.7, 8);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const width = container?.clientWidth || window.innerWidth;
const height = container?.clientHeight || 600;
renderer.setSize(width, height);
renderer.domElement.style.display = "block";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.cursor = "crosshair";

if (container) {
    container.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

const skyLight = new THREE.HemisphereLight("#e8f5d8", "#526847", 2.0);
scene.add(skyLight);

const sun = new THREE.DirectionalLight("#fff0cc", 2.4);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const groundMaterial = new THREE.MeshStandardMaterial({
    color: "#78975b",
    roughness: 1
});

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.03;
ground.receiveShadow = true;
scene.add(ground);

const clock = new THREE.Clock();

// ================================================
// 공통 함수
// ================================================

function setMessage(message) {
    if (bottomMessage) {
        bottomMessage.textContent = message;
    }
}

function makeMaterial(color, roughness = 0.9) {
    return new THREE.MeshStandardMaterial({ color, roughness });
}

function addMesh(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function makeLabel(text, y = 1.9) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(20,57,35,0.85)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 72, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        })
    );

    sprite.scale.set(2.5, 0.78, 1);
    sprite.position.y = y;
    return sprite;
}

// ================================================
// 나무와 꽃
// ================================================

function makeTree(x, z, scale, index) {
    const group = new THREE.Group();
    const color = seasonColors[currentSeason].leaves[index % 3];

    addMesh(
        group,
        new THREE.CylinderGeometry(0.18, 0.3, 2.5, 7),
        makeMaterial("#765033"),
        0, 1.25, 0
    );

    for (let i = 0; i < 3; i++) {
        addMesh(
            group,
            new THREE.ConeGeometry(1.25 - i * 0.16, 1.9, 7),
            makeMaterial(color),
            0, 2.2 + i * 0.75, 0
        );
    }

    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    world.add(group);
    scenery.push(group);
}

function makeFlower(x, z, index) {
    const group = new THREE.Group();

    addMesh(
        group,
        new THREE.CylinderGeometry(0.025, 0.04, 0.4, 5),
        makeMaterial("#437b3c"),
        0, 0.2, 0
    );

    addMesh(
        group,
        new THREE.SphereGeometry(0.13, 8, 6),
        makeMaterial(flowerColors[index % flowerColors.length]),
        0, 0.44, 0
    );

    group.position.set(x, 0, z);
    world.add(group);
    scenery.push(group);
}

// ================================================
// 생물 모형
// ================================================

function makeCreature(species, x, z, index) {
    const [name, emoji, type, description, activity = "day"] = species;
    const group = new THREE.Group();

    const animalColors = [
        "#b77c4c", "#8b7355", "#d8c59a", "#777b7c",
        "#c2a06b", "#7c8c62", "#d2a4bb", "#7e9fc7"
    ];

    const bodyMat = makeMaterial(animalColors[index % animalColors.length]);
    const darkMat = makeMaterial("#35352e");
    const plant = ["식물", "수생식물", "균류"].includes(type);

    if (["소나무", "참나무", "유칼립투스", "아카시아", "가문비나무", "야자나무"].includes(name)) {
        const trunkHeight = name === "야자나무" ? 2.8 : 2.1;

        addMesh(
            group,
            new THREE.CylinderGeometry(0.15, 0.28, trunkHeight, 7),
            makeMaterial("#765033"),
            0, trunkHeight / 2, 0
        );

        const leafColor = seasonColors[currentSeason].leaves[index % 3];

        if (["소나무", "가문비나무"].includes(name)) {
            for (let i = 0; i < 3; i++) {
                addMesh(
                    group,
                    new THREE.ConeGeometry(0.9 - i * 0.12, 1.5, 7),
                    makeMaterial(leafColor),
                    0, trunkHeight + i * 0.55, 0
                );
            }
        } else {
            const crown = addMesh(
                group,
                new THREE.SphereGeometry(0.9, 10, 8),
                makeMaterial(leafColor),
                0, trunkHeight + 0.6, 0
            );
            crown.scale.set(1.3, 0.8, 1.2);
        }
    } else if (["고사리", "이끼", "풀", "갈대", "진달래", "블루베리", "수련", "난초", "뱅크시아", "브로멜리아"].includes(name)) {
        const plantColor = seasonColors[currentSeason].leaves[index % 3];

        if (name === "수련") {
            addMesh(
                group,
                new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16),
                makeMaterial("#477f4e"),
                0, 0.1, 0
            );

            addMesh(
                group,
                new THREE.SphereGeometry(0.2, 10, 7),
                makeMaterial("#f1a8cf"),
                0, 0.25, 0
            );
        } else {
            for (let i = 0; i < 5; i++) {
                const leaf = addMesh(
                    group,
                    new THREE.ConeGeometry(0.13, 0.7, 5),
                    makeMaterial(plantColor),
                    Math.sin(i * 1.2) * 0.22,
                    0.32,
                    Math.cos(i * 1.2) * 0.22
                );
                leaf.rotation.z = (i - 2) * 0.18;
            }

            if (seasonColors[currentSeason].flower) {
                addMesh(
                    group,
                    new THREE.SphereGeometry(0.15, 8, 6),
                    makeMaterial(flowerColors[index % flowerColors.length]),
                    0, 0.7, 0
                );
            }
        }
    } else {
        // 동물 모형
        const body = addMesh(
            group,
            new THREE.SphereGeometry(0.42, 12, 9),
            bodyMat,
            0, 0.68, 0
        );
        body.scale.set(1.2, 0.8, 1.5);

        addMesh(
            group,
            new THREE.SphereGeometry(0.27, 12, 9),
            bodyMat,
            0, 1.05, -0.42
        );

        addMesh(
            group,
            new THREE.SphereGeometry(0.045, 8, 6),
            darkMat,
            -0.1, 1.1, -0.65
        );

        addMesh(
            group,
            new THREE.SphereGeometry(0.045, 8, 6),
            darkMat,
            0.1, 1.1, -0.65
        );

        for (const legX of [-0.25, 0.25]) {
            for (const legZ of [-0.28, 0.28]) {
                addMesh(
                    group,
                    new THREE.CylinderGeometry(0.06, 0.08, 0.38, 6),
                    bodyMat,
                    legX, 0.25, legZ
                );
            }
        }

        if (["기린", "사자", "얼룩말", "무스", "고라니"].includes(name)) {
            const neck = addMesh(
                group,
                new THREE.CylinderGeometry(0.12, 0.19, 0.7, 8),
                bodyMat,
                0, 1.25, -0.38
            );
            neck.rotation.x = -0.25;
        }

        if (name === "나비") {
            for (const side of [-1, 1]) {
                const wing = addMesh(
                    group,
                    new THREE.SphereGeometry(0.22, 8, 6),
                    makeMaterial("#f0a9d2"),
                    side * 0.2, 1.2, 0
                );
                wing.scale.set(1, 0.7, 0.2);
                wing.userData.wing = true;
            }
        }

        group.add(makeLabel(`${emoji} ${name}`, 1.85));
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    group.userData.species = {
        name,
        emoji,
        type,
        description,
        activity
    };

    group.userData.baseX = x;
    group.userData.baseZ = z;
    group.userData.phase = Math.random() * Math.PI * 2;
    group.userData.walking = !plant;
    group.userData.plant = plant;

    group.traverse((object) => {
        if (object.isMesh || object.isSprite) {
            object.userData.owner = group;
            interactable.push(object);
        }
    });

    world.add(group);
    animatedCreatures.push(group);
    scenery.push(group);
}

// ================================================
// 환경 생성 및 정리
// ================================================

function clearWorld() {
    while (world.children.length > 0) {
        const object = world.children[0];
        world.remove(object);

        object.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach((material) => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            }
        });
    }

    interactable.length = 0;
    animatedCreatures.length = 0;
    scenery.length = 0;
}

function rebuildEnvironment() {
    clearWorld();

    const countryHabitats = habitats[currentCountry] || habitats["대한민국"];

    if (!countryHabitats[currentHabitat]) {
        currentHabitat = Object.keys(countryHabitats)[0];
    }

    const habitat = countryHabitats[currentHabitat];

    if (habitatName) {
        habitatName.textContent = `${currentCountry} · ${currentHabitat}`;
    }

    groundMaterial.color.set(seasonColors[currentSeason].ground);
    groundMaterial.color.lerp(new THREE.Color(habitat.ground), 0.55);

    // 주변 나무
    for (let i = 0; i < 65; i++) {
        const x = (Math.random() - 0.5) * 62;
        const z = (Math.random() - 0.5) * 62;

        if (Math.abs(x) < 4 && z > -8 && z < 12) continue;

        makeTree(x, z, 0.65 + Math.random() * 0.7, i);
    }

    // 대표 생물
    habitat.species.forEach((species, index) => {
        let x;
        let z;
        let attempts = 0;

        do {
            x = (Math.random() - 0.5) * 34;
            z = (Math.random() - 0.5) * 34;
            attempts++;
        } while (
            attempts < 20 &&
            Math.abs(x) < 3 &&
            Math.abs(z - 5) < 4
        );

        makeCreature(species, x, z, index);
    });

    // 꽃과 작은 식물
    for (let i = 0; i < 90; i++) {
        const x = (Math.random() - 0.5) * 42;
        const z = (Math.random() - 0.5) * 42;

        if (seasonColors[currentSeason].flower && Math.random() > 0.4) {
            makeFlower(x, z, i);
        }
    }

    updateSeasonInfo();
    applyTime();
}

// ================================================
// 생물 정보와 발견 기록
// ================================================

function showSpeciesInfo(species) {
    if (!species) return;

    if (speciesEmoji) speciesEmoji.textContent = species.emoji;
    if (speciesName) speciesName.textContent = species.name;
    if (speciesType) speciesType.textContent = species.type;

    const activityText = {
        day: "주로 낮에 활동하는 생물입니다.",
        night: "주로 밤에 활동하는 생물입니다.",
        dawn: "새벽이나 해 질 무렵 활동하는 생물입니다."
    };

    if (speciesDescription) {
        speciesDescription.textContent =
            `${species.description} ${activityText[species.activity] || ""} 실제 활동 시간은 종과 환경에 따라 달라질 수 있습니다.`;
    }

    if (speciesPanel) {
        speciesPanel.classList.remove("hidden");
    }

    if (!discovered.has(species.name)) {
        discovered.add(species.name);

        if (discoveryCount) {
            discoveryCount.textContent = String(discovered.size);
        }
    }

    setMessage(`${species.name} 관찰 기록을 열었어요.`);
}

if (closeSpeciesButton) {
    closeSpeciesButton.addEventListener("click", () => {
        if (speciesPanel) {
            speciesPanel.classList.add("hidden");
        }
    });
}

// ================================================
// 마우스로 시선 이동 및 생물 선택
// ================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

renderer.domElement.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || !isPlaying) return;

    isDragging = true;
    dragMoved = false;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

window.addEventListener("mousemove", (event) => {
    if (!isDragging || !isPlaying) return;

    const dx = event.clientX - previousMouseX;
    const dy = event.clientY - previousMouseY;

    if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragMoved = true;
    }

    yaw -= dx * 0.004;
    pitch -= dy * 0.004;
    pitch = THREE.MathUtils.clamp(pitch, -1.15, 1.15);

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

window.addEventListener("mouseup", (event) => {
    if (!isDragging) return;

    isDragging = false;

    if (!isPlaying || dragMoved || event.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactable, true);

    if (hits.length > 0) {
        const owner = hits[0].object.userData.owner;

        if (owner?.userData?.species) {
            showSpeciesInfo(owner.userData.species);
        }
    }
});

// ================================================
// WASD 이동
// ================================================

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys[key] = true;

    if (isPlaying && ["w", "a", "s", "d", " "].includes(key)) {
        event.preventDefault();
    }

    if (event.key === "Escape") {
        isDragging = false;

        if (speciesPanel) {
            speciesPanel.classList.add("hidden");
        }
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
    Object.keys(keys).forEach((key) => {
        keys[key] = false;
    });

    isDragging = false;
});

function updateMovement(delta) {
    if (!isPlaying) return;

    const forward = new THREE.Vector3(
        -Math.sin(yaw), 0, -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw), 0, -Math.sin(yaw)
    );

    const move = new THREE.Vector3();

    if (keys.w) move.add(forward);
    if (keys.s) move.sub(forward);
    if (keys.d) move.add(right);
    if (keys.a) move.sub(right);

    if (move.lengthSq() > 0) {
        move.normalize();
        const speed = keys.shift ? 10 : 6;
        camera.position.addScaledVector(move, speed * delta);
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -48, 48);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -48, 48);
    camera.position.y = 1.7;
}

// ================================================
// 생물 움직임
// ================================================

function updateCreatures(delta) {
    elapsed += delta;

    animatedCreatures.forEach((group) => {
        const data = group.userData;

        if (!data.species) return;

        if (data.plant) {
            group.position.y = 0;
            return;
        }

        const activity = data.species.activity;

        group.visible = isNight
            ? activity !== "day"
            : activity !== "night";

        if (!group.visible) return;

        if (data.walking) {
            const speed = activity === "night" ? 0.22 : 0.12;

            group.position.x =
                data.baseX +
                Math.sin(elapsed * speed + data.phase) * 0.8;

            group.position.z =
                data.baseZ +
                Math.cos(elapsed * speed + data.phase) * 0.45;
        }

        group.position.y = Math.max(
            0,
            Math.sin(elapsed * 3 + data.phase) * 0.035
        );

        group.traverse((object) => {
            if (object.userData.wing) {
                object.rotation.z =
                    Math.sin(elapsed * 10 + data.phase) * 0.4;
            }
        });
    });
}

// ================================================
// 낮과 밤
// ================================================

function applyTime() {
    if (isNight) {
        scene.background.set("#101d36");
        scene.fog.color.set("#101d36");
        skyLight.intensity = 0.65;
        sun.intensity = 0.35;
        sun.color.set("#9ab9ff");

        if (timeLabel) timeLabel.textContent = "🌙 밤";
        if (timeToggle) timeToggle.textContent = "☀️ 낮으로 전환";
    } else {
        scene.background.set("#b8dba0");
        scene.fog.color.set("#b8dba0");
        skyLight.intensity = 2.0;
        sun.intensity = 2.4;
        sun.color.set("#fff0cc");

        if (timeLabel) timeLabel.textContent = "☀️ 낮";
        if (timeToggle) timeToggle.textContent = "🌙 밤으로 전환";
    }

    updateSeasonInfo();
}

if (timeToggle) {
    timeToggle.addEventListener("click", () => {
        isNight = !isNight;
        applyTime();
        setMessage(isNight ? "밤의 생태계를 관찰해 보세요." : "낮의 생태계를 관찰해 보세요.");
    });
}

// ================================================
// 계절 변경
// ================================================

function updateSeasonInfo() {
    if (seasonSelect) {
        seasonSelect.value = currentSeason;
    }
}

if (seasonSelect) {
    seasonSelect.addEventListener("change", () => {
        if (seasonColors[seasonSelect.value]) {
            currentSeason = seasonSelect.value;
            rebuildEnvironment();
            setMessage(`${currentSeason} 환경으로 바뀌었어요.`);
        }
    });
}

// ================================================
// 시작 버튼
// ================================================

if (startButton) {
    startButton.addEventListener("click", () => {
        isPlaying = true;

        if (introPanel) {
            introPanel.classList.add("hidden");
        }

        setMessage(
            "WASD로 이동하고 마우스로 둘러보세요. 생물을 클릭하면 정보를 볼 수 있어요."
        );

        camera.position.set(0, 1.7, 8);
        yaw = 0;
        pitch = 0;
        camera.rotation.order = "YXZ";
        camera.rotation.set(0, 0, 0);
    });
} else {
    console.error("BIOMAP 오류: index.html에서 id가 start-button인 버튼을 찾지 못했습니다.");
}

// ================================================
// 화면 크기 조정
// ================================================

window.addEventListener("resize", () => {
    const newWidth = container?.clientWidth || window.innerWidth;
    const newHeight = container?.clientHeight || 600;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

// ================================================
// 애니메이션 실행
// ================================================

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    updateMovement(delta);
    updateCreatures(delta);

    renderer.render(scene, camera);
}

// 최초 실행
rebuildEnvironment();
applyTime();
animate();

console.log("BIOMAP EXPLORER: 3D 생태 탐험이 시작되었습니다.");
