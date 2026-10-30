
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

const discovered = new Set(
    JSON.parse(localStorage.getItem("biomapDiscoveredSpecies") || "[]")
);

const interactable = [];
const animatedCreatures = [];
const scenery = [];
const keys = Object.create(null);

// ================================================
// 코인 및 탐험 미션 상태
// ================================================

let coinBalance = Math.max(
    0,
    Number(localStorage.getItem("biomapCoinBalance")) || 0
);

let questRewardClaimed =
    localStorage.getItem("biomapQuestRewardClaimed") === "true";


const coinObjects = [];
const QUEST_TARGET = 5;
const SPECIES_DISCOVERY_REWARD = 10;
const QUEST_COMPLETION_REWARD = 30;

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
// 코인 및 탐험 목표 HTML 요소
const coinCountElement = document.getElementById("coin-count");
const questDescription = document.getElementById("quest-description");
const questProgressBar = document.getElementById("quest-progress-bar");
const questProgressText = document.getElementById("quest-progress-text");
const questRewardText = document.getElementById("quest-reward");

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

// ================================================
// 추가 생물 데이터
// ================================================

const extraSpecies = {
    "대한민국": {
        "산림": [
            ["멧돼지", "🐗", "동물", "숲 바닥을 돌아다니며 식물과 작은 동물 등 다양한 먹이를 먹습니다.", "dawn"],
            ["청설모", "🐿️", "동물", "나무를 오르내리며 씨앗과 열매를 먹습니다.", "day"],
            ["딱따구리", "🐦", "동물", "나무줄기를 두드려 나무속 곤충을 찾습니다.", "day"],
            ["장수풍뎅이", "🪲", "곤충", "참나무 수액과 익은 과일을 먹는 곤충입니다.", "night"],
            ["버섯", "🍄", "균류", "분해자로서 숲의 물질 순환에 기여합니다.", "night"],
            ["산철쭉", "🌸", "식물", "봄에 꽃을 피워 숲에 색을 더합니다.", "day"]
        ],
        "습지": [
            ["물총새", "🐦", "동물", "물가에서 물고기를 사냥하는 새입니다.", "day"],
            ["청둥오리", "🦆", "동물", "습지에서 헤엄치며 수생식물과 작은 생물을 먹습니다.", "day"],
            ["물방개", "🪲", "곤충", "물속에서 생활하며 작은 수생생물을 먹습니다.", "night"],
            ["물자라", "🪲", "곤충", "얕은 물에서 살아가는 수생 곤충입니다.", "night"],
            ["부들", "🌾", "식물", "습지 가장자리에서 자라는 수생식물입니다.", "day"],
            ["창포", "🌿", "식물", "물가의 습한 땅에서 자라는 식물입니다.", "day"]
        ]
    },
    "브라질": {
        "열대우림": [
            ["붉은마코앵무", "🦜", "동물", "열대우림의 나무 사이를 날아다니며 열매와 씨앗을 먹습니다.", "day"],
            ["거미원숭이", "🐒", "동물", "긴 팔다리와 꼬리를 이용해 나무 사이를 이동합니다.", "day"],
            ["독화살개구리", "🐸", "동물", "습한 열대림 바닥에서 작은 무척추동물을 먹습니다.", "day"],
            ["잎꾼개미 무리", "🐜", "곤충", "잎을 잘라 운반하며 집단으로 생활합니다.", "day"],
            ["난초", "🌺", "식물", "열대우림의 나무나 바위에서 자라는 종류가 많습니다.", "day"],
            ["고무나무", "🌳", "식물", "열대 지역에서 자라는 나무로 수액을 만듭니다.", "day"]
        ],
        "습지": [
            ["분홍저어새", "🦩", "동물", "얕은 물에서 부리로 작은 수생생물을 찾습니다.", "day"],
            ["피라냐", "🐟", "동물", "남아메리카의 강과 습지에 사는 민물고기입니다.", "day"],
            ["아나콘다", "🐍", "동물", "물가와 습지에 적응한 큰 뱀입니다.", "night"],
            ["물장군", "🪲", "곤충", "물속에서 작은 수생동물을 사냥합니다.", "night"],
            ["부레옥잠", "🌿", "수생식물", "물 위에 떠서 자라는 수생식물입니다.", "day"],
            ["파피루스", "🌾", "식물", "열대의 습한 물가에서 자랄 수 있는 식물입니다.", "day"]
        ]
    },
    "호주": {
        "유칼립투스 숲": [
            ["웜뱃", "🐾", "동물", "굴을 파고 생활하며 주로 식물을 먹습니다.", "night"],
            ["쿠카부라", "🐦", "동물", "호주 숲에서 볼 수 있는 물총새과의 새입니다.", "day"],
            ["슈가글라이더", "🐿️", "동물", "나무 사이를 활공하며 작은 동물과 나무 수액 등을 먹습니다.", "night"],
            ["매미", "🪲", "곤충", "식물의 수액을 먹으며 숲에서 소리를 냅니다.", "day"],
            ["왁스플라워", "🌸", "식물", "호주에서 볼 수 있는 꽃식물입니다.", "day"],
            ["티트리", "🌳", "식물", "호주에 자생하는 여러 관목과 나무를 포함하는 식물입니다.", "day"]
        ],
        "건조 지대": [
            ["가시악마도마뱀", "🦎", "동물", "건조한 환경에 적응한 호주의 도마뱀입니다.", "day"],
            ["딩고", "🐕", "동물", "호주에서 살아가는 야생 개과 동물입니다.", "dawn"],
            ["코카투", "🦜", "동물", "호주 여러 지역에서 볼 수 있는 앵무새 무리입니다.", "day"],
            ["개미", "🐜", "곤충", "건조한 환경에서도 땅속과 지표에서 생활합니다.", "day"],
            ["스핀펙스 풀", "🌾", "식물", "건조한 호주 내륙의 모래땅에서 자랍니다.", "day"],
            ["고스트검나무", "🌳", "식물", "호주의 건조 지역에서 볼 수 있는 유칼립투스류 나무입니다.", "day"]
        ]
    },
    "케냐": {
        "사바나": [
            ["하이에나", "🐾", "동물", "사바나에서 먹이를 찾으며 생태계의 먹이 관계에 참여합니다.", "night"],
            ["검은코뿔소", "🦏", "동물", "아프리카의 초원과 관목 지대에서 살아가는 대형 초식동물입니다.", "dawn"],
            ["대머리황새", "🐦", "동물", "아프리카의 습지와 초원 주변에서 먹이를 찾는 큰 새입니다.", "day"],
            ["메뚜기", "🦗", "곤충", "풀과 잎을 먹으며 초원 생태계의 먹이가 되기도 합니다.", "day"],
            ["알로에", "🌵", "식물", "건조한 환경에 적응한 다육식물입니다.", "day"],
            ["우산아카시아", "🌳", "식물", "넓은 우산 모양의 수관을 만드는 사바나 나무입니다.", "day"]
        ],
        "초원": [
            ["톰슨가젤", "🦌", "동물", "아프리카 초원에서 풀을 먹으며 살아가는 영양입니다.", "day"],
            ["누", "🐃", "동물", "무리를 지어 이동하며 풀을 먹는 초식동물입니다.", "dawn"],
            ["사바나멧토끼", "🐇", "동물", "초원과 관목 주변에서 식물을 먹습니다.", "dawn"],
            ["흰개미", "🐜", "곤충", "식물성 물질을 분해하고 토양 환경에 영향을 줍니다.", "night"],
            ["아프리카 데이지", "🌼", "식물", "햇볕이 잘 드는 지역에서 꽃을 피우는 식물입니다.", "day"],
            ["키 큰 사바나 풀", "🌾", "식물", "초식동물의 먹이가 되는 초원 식물입니다.", "day"]
        ]
    },
    "캐나다": {
        "침엽수림": [
            ["캐나다스라소니", "🐈", "동물", "숲에서 작은 포유류를 사냥하는 고양잇과 동물입니다.", "night"],
            ["큰뿔양", "🐏", "동물", "캐나다의 산악 지역에서 볼 수 있는 야생 양입니다.", "day"],
            ["어치", "🐦", "동물", "숲에서 씨앗과 곤충 등 다양한 먹이를 찾습니다.", "day"],
            ["나방", "🦋", "곤충", "숲의 식물과 여러 동물의 먹이 관계에 참여합니다.", "night"],
            ["블루베리 관목", "🫐", "식물", "숲 가장자리에서 자라며 열매를 맺습니다.", "day"],
            ["순록이끼", "🌿", "식물", "추운 북쪽 지역의 땅 위에서 자라는 지의류입니다.", "day"]
        ],
        "호수 주변": [
            ["아비", "🐦", "동물", "호수에서 잠수해 물고기를 잡는 새입니다.", "day"],
            ["캐나다기러기", "🪿", "동물", "호수와 습지 주변에서 먹이를 찾습니다.", "day"],
            ["연어", "🐟", "동물", "일부 종은 강과 바다를 오가며 생활합니다.", "day"],
            ["하루살이", "🪰", "곤충", "유충 시기에 물속에서 생활하는 곤충입니다.", "dawn"],
            ["부들", "🌾", "식물", "호숫가의 얕은 물에서 자라는 식물입니다.", "day"],
            ["물가 버드나무", "🌳", "식물", "습한 호숫가와 강가에서 자랄 수 있는 나무입니다.", "day"]
        ]
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
    new THREE.PlaneGeometry(3000, 3000),
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
// ================================================
// 코인 표시 및 탐험 목표 갱신
// ================================================

function updateCoinDisplay() {
    if (coinCountElement) {
        coinCountElement.textContent = String(coinBalance);
    }
}

function updateQuestDisplay() {
    const progress = Math.min(discovered.size, QUEST_TARGET);
    const percentage = (progress / QUEST_TARGET) * 100;

    if (questProgressBar) {
        questProgressBar.style.width = `${percentage}%`;
    }

    if (questProgressText) {
        questProgressText.textContent =
            `${progress} / ${QUEST_TARGET}종 발견`;
    }

    if (discovered.size >= QUEST_TARGET) {
        if (questDescription) {
            questDescription.textContent =
                "목표 달성! 다양한 생물을 발견했어요.";
        }

        if (questRewardText) {
            questRewardText.textContent =
                questRewardClaimed
                    ? "완료한 미션"
                    : `보상: 코인 ${QUEST_COMPLETION_REWARD}개`;
        }
    } else {
        if (questDescription) {
            questDescription.textContent =
                `새로운 생물을 ${QUEST_TARGET}종 발견해 보세요!`;
        }

        if (questRewardText) {
            questRewardText.textContent =
                `보상: 코인 ${QUEST_COMPLETION_REWARD}개`;
        }
    }
}

function addCoins(amount) {
    coinBalance += amount;
    
        localStorage.setItem(
        "biomapCoinBalance",
        String(coinBalance)
    );
    
    updateCoinDisplay();
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
// 바닥에 놓이는 수집용 코인
// ================================================

function makeCoin(x, z, index) {
    const coinGroup = new THREE.Group();

    // 밝은 금색 코인 재질
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: "#FFD770",
        metalness: 0.55,
        roughness: 0.22,
        emissive: "#FFD770",
        emissiveIntensity: 0.3
    });

    // 밝은 금색 테두리 재질
    const coinEdgeMaterial = new THREE.MeshStandardMaterial({
        color: "#FFD770",
        metalness: 0.65,
        roughness: 0.2,
        emissive: "#EAB94E",
        emissiveIntensity: 0.2
    });

    // 코인 몸통
    const coinBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.1, 64),
        coinEdgeMaterial
    );

    coinBody.rotation.x = Math.PI / 2;
    coinBody.castShadow = true;
    coinBody.receiveShadow = false;
    coinGroup.add(coinBody);

    // C 글자와 금색 배경 텍스처
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");

    // 밝은 금색 그라데이션 배경
    const faceGradient = ctx.createRadialGradient(
        95, 75, 10,
        128, 128, 180
    );

    faceGradient.addColorStop(0, "#FFF5CF");
    faceGradient.addColorStop(0.35, "#FFE6A0");
    faceGradient.addColorStop(0.7, "#FFD770");
    faceGradient.addColorStop(1, "#F5BD48");

    ctx.fillStyle = faceGradient;
    ctx.fillRect(0, 0, 256, 256);

    // 코인 안쪽 둥근 테두리
    ctx.beginPath();
    ctx.arc(128, 128, 111, 0, Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#FFF1B8";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(128, 128, 99, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#EAB94E";
    ctx.stroke();

    // 가운데 C 글자
    ctx.font = "bold 158px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    ctx.shadowColor = "#FFFBEA";
    ctx.shadowBlur = 12;

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFF8D9";
    ctx.strokeText("C", 128, 130);

    const letterGradient = ctx.createLinearGradient(
        70, 50, 190, 205
    );

    letterGradient.addColorStop(0, "#FFFFFF");
    letterGradient.addColorStop(0.45, "#FFF8D9");
    letterGradient.addColorStop(1, "#FFE29A");

    ctx.fillStyle = letterGradient;
    ctx.fillText("C", 128, 130);

    const coinTexture = new THREE.CanvasTexture(canvas);
    coinTexture.colorSpace = THREE.SRGBColorSpace;

    // 코인 앞면과 뒷면 재질
    const coinFaceMaterial = new THREE.MeshBasicMaterial({
        map: coinTexture,
        color: "#FFFFFF",
        side: THREE.DoubleSide
    });

    // 코인 앞면
    const coinFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.315, 64),
        coinFaceMaterial
    );

    coinFace.position.z = 0.052;
    coinGroup.add(coinFace);

    // 코인 뒷면
    const coinBack = new THREE.Mesh(
        new THREE.CircleGeometry(0.315, 64),
        coinFaceMaterial
    );

    coinBack.position.z = -0.052;
    coinBack.rotation.y = Math.PI;
    coinGroup.add(coinBack);

    // 코인에 반짝이는 장식 추가
    const sparkleMaterial = new THREE.MeshBasicMaterial({
        color: "#FFFFFF"
    });

    const sparklePositions = [
        [-0.23, 0.23, 0.058],
        [0.23, -0.23, 0.058],
        [-0.23, -0.23, 0.058],
        [0.23, 0.23, 0.058]
    ];

    sparklePositions.forEach((position) => {
        const sparkle = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 8, 8),
            sparkleMaterial
        );

        sparkle.position.set(
            position[0],
            position[1],
            position[2]
        );

        coinGroup.add(sparkle);
    });

    // 코인 위치와 회전
    coinGroup.position.set(x, 0.85, z);
    coinGroup.rotation.y = index * 0.7;

    // 공중에서 떠오르는 애니메이션에 필요한 값
    coinGroup.userData.baseY = 0.85;
    coinGroup.userData.phase = index * 1.37;
    coinGroup.userData.collected = false;

    world.add(coinGroup);
    coinObjects.push(coinGroup);
}

// ================================================
// 생물 모형
// ================================================

// ================================================
// 생물별 형태를 구분하는 3D 생물 모형
// ================================================

function makeCreature(species, x, z, index) {
    const [name, emoji, type, description, activity = "day"] = species;
    const group = new THREE.Group();

    const animalColors = [
        "#a9784f", "#82715c", "#d7c49b", "#777b7c",
        "#bc945f", "#687e54", "#a87b67", "#657f9c",
        "#d6d0bd", "#654d3d", "#e4bb65", "#806d91"
    ];

    const bodyColor = animalColors[index % animalColors.length];
    const bodyMat = makeMaterial(bodyColor);
    const darkMat = makeMaterial("#292c25");
    const lightMat = makeMaterial("#e9dfc7");
    const greenMat = makeMaterial(
        seasonColors[currentSeason].leaves[index % 3]
    );

    const add = (geometry, material, px, py, pz) =>
        addMesh(group, geometry, material, px, py, pz);

    const ball = (material, px, py, pz, sx, sy, sz) => {
        const mesh = add(
            new THREE.SphereGeometry(1, 12, 8),
            material,
            px, py, pz
        );
        mesh.scale.set(sx, sy, sz);
        return mesh;
    };

    const cone = (material, px, py, pz, radius, height, sides = 8) =>
        add(
            new THREE.ConeGeometry(radius, height, sides),
            material,
            px, py, pz
        );

    const cylinder = (
        material, px, py, pz, radiusTop, radiusBottom, height, sides = 8
    ) =>
        add(
            new THREE.CylinderGeometry(
                radiusTop, radiusBottom, height, sides
            ),
            material,
            px, py, pz
        );

    const connect = (
        material, ax, ay, az, bx, by, bz, radius = 0.05
    ) => {
        const start = new THREE.Vector3(ax, ay, az);
        const end = new THREE.Vector3(bx, by, bz);
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();

        const mesh = add(
            new THREE.CylinderGeometry(
                radius * 0.75, radius, length, 7
            ),
            material,
            (ax + bx) / 2,
            (ay + by) / 2,
            (az + bz) / 2
        );

        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
        );

        return mesh;
    };

    const isPlant = [
        "식물", "수생식물", "균류"
    ].includes(type);

    const treeNames = [
        "소나무", "참나무", "유칼립투스", "아카시아",
        "가문비나무", "야자나무", "고무나무", "티트리",
        "고스트검나무", "우산아카시아", "물가 버드나무"
    ];

    const smallPlantNames = [
        "고사리", "이끼", "풀", "갈대", "진달래",
        "블루베리", "수련", "난초", "뱅크시아",
        "브로멜리아", "산철쭉", "부들", "창포",
        "파피루스", "부레옥잠", "왁스플라워",
        "스핀펙스 풀", "알로에", "아프리카 데이지",
        "키 큰 사바나 풀", "블루베리 관목", "순록이끼",
        "버섯", "아가베"
    ];

    const birdNames = [
        "부엉이", "올빼미", "왜가리", "큰부리새",
        "앵무새", "붉은마코앵무", "딱따구리", "물총새",
        "쿠카부라", "코카투", "어치", "아비",
        "캐나다기러기", "분홍저어새", "대머리황새",
        "타조", "에뮤", "오리"
    ];

    const insectNames = [
        "나비", "잠자리", "장수풍뎅이", "비단벌레",
        "잎꾼개미", "잎꾼개미 무리", "쇠똥구리",
        "물방개", "물자라", "물장군", "매미",
        "개미", "메뚜기", "흰개미", "나방", "하루살이"
    ];

    const fishNames = [
        "피라냐", "연어"
    ];

    const snakeNames = [
        "아나콘다"
    ];

    const frogNames = [
        "개구리", "독화살개구리"
    ];

    const quadrupedNames = [
        "반달가슴곰", "고라니", "다람쥐", "수달",
        "재규어", "나무늘보", "카피바라", "카이만",
        "코알라", "캥거루", "붉은캥거루", "도마뱀",
        "사자", "기린", "얼룩말", "코끼리",
        "치타", "영양", "무스", "비버", "여우",
        "멧돼지", "청설모", "거미원숭이", "웜뱃",
        "슈가글라이더", "딩고", "하이에나", "검은코뿔소",
        "톰슨가젤", "누", "사바나멧토끼",
        "캐나다스라소니", "큰뿔양"
    ];

    // 1. 나무: 굵은 줄기와 여러 가지, 넓은 수관
    if (isPlant && treeNames.includes(name)) {
        const tropical = [
            "야자나무", "고무나무", "유칼립투스",
            "티트리", "고스트검나무"
        ].includes(name);

        const trunkHeight = name === "야자나무" ? 3.3 : 2.2;

        cylinder(
            makeMaterial("#765033"),
            0, trunkHeight / 2, 0,
            0.13, 0.23, trunkHeight, 8
        );

        if (name === "야자나무") {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const endX = Math.cos(angle) * 1.45;
                const endY = trunkHeight + 0.55;
                const endZ = Math.sin(angle) * 1.45;

                connect(
                    makeMaterial("#34713b"),
                    0, trunkHeight, 0,
                    endX, endY, endZ, 0.1
                );

                ball(
                    makeMaterial("#3e8b43"),
                    endX, endY, endZ,
                    0.65, 0.09, 0.22
                );
            }
        } else if (
            name === "소나무" || name === "가문비나무"
        ) {
            for (let i = 0; i < 5; i++) {
                cone(
                    greenMat,
                    0, 1.7 + i * 0.48, 0,
                    1.0 - i * 0.12,
                    1.7,
                    8
                );
            }
        } else {
            const crownCount = name === "아카시아" ||
                name === "우산아카시아" ? 5 : 4;

            for (let i = 0; i < crownCount; i++) {
                const angle = (i / crownCount) * Math.PI * 2;
                const crown = ball(
                    makeMaterial(
                        seasonColors[currentSeason].leaves[i % 3]
                    ),
                    Math.cos(angle) * 0.48,
                    trunkHeight + 0.25 + (i % 2) * 0.22,
                    Math.sin(angle) * 0.48,
                    name === "우산아카시아" ? 0.95 : 0.7,
                    name === "우산아카시아" ? 0.25 : 0.7,
                    name === "우산아카시아" ? 0.95 : 0.7
                );
            }

            ball(
                greenMat,
                0, trunkHeight + 0.5, 0,
                0.85, 0.7, 0.85
            );

            for (let i = 0; i < 3; i++) {
                connect(
                    makeMaterial("#765033"),
                    0, 1.3 + i * 0.2, 0,
                    Math.sin(i * 2.1) * 0.9,
                    2.1 + i * 0.2,
                    Math.cos(i * 2.1) * 0.9,
                    0.055
                );
            }
        }
    }

    // 2. 작은 식물: 잎, 줄기, 꽃, 고사리 잎을 구분
    else if (isPlant && smallPlantNames.includes(name)) {
        const stemMat = makeMaterial("#477b3c");
        const flowerMat = makeMaterial(
            flowerColors[index % flowerColors.length]
        );

        if (name === "수련" || name === "부레옥잠") {
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2;
                const leaf = ball(
                    makeMaterial("#347e48"),
                    Math.cos(angle) * 0.28,
                    0.12,
                    Math.sin(angle) * 0.28,
                    0.42, 0.045, 0.27
                );
                leaf.rotation.y = -angle;
            }

            if (name === "수련") {
                for (let i = 0; i < 6; i++) {
                    const angle = i * Math.PI / 3;
                    ball(
                        flowerMat,
                        Math.cos(angle) * 0.17,
                        0.3,
                        Math.sin(angle) * 0.17,
                        0.13, 0.07, 0.1
                    );
                }

                ball(
                    makeMaterial("#e9b94f"),
                    0, 0.34, 0, 0.1, 0.08, 0.1
                );
            }
        } else if (
            name === "고사리" || name === "갈대" ||
            name === "부들" || name === "파피루스"
        ) {
            for (let i = 0; i < 7; i++) {
                const angle = i * 0.9;
                const height = 0.5 + Math.random() * 0.65;

                connect(
                    stemMat,
                    0, 0.05, 0,
                    Math.cos(angle) * 0.35,
                    height,
                    Math.sin(angle) * 0.35,
                    0.025
                );

                if (name === "고사리") {
                    for (let j = 1; j <= 4; j++) {
                        const t = j / 5;
                        ball(
                            greenMat,
                            Math.cos(angle) * 0.35 * t,
                            height * t,
                            Math.sin(angle) * 0.35 * t,
                            0.17, 0.035, 0.07
                        );
                    }
                } else {
                    ball(
                        greenMat,
                        Math.cos(angle) * 0.35,
                        height,
                        Math.sin(angle) * 0.35,
                        0.07, 0.35, 0.07
                    );
                }
            }
        } else if (name === "버섯") {
            cylinder(
                makeMaterial("#e6d8b9"),
                0, 0.18, 0, 0.09, 0.12, 0.36, 8
            );

            ball(
                makeMaterial("#b85b45"),
                0, 0.4, 0, 0.28, 0.15, 0.28
            );
        } else {
            const leafCount = name === "알로에" ? 8 : 6;

            for (let i = 0; i < leafCount; i++) {
                const angle = i * Math.PI * 2 / leafCount;
                const height = name === "알로에" ? 0.75 : 0.45;

                const leaf = cone(
                    name === "알로에"
                        ? makeMaterial("#568b58")
                        : greenMat,
                    Math.cos(angle) * 0.2,
                    height / 2,
                    Math.sin(angle) * 0.2,
                    name === "알로에" ? 0.15 : 0.13,
                    height,
                    5
                );

                leaf.rotation.z = Math.cos(angle) * 0.4;
                leaf.rotation.x = Math.sin(angle) * 0.4;
            }

            if (seasonColors[currentSeason].flower) {
                for (let i = 0; i < 5; i++) {
                    const angle = i * Math.PI * 2 / 5;
                    ball(
                        flowerMat,
                        Math.cos(angle) * 0.14,
                        0.58,
                        Math.sin(angle) * 0.14,
                        0.12, 0.07, 0.09
                    );
                }

                ball(
                    makeMaterial("#e7bb45"),
                    0, 0.61, 0, 0.07, 0.07, 0.07
                );
            }
        }
    }

    // 3. 새: 두 날개, 부리, 꼬리, 두 다리
    else if (birdNames.includes(name)) {
        const birdBody = ball(
            bodyMat, 0, 0.95, 0, 0.32, 0.27, 0.48
        );

        ball(
            bodyMat, 0, 1.13, -0.32, 0.2, 0.2, 0.2
        );

        // 부리
        const beak = cone(
            makeMaterial("#e4a33d"),
            0, 1.11, -0.56, 0.1, 0.32, 5
        );
        beak.rotation.x = -Math.PI / 2;

        // 눈
        ball(darkMat, -0.12, 1.17, -0.46, 0.035, 0.035, 0.035);
        ball(darkMat, 0.12, 1.17, -0.46, 0.035, 0.035, 0.035);

        // 양쪽 날개
        for (const side of [-1, 1]) {
            const wing = ball(
                name === "큰부리새" || name === "붉은마코앵무"
                    ? makeMaterial("#d04e38")
                    : bodyMat,
                side * 0.31, 1.02, 0,
                0.32, 0.06, 0.2
            );

            wing.userData.wing = true;
            wing.userData.wingSide = side;
        }

        // 꼬리 깃털
        for (let i = -1; i <= 1; i++) {
            const feather = cone(
                bodyMat,
                i * 0.1, 0.91, 0.43,
                0.07, 0.4, 5
            );
            feather.rotation.x = Math.PI / 2;
        }

        // 두 다리
        for (const side of [-1, 1]) {
            connect(
                makeMaterial("#a66c35"),
                side * 0.12, 0.82, 0,
                side * 0.12, 0.55, -0.02,
                0.025
            );
        }

        group.userData.flying = !["타조", "에뮤"].includes(name);
        group.userData.wings = true;
    }

    // 4. 곤충: 여섯 다리, 더듬이, 몸마디, 날개
    else if (insectNames.includes(name)) {
        const antLike = [
            "잎꾼개미", "잎꾼개미 무리", "개미", "흰개미"
        ].includes(name);

        const insectMat = makeMaterial(
            antLike ? "#42352a" :
            name === "나비" ? "#eaa6d1" :
            name === "잠자리" ? "#80c9d9" : "#795a36"
        );

        ball(insectMat, 0, 0.65, 0, 0.13, 0.12, 0.22);
        ball(insectMat, 0, 0.65, -0.22, 0.09, 0.09, 0.1);
        ball(insectMat, 0, 0.65, 0.2, 0.1, 0.1, 0.12);

        // 곤충의 여섯 다리
        for (const side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                const legZ = (i - 1) * 0.13;

                connect(
                    insectMat,
                    side * 0.07, 0.64, legZ,
                    side * 0.22, 0.48, legZ + 0.06,
                    0.018
                );

                connect(
                    insectMat,
                    side * 0.22, 0.48, legZ + 0.06,
                    side * 0.26, 0.42, legZ + 0.12,
                    0.015
                );
            }
        }

        // 더듬이
        for (const side of [-1, 1]) {
            connect(
                insectMat,
                side * 0.035, 0.73, -0.27,
                side * 0.11, 0.88, -0.36,
                0.012
            );
        }

        // 나비와 잠자리의 날개
        if (["나비", "잠자리", "나방", "하루살이"].includes(name)) {
            for (const side of [-1, 1]) {
                const wing = ball(
                    name === "나비"
                        ? makeMaterial("#e7a2d4")
                        : makeMaterial("#b8e4e8"),
                    side * 0.18, 0.76, -0.02,
                    name === "잠자리" ? 0.28 : 0.2,
                    0.025,
                    name === "잠자리" ? 0.09 : 0.18
                );

                wing.userData.wing = true;
                wing.userData.wingSide = side;
            }
        }

        group.userData.flying = [
            "나비", "잠자리", "나방", "하루살이", "매미"
        ].includes(name);
        group.userData.wings = true;
    }

    // 5. 물고기: 길쭉한 몸통, 꼬리지느러미, 가슴지느러미
    else if (fishNames.includes(name)) {
        ball(
            name === "피라냐"
                ? makeMaterial("#8b9b73")
                : makeMaterial("#d68e5b"),
            0, 0.55, 0,
            0.24, 0.17, 0.48
        );

        const tail = cone(
            makeMaterial("#8caa83"),
            0, 0.55, 0.55,
            0.2, 0.38, 4
        );
        tail.rotation.x = Math.PI / 2;

        ball(darkMat, -0.13, 0.61, -0.3, 0.025, 0.025, 0.025);
        ball(darkMat, 0.13, 0.61, -0.3, 0.025, 0.025, 0.025);

        group.userData.flying = false;
        group.userData.swimming = true;
    }

    // 6. 뱀: 길게 이어진 몸통과 머리
    else if (snakeNames.includes(name)) {
        for (let i = 0; i < 9; i++) {
            const t = i / 8;

            ball(
                makeMaterial(i % 2 === 0 ? "#6d8750" : "#a1a66a"),
                Math.sin(t * Math.PI * 2) * 0.18,
                0.18,
                t * 1.3 - 0.6,
                0.13 - t * 0.04,
                0.12 - t * 0.035,
                0.15
            );
        }

        ball(bodyMat, 0, 0.22, -0.68, 0.16, 0.12, 0.18);
        ball(darkMat, -0.07, 0.25, -0.8, 0.025, 0.025, 0.025);
        ball(darkMat, 0.07, 0.25, -0.8, 0.025, 0.025, 0.025);
    }

    // 7. 개구리: 넓은 몸, 큰 눈, 뒷다리
    else if (frogNames.includes(name)) {
        const frogMat = makeMaterial("#62a65a");

        ball(frogMat, 0, 0.42, 0, 0.28, 0.2, 0.3);
        ball(frogMat, 0, 0.59, -0.19, 0.23, 0.16, 0.2);

        for (const side of [-1, 1]) {
            ball(
                makeMaterial("#f0df6b"),
                side * 0.14, 0.72, -0.24,
                0.08, 0.08, 0.08
            );
            ball(
                darkMat,
                side * 0.14, 0.73, -0.29,
                0.035, 0.035, 0.035
            );

            connect(
                frogMat,
                side * 0.18, 0.38, 0.1,
                side * 0.32, 0.18, 0.28,
                0.07
            );
        }
    }

    // 8. 네 발로 걷는 포유류 및 파충류
    else {
        const bodyLength = [
            "기린", "코끼리", "무스", "얼룩말"
        ].includes(name) ? 0.75 : 0.48;

        ball(
            bodyMat,
            0, 0.65, 0,
            0.4, 0.32, bodyLength
        );

        ball(
            bodyMat,
            0, 0.85, -bodyLength * 0.78,
            0.22, 0.22, 0.23
        );

        // 귀
        if (
            ["여우", "반달가슴곰", "고라니", "다람쥐",
             "청설모", "재규어", "코알라", "캥거루"].includes(name)
        ) {
            for (const side of [-1, 1]) {
                ball(
                    bodyMat,
                    side * 0.15, 1.05, -bodyLength * 0.8,
                    0.07, 0.12, 0.06
                );
            }
        }

        // 눈
        ball(darkMat, -0.09, 0.9, -bodyLength - 0.13, 0.035, 0.035, 0.035);
        ball(darkMat, 0.09, 0.9, -bodyLength - 0.13, 0.035, 0.035, 0.035);

        // 코끼리 코
        if (name === "코끼리") {
            connect(
                bodyMat,
                0, 0.85, -bodyLength * 0.9,
                0, 0.52, -bodyLength * 1.15,
                0.09
            );
        }

        // 기린의 긴 목과 작은 머리
        if (name === "기린") {
            connect(
                bodyMat,
                0, 0.75, -0.28,
                0, 1.35, -0.38,
                0.12
            );

            ball(bodyMat, 0, 1.43, -0.4, 0.15, 0.14, 0.16);

            for (const side of [-1, 1]) {
                cylinder(
                    makeMaterial("#765033"),
                    side * 0.09, 1.62, -0.4,
                    0.025, 0.035, 0.18, 5
                );
            }
        }

        // 긴 귀를 가진 토끼류
        if (name === "사바나멧토끼") {
            for (const side of [-1, 1]) {
                const ear = ball(
                    bodyMat,
                    side * 0.1, 1.12, -0.32,
                    0.06, 0.22, 0.07
                );
                ear.rotation.z = side * -0.2;
            }
        }

        // 네 다리
        for (const legX of [-0.25, 0.25]) {
            for (const legZ of [-bodyLength * 0.55, bodyLength * 0.55]) {
                const leg = cylinder(
                    bodyMat,
                    legX, 0.28, legZ,
                    0.055, 0.075, 0.42, 7
                );

                leg.userData.leg = true;
                leg.userData.legPhase = legX + legZ;
            }
        }

        // 꼬리
        if (!["코끼리", "무스", "기린"].includes(name)) {
            const tail = connect(
                bodyMat,
                0, 0.7, bodyLength * 0.8,
                0, 0.55, bodyLength + 0.4,
                0.045
            );
            tail.userData.tail = true;
        }

        // 뿔
        if (["무스", "고라니", "영양", "톰슨가젤", "큰뿔양"].includes(name)) {
            for (const side of [-1, 1]) {
                connect(
                    makeMaterial("#6c5038"),
                    side * 0.09, 1.0, -bodyLength * 0.8,
                    side * 0.22, 1.28, -bodyLength * 0.75,
                    0.035
                );
            }
        }

        // 얼룩말 줄무늬
        if (name === "얼룩말") {
            for (let i = -2; i <= 2; i++) {
                const stripe = ball(
                    makeMaterial("#f4f0df"),
                    0, 0.68, i * 0.13,
                    0.405, 0.33, 0.035
                );
                stripe.rotation.y = i * 0.16;
            }
        }

        // 거미원숭이의 긴 꼬리
        if (name === "거미원숭이") {
            connect(
                bodyMat,
                0, 0.75, 0.35,
                0.15, 0.45, 0.95,
                0.035
            );
        }

        // 캥거루의 큰 뒷다리와 긴 꼬리
        if (["캥거루", "붉은캥거루"].includes(name)) {
            for (const side of [-1, 1]) {
                ball(
                    bodyMat,
                    side * 0.22, 0.28, 0.28,
                    0.13, 0.18, 0.28
                );
            }
        }
    }

    // 생물 이름표
    if (!isPlant) {
        group.add(makeLabel(`${emoji} ${name}`, 2.0));
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    group.userData.species = {
        name, emoji, type, description, activity
    };

    group.userData.baseX = x;
    group.userData.baseZ = z;
    group.userData.phase = Math.random() * Math.PI * 2;
    group.userData.walking = !isPlant;
    group.userData.plant = isPlant;

    group.traverse((object) => {
        if (object.isMesh || object.isSprite) {
            object.userData.owner = group;
            interactable.push(object);
        }
    });

    world.add(group);
    animatedCreatures.push(group);
    scenery.push(group);

    return group;
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
    coinObjects.length = 0;
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

    // 3000 크기의 넓은 탐험 공간에 나무 배치
    for (let i = 0; i < 12000; i++) {
        const x = (Math.random() - 0.5) * 2900;
        const z = (Math.random() - 0.5) * 2900;

        if (Math.abs(x) < 4 && z > -8 && z < 12) continue;

        makeTree(x, z, 0.65 + Math.random() * 0.7, i);
    }

    // 대표 생물
    // 대표 생물과 추가 생물을 함께 배치
    const additionalSpecies =
        extraSpecies[currentCountry]?.[currentHabitat] || [];

    const allSpecies = [
        ...habitat.species,
        ...additionalSpecies
    ];

    allSpecies.forEach((species, index) => {
        const type = species[2];
        const name = species[0];

        const isPlant = [
            "식물", "수생식물", "균류"
        ].includes(type);

        const isInsect = type === "곤충";

        // 시작 위치 주변에 다양한 생물 배치
        const count = isPlant
            ? 30
            : isInsect
                ? 40
                : 35;

        for (let copy = 0; copy < count; copy++) {
            let x;
            let z;
            let attempts = 0;

            do {
                x = (Math.random() - 0.5) * 300;
                z = (Math.random() - 0.5) * 300;
                attempts++;
            } while (
                attempts < 30 &&
                Math.abs(x) < 4 &&
                Math.abs(z - 5) < 5
            );
            
            const creature = makeCreature(
                species,
                x,
                z,
                index * 10 + copy
            );

            // 같은 종이 겹쳐 보이지 않도록 크기를 조금씩 변경
            const size = isPlant
                ? 0.75 + Math.random() * 0.6
                : 0.8 + Math.random() * 0.4;

            creature.scale.setScalar(size);

            // 같은 종 개체들이 한 지점에 몰리지 않도록 배치
            creature.userData.baseX = x;
            creature.userData.baseZ = z;
        }
    });

    // 넓은 탐험 공간에 꽃과 작은 식물 배치
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2900;
        const z = (Math.random() - 0.5) * 2900;

        if (seasonColors[currentSeason].flower && Math.random() > 0.4) {
            makeFlower(x, z, i);
        }
    }

    // 넓은 탐험 공간 전체에 수집용 코인 배치
    for (let i = 0; i < 500; i++) {
        let x;
        let z;
        let attempts = 0;

        do {
            x = (Math.random() - 0.5) * 2900;
            z = (Math.random() - 0.5) * 2900;
            attempts++;
        } while (
            attempts < 40 &&
            Math.abs(x) < 5 &&
            z > 2 &&
            z < 13
        );

        makeCoin(x, z, i);
    }

    updateSeasonInfo();
    applyTime();
    updateCoinDisplay();
    updateQuestDisplay();
}

// ================================================
// 생물 정보와 발견 기록
// ================================================

function showSpeciesInfo(species) {
    if (!species) return;

    if (speciesEmoji) {
        speciesEmoji.textContent = species.emoji;
    }

    if (speciesName) {
        speciesName.textContent = species.name;
    }

    if (speciesType) {
        speciesType.textContent = species.type;
    }

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

        localStorage.setItem(
            "biomapDiscoveredSpecies",
            JSON.stringify([...discovered])
        );

        if (discoveryCount) {
            discoveryCount.textContent = String(discovered.size);
        }

        addCoins(SPECIES_DISCOVERY_REWARD);

        setMessage(
            `새로운 생물 ${species.name} 발견! 코인 ${SPECIES_DISCOVERY_REWARD}개를 획득했어요.`
        );

        if (
            discovered.size >= QUEST_TARGET &&
            !questRewardClaimed
        ) {
            questRewardClaimed = true;

            localStorage.setItem(
                "biomapQuestRewardClaimed",
                "true"
            );

            addCoins(QUEST_COMPLETION_REWARD);

            setMessage(
                `🎉 탐험 목표 달성! 추가 코인 ${QUEST_COMPLETION_REWARD}개를 획득했어요!`
            );
        }
    } else {
        setMessage(`${species.name} 관찰 기록을 열었어요.`);
    }

    updateQuestDisplay();
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

    // 3000 크기의 탐험 공간에서 자유롭게 이동
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -1490, 1490);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -1490, 1490);
    camera.position.y = 1.7;
    
    collectNearbyCoins();
}

// ================================================
// 플레이어 주변의 코인 수집
// ================================================

function collectNearbyCoins() {
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        const coin = coinObjects[i];

        if (!coin || coin.userData.collected) {
            continue;
        }

        const dx = camera.position.x - coin.position.x;
        const dz = camera.position.z - coin.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 1.5) {
            coin.userData.collected = true;
            world.remove(coin);

            coin.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }

                if (object.material) {
                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];

                    materials.forEach((material) => {
                        material.dispose();
                    });
                }
            });

            coinObjects.splice(i, 1);
            addCoins(1);
            setMessage("🪙 코인 1개를 획득했어요!");
        }
    }
}

// ================================================
// 생물 움직임
// ================================================


function updateCreatures(delta) {
    elapsed += delta;

    animatedCreatures.forEach((group) => {
        const data = group.userData;

        if (!data.species) return;

        // 식물은 제자리에서 살짝 흔들리도록 설정
        if (data.plant) {
            group.position.y = 0;

            group.rotation.z =
                Math.sin(elapsed * 1.2 + data.phase) * 0.025;

            return;
        }

        // 낮과 밤이 바뀌어도 생물이 사라지지 않도록 설정
        group.visible = true;

        const activity = data.species.activity;

        // 새와 날아다니는 곤충은 공중에서 움직임
        if (data.flying) {
            group.position.y =
                1.4 +
                Math.sin(elapsed * 2.5 + data.phase) * 0.45;

            group.position.x =
                data.baseX +
                Math.sin(elapsed * 0.45 + data.phase) * 1.5;

            group.position.z =
                data.baseZ +
                Math.cos(elapsed * 0.4 + data.phase) * 1.2;
        }

        // 물고기는 물속에서 움직이는 것처럼 표현
        else if (data.swimming) {
            group.position.y =
                0.25 +
                Math.sin(elapsed * 2 + data.phase) * 0.08;

            group.position.x =
                data.baseX +
                Math.sin(elapsed * 0.5 + data.phase) * 0.7;

            group.position.z =
                data.baseZ +
                Math.cos(elapsed * 0.4 + data.phase) * 0.7;

            group.rotation.y =
                Math.sin(elapsed + data.phase) * 0.25;
        }

        // 그 밖의 동물과 곤충은 지면 주변에서 움직임
        else if (data.walking) {
            const speed = activity === "night" ? 0.22 : 0.12;

            group.position.x =
                data.baseX +
                Math.sin(elapsed * speed + data.phase) * 0.8;

            group.position.z =
                data.baseZ +
                Math.cos(elapsed * speed + data.phase) * 0.45;

            group.position.y = Math.max(
                0,
                Math.sin(elapsed * 3 + data.phase) * 0.035
            );
        }

        // 날개가 있는 생물은 날개를 움직임
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

    // 코인을 공중에서 천천히 회전시키기
    coinObjects.forEach((coin) => {
        if (coin.userData.collected) return;

        coin.rotation.y += delta * 1.8;

        coin.position.y =
            coin.userData.baseY +
            Math.sin(elapsed * 2 + coin.userData.phase) * 0.12;
    });

    renderer.render(scene, camera);
}

// 최초 실행
rebuildEnvironment();
applyTime();
updateCoinDisplay();
updateQuestDisplay();
animate();

console.log("BIOMAP EXPLORER: 3D 생태 탐험이 시작되었습니다.");
