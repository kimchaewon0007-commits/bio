
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

// 마을 주민 목록
const villagers = [];

// 현재 대화 중인 주민
let currentTalkingVillager = null;

// 주민 대화 상태
let dialogueCooldown = 0;
let nearbyVillager = null;
let npcChatCooldown = 0;

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
// 생태 탐험 마을과 NPC
// ================================================

// 마을의 오두막, 길, 울타리, 벤치와 자연물을 생성
function makeVillage() {
    // 마을 오브젝트를 담을 그룹
    const village = new THREE.Group();

    // 오두막
    const cabin = new THREE.Group();

    addMesh(
        cabin,
        new THREE.BoxGeometry(6, 3.2, 5),
        makeMaterial("#c99b68"),
        0, 1.6, 0
    );

    // 오두막 지붕
    const roof = addMesh(
        cabin,
        new THREE.ConeGeometry(4.6, 2.5, 4),
        makeMaterial("#754b32"),
        0, 4.2, 0
    );
    roof.rotation.y = Math.PI / 4;

    // 오두막 문
    addMesh(
        cabin,
        new THREE.BoxGeometry(1.1, 2, 0.12),
        makeMaterial("#65432f"),
        0, 1, 2.56
    );

    // 오두막 창문
    for (const side of [-1, 1]) {
        addMesh(
            cabin,
            new THREE.BoxGeometry(0.9, 0.9, 0.12),
            makeMaterial("#a9d9df"),
            side * 1.8, 2.0, 2.56
        );
    }


    // 첫 번째 집
    cabin.position.set(-13, 0, -13);
    village.add(cabin);

        // ================================================
    // 추가 오두막 3채
    // ================================================

    function addExtraCabin(x, z, wallColor, roofColor) {
        const extraCabin = new THREE.Group();

        // 집 몸체
        addMesh(
            extraCabin,
            new THREE.BoxGeometry(5.5, 3, 5),
            makeMaterial(wallColor),
            0, 1.5, 0
        );

        // 집 지붕
        const extraRoof = addMesh(
            extraCabin,
            new THREE.ConeGeometry(4.3, 2.3, 4),
            makeMaterial(roofColor),
            0, 4.1, 0
        );
        extraRoof.rotation.y = Math.PI / 4;

        // 집 문
        addMesh(
            extraCabin,
            new THREE.BoxGeometry(1, 1.9, 0.12),
            makeMaterial("#65432f"),
            0, 0.95, 2.56
        );

        // 집 창문
        for (const side of [-1, 1]) {
            addMesh(
                extraCabin,
                new THREE.BoxGeometry(0.85, 0.85, 0.12),
                makeMaterial("#a9d9df"),
                side * 1.7, 2, 2.56
            );
        }

        extraCabin.position.set(x, 0, z);
        village.add(extraCabin);
    }

    // 마을 곳곳에 집 배치
       // ================================================
    // 마을 전체에 오두막 29채 추가
    // 기존 오두막 1채를 포함하여 총 30채
    // ================================================

    const cabinColors = [
        ["#d6ad7d", "#80533b"],
        ["#c99b68", "#754b32"],
        ["#d8bd91", "#8b6040"],
        ["#c8a47a", "#76513a"],
        ["#dfc49a", "#906344"]
    ];

    const cabinXPositions = [-32, -20, -8, 4, 16, 28];
    const cabinZPositions = [-30, -16, -2, 12, 26];

    let extraCabinIndex = 0;

    for (let row = 0; row < cabinZPositions.length; row++) {
        for (let col = 0; col < cabinXPositions.length; col++) {

            const x = cabinXPositions[col];
            const z = cabinZPositions[row];

            // 기존 오두막과 너무 가까운 위치 하나는 건너뜀
            if (x === -8 && z === -2) {
                continue;
            }

            const colors = cabinColors[
                extraCabinIndex % cabinColors.length
            ];

            addExtraCabin(
                x,
                z,
                colors[0],
                colors[1]
            );

            extraCabinIndex++;
        }
    }


    // ================================================
    // 마을 농사밭
    // ================================================

    // 밭 전체의 흙 바닥
    addMesh(
        village,
        new THREE.BoxGeometry(19, 0.18, 13),
        makeMaterial("#795333"),
        0, 0.1, 17
    );

    // 밭고랑 5줄
    for (let row = 0; row < 5; row++) {
        const cropZ = 12 + row * 2.3;

        // 작물이 심긴 흙 줄
        addMesh(
            village,
            new THREE.BoxGeometry(17, 0.12, 0.85),
            makeMaterial("#9a7047"),
            0, 0.22, cropZ
        );

        // 한 줄에 작물 12개씩 심기
        for (let col = 0; col < 12; col++) {
            const cropX = -7.5 + col * 1.35;

            // 작물 줄기
            addMesh(
                village,
                new THREE.CylinderGeometry(0.07, 0.1, 0.65, 6),
                makeMaterial("#477d3c"),
                cropX, 0.62, cropZ
            );

            // 작물 잎
            for (const side of [-1, 1]) {
                const leaf = addMesh(
                    village,
                    new THREE.SphereGeometry(0.24, 8, 6),
                    makeMaterial("#6eaa4f"),
                    cropX + side * 0.2,
                    0.72,
                    cropZ
                );

                leaf.scale.set(1.3, 0.45, 0.7);
                leaf.rotation.z = side * 0.35;
            }

            // 일부 작물에는 열매 표현
            if ((row + col) % 3 === 0) {
                addMesh(
                    village,
                    new THREE.SphereGeometry(0.16, 8, 6),
                    makeMaterial("#d98b45"),
                    cropX,
                    0.85,
                    cropZ + 0.12
                );
            }
        }
    }


    // ================================================
    // 농사밭 주변 울타리
    // ================================================

    for (let i = 0; i < 9; i++) {
        const x = -9 + i * 2.25;

        addMesh(
            village,
            new THREE.BoxGeometry(0.15, 0.8, 0.15),
            makeMaterial("#765033"),
            x, 0.4, 10
        );

        addMesh(
            village,
            new THREE.BoxGeometry(0.15, 0.8, 0.15),
            makeMaterial("#765033"),
            x, 0.4, 24
        );

        if (i < 8) {
            addMesh(
                village,
                new THREE.BoxGeometry(2.25, 0.12, 0.12),
                makeMaterial("#98704a"),
                x + 1.125, 0.65, 10
            );

            addMesh(
                village,
                new THREE.BoxGeometry(2.25, 0.12, 0.12),
                makeMaterial("#98704a"),
                x + 1.125, 0.65, 24
            );
        }
    }


    // ================================================
    // 우물
    // ================================================

    // 우물 바닥
    addMesh(
        village,
        new THREE.CylinderGeometry(1.2, 1.3, 0.8, 12),
        makeMaterial("#8c8b7c"),
        -12, 0.4, 5
    );

    // 우물 안쪽 물
    addMesh(
        village,
        new THREE.CylinderGeometry(0.85, 0.85, 0.08, 12),
        makeMaterial("#5babc0"),
        -12, 0.78, 5
    );

    // 우물 기둥
    for (const side of [-1, 1]) {
        addMesh(
            village,
            new THREE.BoxGeometry(0.2, 3, 0.2),
            makeMaterial("#765033"),
            -12 + side * 1.1, 2, 5
        );
    }

    // 우물 지붕
    addMesh(
        village,
        new THREE.BoxGeometry(3.2, 0.2, 2.5),
        makeMaterial("#754b32"),
        -12, 3.6, 5
    );


    // ================================================
    // 물통과 나무 상자
    // ================================================

    // 물통 2개
    for (let i = 0; i < 2; i++) {
        addMesh(
            village,
            new THREE.CylinderGeometry(0.45, 0.4, 0.9, 10),
            makeMaterial("#8b6545"),
            11 + i * 1.2, 0.45, 9
        );

        addMesh(
            village,
            new THREE.CylinderGeometry(0.47, 0.47, 0.1, 10),
            makeMaterial("#5babc0"),
            11 + i * 1.2, 0.88, 9
        );
    }

    // 농산물을 담는 나무 상자 4개
    for (let i = 0; i < 4; i++) {
        const crateX = 9 + (i % 2) * 1.4;
        const crateZ = 3 + Math.floor(i / 2) * 1.3;

        addMesh(
            village,
            new THREE.BoxGeometry(1.1, 0.8, 1),
            makeMaterial("#a87948"),
            crateX, 0.4, crateZ
        );

        // 상자 안의 농산물
        addMesh(
            village,
            new THREE.SphereGeometry(0.28, 8, 6),
            makeMaterial(i % 2 === 0 ? "#d98b45" : "#8cae48"),
            crateX, 0.95, crateZ
        );
    }


    // ================================================
    // 건초 더미
    // ================================================

    for (let i = 0; i < 4; i++) {
        const hay = addMesh(
            village,
            new THREE.CylinderGeometry(0.65, 0.65, 1.1, 10),
            makeMaterial("#d5b75e"),
            -17 + i * 1.5, 0.55, 7
        );

        hay.rotation.z = Math.PI / 2;
    }

    // 나머지 집 3채를 복제하여 마을에 배치
    const extraCabinPositions = [
        [13, -13],
        [-13, 15],
        [13, 15]
    ];

    extraCabinPositions.forEach(([x, z], index) => {
        const extraCabin = cabin.clone(true);

        extraCabin.position.set(x, 0, z);
        extraCabin.rotation.y = index * 0.35;

        village.add(extraCabin);
    });


    // 오두막 앞 산책길
    for (let i = 0; i < 18; i++) {
        addMesh(
            village,
            new THREE.BoxGeometry(3.2, 0.08, 1.25),
            makeMaterial(i % 2 === 0 ? "#c5aa7d" : "#b99a6b"),
            0, 0.015, 11 - i * 1.8
        );
    }

    // 마을 주변 울타리
    for (let i = 0; i < 13; i++) {
        const x = -21 + i * 3.5;

        for (const z of [-23, 5]) {
            addMesh(
                village,
                new THREE.BoxGeometry(0.18, 1.1, 0.18),
                makeMaterial("#765033"),
                x, 0.55, z
            );
        }

        if (i < 12) {
            for (const z of [-23, 5]) {
                addMesh(
                    village,
                    new THREE.BoxGeometry(3.5, 0.13, 0.13),
                    makeMaterial("#98704a"),
                    x + 1.75, 0.85, z
                );
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        const z = -20 + i * 3;

        for (const x of [-21, 21]) {
            addMesh(
                village,
                new THREE.BoxGeometry(0.18, 1.1, 0.18),
                makeMaterial("#765033"),
                x, 0.55, z
            );
        }

        if (i < 8) {
            for (const x of [-21, 21]) {
                addMesh(
                    village,
                    new THREE.BoxGeometry(0.13, 0.13, 3),
                    makeMaterial("#98704a"),
                    x, 0.85, z + 1.5
                );
            }
        }
    }

    // 나무 벤치 3개
    const benchPositions = [
        [-7, -4],
        [8, -7],
        [7, 3]
    ];

    benchPositions.forEach(([x, z]) => {
        addMesh(
            village,
            new THREE.BoxGeometry(2.4, 0.18, 0.75),
            makeMaterial("#98633e"),
            x, 0.75, z
        );

        addMesh(
            village,
            new THREE.BoxGeometry(2.4, 0.9, 0.15),
            makeMaterial("#805334"),
            x, 1.15, z + 0.3
        );

        for (const side of [-1, 1]) {
            addMesh(
                village,
                new THREE.BoxGeometry(0.15, 0.75, 0.15),
                makeMaterial("#68452e"),
                x + side * 0.9, 0.38, z
            );
        }
    });

    // 마을 주변 바위
    for (let i = 0; i < 24; i++) {
        const rock = addMesh(
            village,
            new THREE.DodecahedronGeometry(
                0.35 + Math.random() * 0.55,
                0
            ),
            makeMaterial(i % 2 === 0 ? "#888d7b" : "#737b70"),
            (Math.random() - 0.5) * 58,
            0.25,
            (Math.random() - 0.5) * 58
        );

        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );
    }

    // 풀 무리
    for (let i = 0; i < 150; i++) {
        const grass = new THREE.Group();

        for (let j = 0; j < 3; j++) {
            const blade = addMesh(
                grass,
                new THREE.ConeGeometry(0.09, 0.65, 4),
                makeMaterial(
                    ["#477b3c", "#609447", "#83a957"][j]
                ),
                (Math.random() - 0.5) * 0.35,
                0.3,
                (Math.random() - 0.5) * 0.35
            );

            blade.rotation.z = (Math.random() - 0.5) * 0.45;
        }

        grass.position.set(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        );

        village.add(grass);
    }

    // 작은 버섯
    for (let i = 0; i < 22; i++) {
        const mushroom = new THREE.Group();

        addMesh(
            mushroom,
            new THREE.CylinderGeometry(0.07, 0.09, 0.28, 7),
            makeMaterial("#eee0c5"),
            0, 0.14, 0
        );

        addMesh(
            mushroom,
            new THREE.SphereGeometry(0.2, 8, 6),
            makeMaterial("#b85b45"),
            0, 0.32, 0
        );

        mushroom.position.set(
            (Math.random() - 0.5) * 70,
            0,
            (Math.random() - 0.5) * 70
        );

        village.add(mushroom);
    }

    world.add(village);
}

// ================================================
// 고퀄리티 3D 마을 주민 생성
// ================================================

function makeVillager(x, z, isGuide, index) {
    const person = new THREE.Group();

    const names = [
        "루미", "모모", "하루", "보리",
        "두리", "나나", "코코", "토리",
        "초록"
    ];

    const skinColors = [
        "#f4c9a5", "#e7b48d", "#d69b72",
        "#f0c5a0", "#c98e6b"
    ];

    const hairColors = [
        "#49372b", "#30251f", "#8a5433",
        "#d4a15d", "#5c4a70", "#b7a18b"
    ];

    const clothesColors = [
        "#e58c78", "#75a8c9", "#e5bd65",
        "#a88bc5", "#78a77b", "#e5a5b8",
        "#d58c55", "#7e9d91"
    ];

    const skinColor = skinColors[index % skinColors.length];
    const hairColor = hairColors[index % hairColors.length];

    const clothesColor = isGuide
        ? "#477d54"
        : clothesColors[index % clothesColors.length];

    const skinMat = makeMaterial(skinColor);
    const hairMat = makeMaterial(hairColor);
    const clothesMat = makeMaterial(clothesColor);
    const darkMat = makeMaterial("#49372b");
    const shoeMat = makeMaterial("#59483d");

    // 몸통 그룹
    const body = new THREE.Group();
    person.add(body);

    // 둥근 몸통
    addMesh(
        body,
        new THREE.CapsuleGeometry(0.29, 0.42, 5, 10),
        clothesMat,
        0, 1.02, 0
    );

    // 옷깃
    addMesh(
        body,
        new THREE.SphereGeometry(0.13, 12, 8),
        makeMaterial("#fff0d9"),
        0, 1.29, 0.03
    );

    // 허리 장식
    addMesh(
        body,
        new THREE.BoxGeometry(0.43, 0.07, 0.32),
        makeMaterial("#e9d6a8"),
        0, 0.78, 0
    );

    // 목
    addMesh(
        body,
        new THREE.CylinderGeometry(0.095, 0.11, 0.16, 12),
        skinMat,
        0, 1.38, 0
    );

    // 머리
    const head = new THREE.Group();
    head.position.set(0, 1.68, 0);
    person.add(head);

    addMesh(
        head,
        new THREE.SphereGeometry(0.29, 24, 20),
        skinMat,
        0, 0, 0
    );

    // 귀
    for (const side of [-1, 1]) {
        addMesh(
            head,
            new THREE.SphereGeometry(0.075, 12, 10),
            skinMat,
            side * 0.27, -0.02, 0
        );
    }

    // 앞머리
    addMesh(
        head,
        new THREE.SphereGeometry(0.29, 20, 12),
        hairMat,
        0, 0.13, -0.045
    );

    // 앞머리 모양
    addMesh(
        head,
        new THREE.SphereGeometry(0.17, 14, 10),
        hairMat,
        -0.17, 0.06, 0.17
    );

    addMesh(
        head,
        new THREE.SphereGeometry(0.17, 14, 10),
        hairMat,
        0.17, 0.06, 0.17
    );

    // 얼굴 장식
    const eyeMat = new THREE.MeshStandardMaterial({
        color: "#302820",
        roughness: 0.45
    });

    const whiteMat = new THREE.MeshStandardMaterial({
        color: "#ffffff"
    });

    for (const side of [-1, 1]) {
        // 눈 흰자
        addMesh(
            head,
            new THREE.SphereGeometry(0.052, 12, 10),
            whiteMat,
            side * 0.105, -0.015, 0.255
        );

        // 눈동자
        addMesh(
            head,
            new THREE.SphereGeometry(0.031, 10, 8),
            eyeMat,
            side * 0.105, -0.015, 0.292
        );

        // 볼터치
        addMesh(
            head,
            new THREE.SphereGeometry(0.055, 12, 8),
            makeMaterial("#ed9b91"),
            side * 0.19, -0.105, 0.235
        );
    }

    // 코
    addMesh(
        head,
        new THREE.SphereGeometry(0.035, 10, 8),
        makeMaterial("#d99e80"),
        0, -0.075, 0.29
    );

    // 입
    addMesh(
        head,
        new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI),
        makeMaterial("#a65d59"),
        0, -0.15, 0.275
    );

    // 머리 뒤쪽
    addMesh(
        head,
        new THREE.SphereGeometry(0.27, 16, 12),
        hairMat,
        0, -0.04, -0.15
    );

    // 앞치마 또는 가슴 장식
    if (isGuide) {
        addMesh(
            body,
            new THREE.BoxGeometry(0.31, 0.42, 0.035),
            makeMaterial("#d7c18a"),
            0, 0.98, 0.285
        );

        addMesh(
            body,
            new THREE.SphereGeometry(0.07, 10, 8),
            makeMaterial("#e6b85c"),
            0, 1.05, 0.32
        );
    } else {
        // 주민마다 다른 가슴 장식
        addMesh(
            body,
            new THREE.SphereGeometry(0.055, 10, 8),
            makeMaterial(
                ["#f4d58a", "#e9a5a5", "#a9d7c1", "#d6b3e8"][index % 4]
            ),
            0.13, 1.12, 0.25
        );
    }

    // 팔과 다리 관절 그룹
    const limbs = [];

    for (const side of [-1, 1]) {
        // 팔 관절
        const armPivot = new THREE.Group();
        armPivot.position.set(side * 0.31, 1.23, 0);
        person.add(armPivot);

        addMesh(
            armPivot,
            new THREE.CapsuleGeometry(0.085, 0.34, 4, 8),
            clothesMat,
            0, -0.22, 0
        );

        // 손
        addMesh(
            armPivot,
            new THREE.SphereGeometry(0.09, 12, 10),
            skinMat,
            0, -0.45, 0.015
        );

        // 다리 관절
        const legPivot = new THREE.Group();
        legPivot.position.set(side * 0.13, 0.65, 0);
        person.add(legPivot);

        addMesh(
            legPivot,
            new THREE.CapsuleGeometry(0.095, 0.34, 4, 8),
            makeMaterial("#66564a"),
            0, -0.23, 0
        );

        // 신발
        addMesh(
            legPivot,
            new THREE.SphereGeometry(0.12, 12, 8),
            shoeMat,
            0, -0.43, 0.055
        );

        limbs.push({
            arm: armPivot,
            leg: legPivot,
            side
        });
    }

    // 주민별 머리 장식
    if (isGuide) {
        // 숲 해설가 모자
        addMesh(
            head,
            new THREE.CylinderGeometry(0.34, 0.34, 0.07, 20),
            makeMaterial("#d8ad60"),
            0, 0.29, 0
        );

        addMesh(
            head,
            new THREE.CylinderGeometry(0.22, 0.25, 0.23, 16),
            makeMaterial("#477d54"),
            0, 0.43, 0
        );
    } else {
        if (index % 3 === 0) {
            // 꽃 머리핀
            addMesh(
                head,
                new THREE.SphereGeometry(0.09, 10, 8),
                makeMaterial("#f5a6b8"),
                0.24, 0.2, 0.1
            );
        } else if (index % 3 === 1) {
            // 작은 모자
            addMesh(
                head,
                new THREE.SphereGeometry(0.23, 14, 8),
                makeMaterial("#e8c57c"),
                0, 0.22, 0
            );
        }
    }

    // 이름표
    const villagerName = isGuide
        ? "🌿 숲 해설가"
        : names[index % names.length];

    const label = makeLabel(villagerName, 2.65);
    person.add(label);

    person.position.set(x, 0, z);

    // 주민 이동 정보
    person.userData.species = {
        name: villagerName,
        emoji: isGuide ? "🧑‍🌾" : "🧑",
        type: isGuide ? "생태 안내 NPC" : "마을 주민",
        description: isGuide
            ? `${currentCountry} ${currentHabitat}의 생태계를 안내하는 숲 해설가입니다. 다양한 생물과 서식지에 대해 알려줍니다.`
            : `${villagerName}은 마을에서 생활하는 주민입니다. 마을을 돌아다니며 주변 이웃들과 함께 지냅니다.`,
        activity: "day"
    };

    person.userData.baseX = x;
    person.userData.baseZ = z;
    person.userData.phase = Math.random() * Math.PI * 2;
    person.userData.villager = true;
    person.userData.walking = true;
    person.userData.plant = false;
    person.userData.limbs = limbs;
    person.userData.head = head;
    person.userData.walkSpeed = 1.7 + Math.random() * 0.6;
    person.userData.walkRadius = 2.5 + Math.random() * 2.5;
    person.userData.targetX = x;
    person.userData.targetZ = z;
    person.userData.changeTargetTime = 0;
    person.userData.isGuide = isGuide;

    // 모든 주민을 클릭 가능한 대상으로 등록
    person.traverse((object) => {
        if (object.isMesh || object.isSprite) {
            object.userData.owner = person;
            interactable.push(object);
        }
    });

   // 주민 대화 시스템 정보
const villagerNames = [
    "루미", "모모", "하루", "보리",
    "두리", "나나", "코코", "토리"
];

const personalities = [
    "명랑한",
    "조용한",
    "호기심 많은",
    "다정한",
    "장난기 많은",
    "차분한",
    "활발한",
    "친절한"
];

person.userData.villager = true;

person.userData.villagerName = isGuide
    ? "숲 해설가"
    : villagerNames[index % villagerNames.length];

person.userData.personality =
    isGuide
        ? "친절한"
        : personalities[index % personalities.length];

person.userData.dialogueIndex = 0;
person.userData.lastTalkTime = 0;
person.userData.chatting = false;

person.userData.dialogues = isGuide
    ? [
        "안녕하세요! 이 마을의 생태계를 안내해 드릴게요.",
        `${currentCountry}의 ${currentHabitat}에는 다양한 생물이 살고 있어요.`,
        "주변의 생물들을 관찰하면 코인도 얻을 수 있답니다!",
        "식물과 동물은 서로 영향을 주며 살아가요.",
        "자연을 보호하는 것이 생물 다양성을 지키는 첫걸음이에요."
    ]
    : [
        "안녕하세요! 오늘 마을이 참 평화롭네요.",
        "저는 이 마을에서 지내는 게 정말 좋아요!",
        "저기 꽃밭도 한번 구경해 보세요.",
        "요즘 숲에 새로운 생물들이 나타났다고 해요.",
        "마을을 천천히 둘러보면 재미있는 걸 발견할 수 있을 거예요.",
        "오늘은 어떤 모험을 하고 계세요?",
        "다른 주민들과도 이야기해 보셨나요?"
    ];

villagers.push(person);

world.add(person);
animatedCreatures.push(person);

return person;
}

// ================================================
// 마을 주민 배치
// ================================================

function makeVillageNPCs() {
    const villagerPositions = [
        [-17, -10],
        [-9, -9],
        [9, -10],
        [17, -9],
        [-17, 19],
        [-9, 19],
        [9, 19],
        [17, 19]
    ];

    // 일반 주민 8명 생성
    villagerPositions.forEach(([x, z], index) => {
        makeVillager(x, z, false, index);
    });

    // 숲 해설가 생성
    makeVillager(0, -7, true, 0);
}

// ================================================
// 주민 대화 시스템
// ================================================

// 대화창 HTML을 JavaScript로 생성
const dialoguePanel = document.createElement("div");

dialoguePanel.id = "villager-dialogue";
dialoguePanel.innerHTML = `
    <div id="dialogue-header">
        <span id="dialogue-name">마을 주민</span>
        <button id="dialogue-close">✕</button>
    </div>

    <div id="dialogue-content">
        안녕하세요!
    </div>

    <div id="dialogue-footer">
        <span id="dialogue-hint">E 키 또는 버튼을 눌러 대화하기</span>
        <button id="dialogue-next">다음 대화</button>
    </div>
`;

document.body.appendChild(dialoguePanel);

// 주민 대화창 디자인
const dialogueStyle = document.createElement("style");

dialogueStyle.textContent = `
    #villager-dialogue {
        display: none;
        position: fixed;
        left: 50%;
        bottom: 35px;
        transform: translateX(-50%);
        width: min(540px, calc(100% - 30px));
        padding: 20px 22px;
        border: 2px solid #d6e9c9;
        border-radius: 22px;
        background: rgba(250, 255, 245, 0.97);
        color: #31533a;
        box-shadow: 0 12px 40px rgba(20, 50, 25, 0.3);
        z-index: 100;
        font-family: Arial, "Malgun Gothic", sans-serif;
    }

    #dialogue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid #dcebd4;
    }

    #dialogue-name {
        font-size: 18px;
        font-weight: 800;
        color: #39764a;
    }

    #dialogue-close {
        border: none;
        border-radius: 8px;
        padding: 6px 10px;
        background: #e8f2e1;
        color: #31533a;
        cursor: pointer;
    }

    #dialogue-content {
        min-height: 75px;
        padding: 20px 4px;
        font-size: 16px;
        line-height: 1.8;
    }

    #dialogue-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    #dialogue-hint {
        color: #789078;
        font-size: 12px;
    }

    #dialogue-next {
        border: none;
        border-radius: 12px;
        padding: 11px 18px;
        background: #548c5c;
        color: white;
        font-weight: 700;
        cursor: pointer;
    }

    #dialogue-next:hover {
        background: #3e7048;
    }

    #dialogue-close:hover {
        background: #d7e9ce;
    }

    #villager-interaction-hint {
        display: none;
        position: fixed;
        left: 50%;
        bottom: 115px;
        transform: translateX(-50%);
        padding: 12px 20px;
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 14px;
        background: rgba(30, 65, 39, 0.88);
        color: white;
        font-size: 14px;
        font-weight: 700;
        z-index: 90;
        pointer-events: none;
    }

    #villager-speech-bubble {
        display: none;
        position: fixed;
        left: 50%;
        top: 22%;
        transform: translateX(-50%);
        padding: 12px 18px;
        border: 1px solid #d6e9c9;
        border-radius: 16px;
        background: rgba(250, 255, 245, 0.96);
        color: #31533a;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 80;
        pointer-events: none;
        text-align: center;
    }

    #villager-dialogue button {
        font-family: inherit;
    }

    @media (max-width: 600px) {
        #villager-dialogue {
            bottom: 15px;
            padding: 15px;
        }

        #dialogue-content {
            font-size: 14px;
        }

        #dialogue-hint {
            font-size: 10px;
        }
    }
`;

document.head.appendChild(dialogueStyle);

// 가까이 가면 표시되는 안내문
const interactionHint = document.createElement("div");
interactionHint.id = "villager-interaction-hint";
interactionHint.textContent = "E 키를 눌러 주민과 대화하기";
document.body.appendChild(interactionHint);

// 주민이 먼저 말을 걸 때 표시되는 말풍선
const speechBubble = document.createElement("div");
speechBubble.id = "villager-speech-bubble";
document.body.appendChild(speechBubble);

// 대화창 요소
const dialogueNameElement =
    document.getElementById("dialogue-name");

const dialogueContentElement =
    document.getElementById("dialogue-content");

const dialogueNextButton =
    document.getElementById("dialogue-next");

const dialogueCloseButton =
    document.getElementById("dialogue-close");

// 주민과 대화 시작
function startVillagerDialogue(villager) {
    if (!villager || !villager.userData.villager) return;

    currentTalkingVillager = villager;

    const data = villager.userData;

    dialogueNameElement.textContent =
        data.villagerName || "마을 주민";

    dialogueContentElement.textContent =
        data.dialogues[data.dialogueIndex];

    dialoguePanel.style.display = "block";
    interactionHint.style.display = "none";

    setMessage(`${data.villagerName}와 대화를 시작했어요.`);
}

// 다음 대사 표시
function nextVillagerDialogue() {
    if (!currentTalkingVillager) return;

    const data = currentTalkingVillager.userData;

    data.dialogueIndex++;

    if (data.dialogueIndex >= data.dialogues.length) {
        data.dialogueIndex = 0;
    }

    dialogueContentElement.textContent =
        data.dialogues[data.dialogueIndex];
}

// 대화 종료
function closeVillagerDialogue() {
    dialoguePanel.style.display = "none";
    currentTalkingVillager = null;
}

// 버튼 이벤트
dialogueNextButton.addEventListener(
    "click",
    nextVillagerDialogue
);

dialogueCloseButton.addEventListener(
    "click",
    closeVillagerDialogue
);

// 주민이 플레이어에게 먼저 말 걸기
function villagerGreeting(villager) {
    if (!villager) return;

    const data = villager.userData;

    const greetings = [
        `${data.villagerName}: 안녕하세요!`,
        `${data.villagerName}: 오늘도 마을을 구경하고 계시네요!`,
        `${data.villagerName}: 저기 예쁜 꽃이 피었어요!`,
        `${data.villagerName}: 새로운 생물을 발견하셨나요?`,
        `${data.villagerName}: 잠깐 이야기 나누실래요?`
    ];

    speechBubble.textContent =
        greetings[Math.floor(Math.random() * greetings.length)];

    speechBubble.style.display = "block";

    dialogueCooldown = 8;

    setMessage(
        `${data.villagerName}이(가) 먼저 인사를 건넸어요.`
    );
}

// 주민끼리 대화하는 행동
function updateVillagerSocial(delta) {
    npcChatCooldown -= delta;

    if (npcChatCooldown > 0) return;

    npcChatCooldown = 5 + Math.random() * 5;

    if (villagers.length < 2) return;

    const firstIndex =
        Math.floor(Math.random() * villagers.length);

    const first = villagers[firstIndex];

    if (!first || first.userData.isGuide) return;

    let second = null;

    for (let i = 0; i < villagers.length; i++) {
        const candidate = villagers[i];

        if (
            candidate !== first &&
            candidate.position.distanceTo(first.position) < 5
        ) {
            second = candidate;
            break;
        }
    }

    if (!second) return;

    const firstData = first.userData;
    const secondData = second.userData;

    firstData.chatting = true;
    secondData.chatting = true;

    const conversations = [
        [
            "오늘 날씨가 정말 좋네요!",
            "맞아요. 산책하기 딱 좋은 날이에요."
        ],
        [
            "요즘 숲에 새로운 생물이 보인대요.",
            "정말요? 저도 한번 찾아보고 싶어요!"
        ],
        [
            "마을 꽃밭이 더 예뻐진 것 같아요.",
            "주민들이 함께 가꿔서 그런가 봐요."
        ],
        [
            "오늘은 어디에 가 볼까요?",
            "광장 주변을 구경해 보는 건 어때요?"
        ],
        [
            "이웃들과 이야기하는 게 즐거워요.",
            "저도요! 마을이 더 활기차지는 것 같아요."
        ]
    ];

    const conversation =
        conversations[
            Math.floor(Math.random() * conversations.length)
        ];

    speechBubble.textContent =
        `${firstData.villagerName}: ${conversation[0]}`;

    speechBubble.style.display = "block";

    window.setTimeout(() => {
        if (!secondData.villager) return;

        speechBubble.textContent =
            `${secondData.villagerName}: ${conversation[1]}`;
    }, 2200);

    window.setTimeout(() => {
        firstData.chatting = false;
        secondData.chatting = false;

        if (!currentTalkingVillager) {
            speechBubble.style.display = "none";
        }
    }, 4500);
}

// 플레이어와 가까운 주민 찾기
function updateNearbyVillager(delta) {
    if (!isPlaying) return;

    dialogueCooldown -= delta;

    let closest = null;
    let closestDistance = 4;

    villagers.forEach((villager) => {
        const dx = camera.position.x - villager.position.x;
        const dz = camera.position.z - villager.position.z;

        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = villager;
        }
    });

    nearbyVillager = closest;

    if (currentTalkingVillager) {
        interactionHint.style.display = "none";
        return;
    }

    if (nearbyVillager) {
        interactionHint.style.display = "block";

        // 주민이 가끔 먼저 인사
        if (dialogueCooldown <= 0 && Math.random() < 0.008) {
            villagerGreeting(nearbyVillager);
        }
    } else {
        interactionHint.style.display = "none";
    }
}

// E 키로 가까운 주민과 대화
function interactWithNearbyVillager() {
    if (currentTalkingVillager) {
        nextVillagerDialogue();
        return;
    }

    if (nearbyVillager) {
        startVillagerDialogue(nearbyVillager);
    }
}

// 대화 중 키보드 입력
window.addEventListener("keydown", (event) => {
    if (!isPlaying) return;

    if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        interactWithNearbyVillager();
    }

    if (event.key === "Escape" && currentTalkingVillager) {
        closeVillagerDialogue();
    }
});

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

// 주민 목록 초기화
villagers.length = 0;

// 열려 있는 대화창 닫기
currentTalkingVillager = null;
nearbyVillager = null;

if (dialoguePanel) {
    dialoguePanel.style.display = "none";
}

if (interactionHint) {
    interactionHint.style.display = "none";
}

if (speechBubble) {
    speechBubble.style.display = "none";
}
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
    
// 광장, 상점, 꽃밭, 가로등 등 고급 마을 시설 추가
makeVillageDetails();
    
        // 마을 건물과 산책길 생성
    makeVillage();
    createPlayerHome();
    createPersonalFarm();

    // ================================================
// BIOMAP 마을 고급 시설 추가
// 광장, 상점, 꽃밭, 가로등, 장식물 생성
// ================================================

function makeVillageDetails() {
    const details = new THREE.Group();

    // --------------------------------
    // 1. 마을 중앙 광장
    // --------------------------------

    const plaza = addMesh(
        details,
        new THREE.CylinderGeometry(7.5, 7.5, 0.18, 48),
        makeMaterial("#cbb995"),
        0, 0.04, -1
    );

    plaza.receiveShadow = true;

    // 광장 중앙 원형 장식
    addMesh(
        details,
        new THREE.CylinderGeometry(2.5, 2.5, 0.12, 32),
        makeMaterial("#a9bd91"),
        0, 0.16, -1
    );

    addMesh(
        details,
        new THREE.CylinderGeometry(1.4, 1.4, 0.14, 32),
        makeMaterial("#e1d0a8"),
        0, 0.27, -1
    );

    // 광장 중앙 꽃 장식
    const centerFlower = new THREE.Group();

    addMesh(
        centerFlower,
        new THREE.CylinderGeometry(0.25, 0.3, 0.7, 10),
        makeMaterial("#6d8e4d"),
        0, 0.55, 0
    );

    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;

        const petal = addMesh(
            centerFlower,
            new THREE.SphereGeometry(0.32, 10, 8),
            makeMaterial(
                ["#e9a9b5", "#f0d17a", "#d9b4e8", "#ffffff"][i % 4]
            ),
            Math.cos(angle) * 0.55,
            0.85,
            Math.sin(angle) * 0.55
        );

        petal.scale.set(1.1, 0.55, 0.8);
    }

    addMesh(
        centerFlower,
        new THREE.SphereGeometry(0.3, 12, 10),
        makeMaterial("#f3d36b"),
        0, 0.88, 0
    );

    centerFlower.position.set(0, 0, -1);
    details.add(centerFlower);

    // --------------------------------
    // 2. 광장 주변 돌길
    // --------------------------------

    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;

        const stone = addMesh(
            details,
            new THREE.BoxGeometry(1.1, 0.1, 0.65),
            makeMaterial(i % 2 === 0 ? "#d7c8a8" : "#b9aa8b"),
            Math.cos(angle) * 8.2,
            0.08,
            -1 + Math.sin(angle) * 8.2
        );

        stone.rotation.y = -angle;
    }

    // --------------------------------
    // 3. 꽃밭 생성 함수
    // --------------------------------

    function addFlowerBed(x, z, width, depth) {
        // 꽃밭 흙 바닥
        addMesh(
            details,
            new THREE.BoxGeometry(width, 0.18, depth),
            makeMaterial("#76563d"),
            x, 0.1, z
        );

        // 꽃밭 테두리
        const borderMaterial = makeMaterial("#a77b50");

        addMesh(
            details,
            new THREE.BoxGeometry(width + 0.3, 0.25, 0.2),
            borderMaterial,
            x, 0.2, z - depth / 2
        );

        addMesh(
            details,
            new THREE.BoxGeometry(width + 0.3, 0.25, 0.2),
            borderMaterial,
            x, 0.2, z + depth / 2
        );

        addMesh(
            details,
            new THREE.BoxGeometry(0.2, 0.25, depth),
            borderMaterial,
            x - width / 2, 0.2, z
        );

        addMesh(
            details,
            new THREE.BoxGeometry(0.2, 0.25, depth),
            borderMaterial,
            x + width / 2, 0.2, z
        );

        // 꽃과 잎 배치
        const flowerPalette = [
            "#f1a7b7",
            "#f4d16f",
            "#d7b2e8",
            "#ffffff",
            "#e88b78"
        ];

        for (let i = 0; i < 18; i++) {
            const flowerX =
                x - width / 2 + 0.45 + Math.random() * (width - 0.9);

            const flowerZ =
                z - depth / 2 + 0.35 + Math.random() * (depth - 0.7);

            // 줄기
            addMesh(
                details,
                new THREE.CylinderGeometry(0.035, 0.05, 0.4, 6),
                makeMaterial("#477c3e"),
                flowerX, 0.4, flowerZ
            );

            // 꽃잎
            for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
                const angle = (Math.PI * 2 * petalIndex) / 5;

                addMesh(
                    details,
                    new THREE.SphereGeometry(0.12, 8, 6),
                    makeMaterial(
                        flowerPalette[i % flowerPalette.length]
                    ),
                    flowerX + Math.cos(angle) * 0.12,
                    0.66,
                    flowerZ + Math.sin(angle) * 0.12
                );
            }

            // 꽃 중심
            addMesh(
                details,
                new THREE.SphereGeometry(0.09, 8, 6),
                makeMaterial("#f4d36b"),
                flowerX, 0.67, flowerZ
            );
        }
    }

    // 광장 주변 꽃밭 4개
    addFlowerBed(-10, -1, 4, 3);
    addFlowerBed(10, -1, 4, 3);
    addFlowerBed(-7, 9, 4, 3);
    addFlowerBed(7, 9, 4, 3);

    // --------------------------------
    // 4. 마을 상점 생성 함수
    // --------------------------------

    function addShop(x, z, wallColor, roofColor, shopName) {
        const shop = new THREE.Group();

        // 상점 바닥
        addMesh(
            shop,
            new THREE.BoxGeometry(7, 0.25, 5.5),
            makeMaterial("#b79b73"),
            0, 0.12, 0
        );

        // 상점 벽
        addMesh(
            shop,
            new THREE.BoxGeometry(6.5, 3.2, 5),
            makeMaterial(wallColor),
            0, 1.8, 0
        );

        // 지붕
        const shopRoof = addMesh(
            shop,
            new THREE.ConeGeometry(5, 2.5, 4),
            makeMaterial(roofColor),
            0, 4.6, 0
        );

        shopRoof.rotation.y = Math.PI / 4;

        // 정면 간판
        const sign = addMesh(
            shop,
            new THREE.BoxGeometry(3.4, 0.8, 0.16),
            makeMaterial("#f0dfb5"),
            0, 3.1, 2.58
        );

        // 상점 앞 차양
        addMesh(
            shop,
            new THREE.BoxGeometry(7.2, 0.18, 1.2),
            makeMaterial("#d8a56f"),
            0, 2.65, 3
        );

        // 상점 기둥
        for (const side of [-1, 1]) {
            addMesh(
                shop,
                new THREE.BoxGeometry(0.18, 2.5, 0.18),
                makeMaterial("#805638"),
                side * 3.1, 1.35, 3.4
            );
        }

        // 진열대
        addMesh(
            shop,
            new THREE.BoxGeometry(4.8, 0.75, 1),
            makeMaterial("#8c6240"),
            0, 0.85, 3.5
        );

        // 진열 상품
        for (let i = 0; i < 5; i++) {
            addMesh(
                shop,
                new THREE.SphereGeometry(0.28, 10, 8),
                makeMaterial(
                    ["#d98a45", "#a6b95c", "#c75d50", "#e4c36c", "#8cae70"][i]
                ),
                -1.8 + i * 0.9,
                1.4,
                3.5
            );
        }

        // 창문
        for (const side of [-1, 1]) {
            addMesh(
                shop,
                new THREE.BoxGeometry(1.1, 1.1, 0.12),
                makeMaterial("#9bcbd1"),
                side * 2.1, 2.1, 2.56
            );
        }

        shop.position.set(x, 0, z);
        details.add(shop);
    }

    // 씨앗과 농사 용품 상점
    addShop(
        -25,
        -5,
        "#e0c49b",
        "#7d5940",
        "씨앗 상점"
    );

    // 마을 생활용품 상점
    addShop(
        25,
        -5,
        "#c8d5a7",
        "#66824d",
        "생활용품 상점"
    );

    // --------------------------------
    // 5. 가로등 생성 함수
    // --------------------------------

    function addStreetLamp(x, z) {
        const lamp = new THREE.Group();

        // 기둥
        addMesh(
            lamp,
            new THREE.CylinderGeometry(0.09, 0.14, 3.5, 10),
            makeMaterial("#594c3c"),
            0, 1.75, 0
        );

        // 기둥 장식
        addMesh(
            lamp,
            new THREE.CylinderGeometry(0.22, 0.22, 0.15, 10),
            makeMaterial("#8c704c"),
            0, 3.2, 0
        );

        // 등불
        addMesh(
            lamp,
            new THREE.BoxGeometry(0.75, 0.75, 0.75),
            makeMaterial("#f5dfa0"),
            0, 3.65, 0
        );

        // 등불 지붕
        addMesh(
            lamp,
            new THREE.ConeGeometry(0.65, 0.5, 4),
            makeMaterial("#554635"),
            0, 4.25, 0
        );

        // 등불 빛
        const light = new THREE.PointLight("#ffe6a6", 1.2, 9);
        light.position.set(0, 3.65, 0);
        lamp.add(light);

        lamp.position.set(x, 0, z);
        details.add(lamp);
    }

    const lampPositions = [
        [-9, -10],
        [9, -10],
        [-9, 7],
        [9, 7],
        [-18, -5],
        [18, -5],
        [-25, 5],
        [25, 5],
        [-5, 15],
        [5, 15]
    ];

    lampPositions.forEach(([x, z]) => {
        addStreetLamp(x, z);
    });

    // --------------------------------
    // 6. 광장 주변 벤치
    // --------------------------------

    function addDetailedBench(x, z, rotation) {
        const bench = new THREE.Group();

        // 좌석
        addMesh(
            bench,
            new THREE.BoxGeometry(2.5, 0.18, 0.75),
            makeMaterial("#98633e"),
            0, 0.8, 0
        );

        // 등받이
        addMesh(
            bench,
            new THREE.BoxGeometry(2.5, 0.85, 0.16),
            makeMaterial("#805334"),
            0, 1.25, -0.3
        );

        // 다리
        for (const side of [-1, 1]) {
            addMesh(
                bench,
                new THREE.BoxGeometry(0.16, 0.75, 0.55),
                makeMaterial("#68452e"),
                side * 0.9, 0.4, 0
            );
        }

        bench.position.set(x, 0, z);
        bench.rotation.y = rotation;

        details.add(bench);
    }

    addDetailedBench(-5, -10, 0);
    addDetailedBench(5, -10, Math.PI);
    addDetailedBench(-12, 3, Math.PI / 2);
    addDetailedBench(12, 3, -Math.PI / 2);

    // --------------------------------
    // 7. 화분과 나무 장식
    // --------------------------------

    function addPottedPlant(x, z) {
        const pot = new THREE.Group();

        // 화분
        addMesh(
            pot,
            new THREE.CylinderGeometry(0.4, 0.28, 0.55, 12),
            makeMaterial("#b96f50"),
            0, 0.28, 0
        );

        // 흙
        addMesh(
            pot,
            new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12),
            makeMaterial("#5c4430"),
            0, 0.57, 0
        );

        // 식물 줄기
        addMesh(
            pot,
            new THREE.CylinderGeometry(0.06, 0.08, 1.1, 7),
            makeMaterial("#477c3e"),
            0, 1.1, 0
        );

        // 잎
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;

            const leaf = addMesh(
                pot,
                new THREE.SphereGeometry(0.35, 8, 6),
                makeMaterial(i % 2 === 0 ? "#5c9b4e" : "#83ae5d"),
                Math.cos(angle) * 0.35,
                1.45,
                Math.sin(angle) * 0.35
            );

            leaf.scale.set(1.1, 0.5, 0.65);
        }

        pot.position.set(x, 0, z);
        details.add(pot);
    }

    addPottedPlant(-17, -10);
    addPottedPlant(17, -10);
    addPottedPlant(-17, 8);
    addPottedPlant(17, 8);

    // --------------------------------
    // 8. 광장 주변 작은 표지판
    // --------------------------------

    function addSignpost(x, z) {
        const sign = new THREE.Group();

        addMesh(
            sign,
            new THREE.CylinderGeometry(0.08, 0.1, 2, 8),
            makeMaterial("#765033"),
            0, 1, 0
        );

        addMesh(
            sign,
            new THREE.BoxGeometry(2.2, 0.65, 0.16),
            makeMaterial("#d5b77e"),
            0, 1.7, 0
        );

        addMesh(
            sign,
            new THREE.BoxGeometry(0.16, 0.16, 0.2),
            makeMaterial("#805334"),
            0, 1.7, 0
        );

        sign.position.set(x, 0, z);
        details.add(sign);
    }

    addSignpost(-14, -2);
    addSignpost(14, -2);

    // 모든 시설을 실제 월드에 추가
    world.add(details);
}
    
    // 마을 주민과 숲 해설가 생성
    makeVillageNPCs();
    
    // 탐험 공간에 촘촘한 숲 조성
    for (let i = 0; i < 1800; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;

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

        // 생물 종류에 따라 촘촘하게 여러 개체 생성
        const count = isPlant
            ? 45
            : isInsect
                ? 60
                : 50;

        for (let copy = 0; copy < count; copy++) {
            let x;
            let z;
            let attempts = 0;

            do {
                x = (Math.random() - 0.5) * 180;
                z = (Math.random() - 0.5) * 180;
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

    // 탐험 공간에 꽃과 작은 식물을 촘촘하게 배치
    for (let i = 0; i < 1800; i++) {
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;

        if (seasonColors[currentSeason].flower && Math.random() > 0.4) {
            makeFlower(x, z, i);
        }
    }

    // 생물과 식물 주변에 코인을 촘촘하게 배치
    for (let i = 0; i < 100; i++) {
        let x;
        let z;
        let attempts = 0;

        do {
            x = (Math.random() - 0.5) * 180;
            z = (Math.random() - 0.5) * 180;
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
// 플레이어 전용 집 시스템
// ================================================

let isInsidePlayerHome = false;

let playerHome = null;
let playerHomeInterior = null;
let playerHomeExterior = null;

const PLAYER_HOME_POSITION = new THREE.Vector3(0, 0, 35);

// 집과 내부 공간 생성
function createPlayerHome() {
    playerHome = new THREE.Group();
    playerHomeExterior = new THREE.Group();
    playerHomeInterior = new THREE.Group();

    // --------------------------------
    // 집 외부
    // --------------------------------

    // 기초 바닥
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(11, 0.5, 9),
        makeMaterial("#8b765b"),
        0, 0.25, 0
    );

    // 집 벽
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(10, 4.5, 8),
        makeMaterial("#e6d2aa"),
        0, 2.5, 0
    );

    // 지붕
    const roof = addMesh(
        playerHomeExterior,
        new THREE.ConeGeometry(7.5, 3.5, 4),
        makeMaterial("#80513d"),
        0, 6.4, 0
    );

    roof.rotation.y = Math.PI / 4;

    // 현관문
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(1.5, 2.8, 0.18),
        makeMaterial("#70472f"),
        0, 1.65, 4.08
    );

    // 문 손잡이
    addMesh(
        playerHomeExterior,
        new THREE.SphereGeometry(0.09, 10, 8),
        makeMaterial("#e5bd65"),
        0.48, 1.7, 4.2
    );

    // 창문
    for (const side of [-1, 1]) {
        addMesh(
            playerHomeExterior,
            new THREE.BoxGeometry(1.7, 1.5, 0.15),
            makeMaterial("#91c6cf"),
            side * 3.1, 2.8, 4.08
        );

        addMesh(
            playerHomeExterior,
            new THREE.BoxGeometry(1.9, 0.13, 0.25),
            makeMaterial("#80513d"),
            side * 3.1, 2, 4.15
        );
    }

    // 현관 계단
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(2.5, 0.25, 1.2),
        makeMaterial("#b6a184"),
        0, 0.35, 4.6
    );

    // 집 이름 표지판
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(3.2, 0.7, 0.15),
        makeMaterial("#e8d5a9"),
        0, 4.3, 4.12
    );

    // 굴뚝
    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(0.9, 2.2, 0.9),
        makeMaterial("#a76f50"),
        -3.3, 5.2, -1.8
    );

    // 외부 화분
    for (const side of [-1, 1]) {
        const pot = new THREE.Group();

        addMesh(
            pot,
            new THREE.CylinderGeometry(0.35, 0.25, 0.55, 10),
            makeMaterial("#b96f50"),
            0, 0.28, 0
        );

        addMesh(
            pot,
            new THREE.SphereGeometry(0.5, 10, 8),
            makeMaterial("#5d984d"),
            0, 0.85, 0
        );

        pot.position.set(side * 2.2, 0, 4.9);
        playerHomeExterior.add(pot);
    }

    // 집 앞 울타리
    for (let i = -4; i <= 4; i++) {
        if (Math.abs(i) <= 1) continue;

        addMesh(
            playerHomeExterior,
            new THREE.BoxGeometry(0.15, 1, 0.15),
            makeMaterial("#9a704b"),
            i, 0.55, 6
        );
    }

    addMesh(
        playerHomeExterior,
        new THREE.BoxGeometry(9, 0.15, 0.15),
        makeMaterial("#9a704b"),
        0, 0.9, 6
    );

    // --------------------------------
    // 집 내부
    // --------------------------------

    // 바닥
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(9.5, 0.2, 7.5),
        makeMaterial("#b8895e"),
        0, 0.15, 0
    );

    // 뒤쪽 벽
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(9.5, 4, 0.2),
        makeMaterial("#f0dfc5"),
        0, 2.2, -3.7
    );

    // 왼쪽 벽
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(0.2, 4, 7.5),
        makeMaterial("#e6d3b5"),
        -4.7, 2.2, 0
    );

    // 오른쪽 벽
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(0.2, 4, 7.5),
        makeMaterial("#e6d3b5"),
        4.7, 2.2, 0
    );

    // 천장
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(9.5, 0.2, 7.5),
        makeMaterial("#d8c5a8"),
        0, 4.3, 0
    );

    // --------------------------------
    // 침대
    // --------------------------------

    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(2.6, 0.5, 3.1),
        makeMaterial("#80553e"),
        -2.6, 0.55, -1.5
    );

    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(2.5, 0.35, 2.4),
        makeMaterial("#f2e5d2"),
        -2.6, 0.95, -1.5
    );

    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(2.5, 0.55, 0.8),
        makeMaterial("#a9c6d0"),
        -2.6, 1.2, -2.5
    );

    // 침대 베개
    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(0.85, 0.2, 0.55),
        makeMaterial("#fff4df"),
        -2.6, 1.35, -2.55
    );

    // --------------------------------
    // 소파
    // --------------------------------

    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(2.8, 0.65, 1.1),
        makeMaterial("#789b79"),
        2.2, 0.65, -2.4
    );

    addMesh(
        playerHomeInterior,
        new THREE.BoxGeometry(2.8, 1.1, 0.25),
        makeMaterial("#668765"),
        2.2, 1.15, -2.9
    );

    // 소파 팔걸이
    for (const side of [-1, 1]) {
        addMesh(
            playerHomeInterior,
            new THREE.BoxGeometry(0.3, 0.9, 1.1),
            make
            
// ================================================
// 생물 정보와 발견 기록
// ================================================

            
// ================================================
// 개인 농장 및 농사 시스템
// ================================================

// 농사 재고 불러오기
let farmInventory = (() => {
    try {
        const saved = JSON.parse(
            localStorage.getItem("biomapFarmInventory") || "null"
        );

        return saved || {
            seeds: {
                carrot: 2,
                potato: 0,
                tomato: 0
            },
            fertilizer: 0,
            crops: {
                carrot: 0,
                potato: 0,
                tomato: 0
            }
        };
    } catch (error) {
        return {
            seeds: {
                carrot: 2,
                potato: 0,
                tomato: 0
            },
            fertilizer: 0,
            crops: {
                carrot: 0,
                potato: 0,
                tomato: 0
            }
        };
    }
})();

let selectedCrop = "carrot";

let personalFarm = null;
let farmPlots = [];

const FARM_GROWTH_TIME = 45000;

const FARM_CROPS = {
    carrot: {
        name: "당근",
        emoji: "🥕",
        price: 12,
        color: "#e98b35"
    },
    potato: {
        name: "감자",
        emoji: "🥔",
        price: 15,
        color: "#b58b55"
    },
    tomato: {
        name: "토마토",
        emoji: "🍅",
        price: 18,
        color: "#d94b3f"
    }
};


// ================================================
// 농사 재고 저장
// ================================================

function saveFarmInventory() {
    localStorage.setItem(
        "biomapFarmInventory",
        JSON.stringify(farmInventory)
    );

    updateFarmInventoryDisplay();
}
        // ================================================
// 농사 인벤토리 화면
// ================================================

function updateFarmInventoryDisplay() {

    let panel = document.getElementById("farm-inventory-panel");

    if (!panel) {

        panel = document.createElement("div");
        panel.id = "farm-inventory-panel";

        Object.assign(panel.style, {
            position: "fixed",
            top: "100px",
            right: "20px",
            width: "220px",
            padding: "16px",
            background: "rgba(24, 53, 37, 0.92)",
            color: "#ffffff",
            border: "2px solid #a6c98b",
            borderRadius: "14px",
            zIndex: "1000",
            fontFamily: "sans-serif",
            lineHeight: "1.8",
            fontSize: "14px",
            boxShadow: "0 5px 18px rgba(0,0,0,0.25)"
        });

        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div style="font-size:18px;font-weight:bold;margin-bottom:8px;">
            🎒 농사 인벤토리
        </div>

        <div style="color:#c8e6b5;font-weight:bold;">
            🌱 씨앗
        </div>

        <div>🥕 당근: ${farmInventory.seeds.carrot}개</div>
        <div>🥔 감자: ${farmInventory.seeds.potato}개</div>
        <div>🍅 토마토: ${farmInventory.seeds.tomato}개</div>

        <div style="color:#c8e6b5;font-weight:bold;margin-top:8px;">
            🌿 재료
        </div>

        <div>🧪 비료: ${farmInventory.fertilizer}개</div>

        <div style="color:#c8e6b5;font-weight:bold;margin-top:8px;">
            🧺 수확물
        </div>

        <div>🥕 당근: ${farmInventory.crops.carrot}개</div>
        <div>🥔 감자: ${farmInventory.crops.potato}개</div>
        <div>🍅 토마토: ${farmInventory.crops.tomato}개</div>
    `;
}
       
// 재고 저장 후 화면 갱신

// ================================================
// 농장 상태 저장
// ================================================

function saveFarmState() {
    const data = farmPlots.map((plot) => ({
        crop: plot.crop,
        plantedAt: plot.plantedAt,
        fertilized: plot.fertilized
    }));

    localStorage.setItem(
        "biomapFarmPlots",
        JSON.stringify(data)
    );
}


// ================================================
// 개인 농장 생성
// ================================================

function createPersonalFarm() {

    personalFarm = new THREE.Group();
    farmPlots = [];

    let savedPlots = [];

    try {
        savedPlots = JSON.parse(
            localStorage.getItem("biomapFarmPlots") || "[]"
        );
    } catch (error) {
        savedPlots = [];
    }

    const farmX = PLAYER_HOME_POSITION.x;
    const farmZ = PLAYER_HOME_POSITION.z + 15;
    personalFarm.position.set(farmX, 0, farmZ);
    // 농장 바닥
    addMesh(
        personalFarm,
        new THREE.BoxGeometry(17, 0.15, 11),
        makeMaterial("#a98a5e"),
        0, 0.05, 0
    );

    // 밭 6개 생성
    for (let i = 0; i < 6; i++) {

        const column = i % 3;
        const row = Math.floor(i / 3);

        const x = (column - 1) * 4.8;
        const z = (row - 0.5) * 4.2;

        const plotGroup = new THREE.Group();
        
    plotGroup.position.set(
        x,
        0,
        z
    );
        // 흙
        addMesh(
            plotGroup,
            new THREE.BoxGeometry(3.8, 0.25, 3.2),
            makeMaterial("#704b30"),
            0, 0.2, 0
        );

        // 밭 가장자리 나무 테두리
        for (const side of [-1, 1]) {

            addMesh(
                plotGroup,
                new THREE.BoxGeometry(4, 0.2, 0.15),
                makeMaterial("#9b7147"),
                0, 0.35, side * 1.65
            );

            addMesh(
                plotGroup,
                new THREE.BoxGeometry(0.15, 0.2, 3.3),
                makeMaterial("#9b7147"),
                side * 1.95, 0.35, 0
            );
        }

        const saved = savedPlots[i] || {};

        const plot = {
            index: i,
            x: farmX + x,
            z: farmZ + z,
            group: plotGroup,
            crop: saved.crop || null,
            plantedAt: saved.plantedAt || 0,
            fertilized: saved.fertilized || false,
            cropGroup: null,
            stage: 0
        };

        farmPlots.push(plot);
        personalFarm.add(plotGroup);
    }

    // 농장 울타리
    for (let x = -8; x <= 8; x += 2) {

        for (const side of [-1, 1]) {

            addMesh(
                personalFarm,
                new THREE.BoxGeometry(0.18, 0.9, 0.18),
                makeMaterial("#8a603b"),
                x, 0.5, side * 5.5
            );
        }
    }

    addMesh(
        personalFarm,
        new THREE.BoxGeometry(16, 0.15, 0.15),
        makeMaterial("#9a7047"),
        0, 0.75, -5.5
    );

    addMesh(
        personalFarm,
        new THREE.BoxGeometry(16, 0.15, 0.15),
        makeMaterial("#9a7047"),
        0, 0.75, 5.5
    );

    // 작물 판매대
    const market = new THREE.Group();

    addMesh(
        market,
        new THREE.BoxGeometry(3.5, 1.5, 1.5),
        makeMaterial("#98643e"),
        0, 0.8, 0
    );

    addMesh(
        market,
        new THREE.BoxGeometry(4.2, 0.25, 2),
        makeMaterial("#c68d54"),
        0, 1.7, 0
    );

    market.add(makeLabel("작물 판매", 2.7));

    market.position.set(
        10,
        0,
        0
    );

    personalFarm.add(market);

    personalFarm.userData.market = market;

    world.add(personalFarm);
    updateFarmInventoryDisplay();

    // 저장된 작물 다시 표시
    farmPlots.forEach((plot) => {
        updateFarmPlotVisual(plot);
    });
}


// ================================================
// 작물 성장 단계
// ================================================

function getCropStage(plot) {

    if (!plot.crop) return 0;

    const elapsedTime = Date.now() - plot.plantedAt;

    const growthTime = plot.fertilized
        ? FARM_GROWTH_TIME * 0.65
        : FARM_GROWTH_TIME;

    if (elapsedTime >= growthTime) return 3;
    if (elapsedTime >= growthTime * 0.65) return 2;
    if (elapsedTime >= growthTime * 0.3) return 1;

    return 0;
}


// ================================================
// 작물 3D 모형 생성
// ================================================

function updateFarmPlotVisual(plot) {

    const stage = getCropStage(plot);

    if (plot.stage === stage && plot.cropGroup) {
        return;
    }

    if (plot.cropGroup) {
        plot.group.remove(plot.cropGroup);

        plot.cropGroup.traverse((object) => {
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
    }

    plot.cropGroup = null;
    plot.stage = stage;

    if (!plot.crop || stage === 0) return;

    const cropGroup = new THREE.Group();

    const size = stage === 1
        ? 0.45
        : stage === 2
            ? 0.75
            : 1;

    const leafMaterial = makeMaterial("#438b42");

    // 줄기
    addMesh(
        cropGroup,
        new THREE.CylinderGeometry(
            0.07 * size,
            0.1 * size,
            0.8 * size,
            8
        ),
        leafMaterial,
        0, 0.4 * size, 0
    );

    // 잎
    for (let i = 0; i < 5; i++) {

        const angle = i * Math.PI * 2 / 5;

        const leaf = addMesh(
            cropGroup,
            new THREE.SphereGeometry(0.35 * size, 10, 8),
            leafMaterial,
            Math.cos(angle) * 0.3 * size,
            0.65 * size,
            Math.sin(angle) * 0.3 * size
        );

        leaf.scale.set(1, 0.35, 0.65);
        leaf.rotation.y = -angle;
    }

    // 열매
    if (stage >= 2) {

        const cropColor = FARM_CROPS[plot.crop].color;

        const fruitCount = stage === 3 ? 3 : 1;

        for (let i = 0; i < fruitCount; i++) {

            addMesh(
                cropGroup,
                new THREE.SphereGeometry(
                    stage === 3 ? 0.25 : 0.18,
                    12,
                    10
                ),
                makeMaterial(cropColor),
                (i - 1) * 0.35,
                0.45 * size,
                0.2
            );
        }
    }

    cropGroup.position.y = 0.45;
    plot.group.add(cropGroup);

    plot.cropGroup = cropGroup;
}


// ================================================
// 작물 성장 업데이트
// ================================================

function updateFarm() {

    farmPlots.forEach((plot) => {

        if (!plot.crop) return;

        const newStage = getCropStage(plot);

        if (newStage !== plot.stage) {

            updateFarmPlotVisual(plot);

            if (newStage === 3) {
                setMessage(
                    `${FARM_CROPS[plot.crop].name}이(가) 다 자랐어요! E키로 수확하세요.`
                );
            }
        }
    });
}


// ================================================
// 씨앗 구매
// ================================================

function buyFarmSeeds() {

    const crop = FARM_CROPS[selectedCrop];

    const price = 15;
    const amount = 3;

    if (coinBalance < price) {
        setMessage("코인이 부족해요. 생물을 발견하거나 작물을 판매해 보세요.");
        return;
    }

    addCoins(-price);

    farmInventory.seeds[selectedCrop] += amount;

    saveFarmInventory();

    setMessage(
        `${crop.name} 씨앗 ${amount}개를 구매했어요!`
    );
}


// ================================================
// 비료 구매
// ================================================

function buyFarmFertilizer() {

    const price = 10;

    if (coinBalance < price) {
        setMessage("비료를 구매하기 위한 코인이 부족해요.");
        return;
    }

    addCoins(-price);

    farmInventory.fertilizer += 1;

    saveFarmInventory();

    setMessage("비료 1개를 구매했어요!");
}


// ================================================
// 작물 심기 및 수확
// ================================================

function interactWithFarmPlot(plot) {

    // 빈 밭이면 씨앗 심기
    if (!plot.crop) {

        if (farmInventory.seeds[selectedCrop] <= 0) {
            setMessage("씨앗이 없어요. 씨앗 상점에서 구매하세요.");
            return;
        }

        farmInventory.seeds[selectedCrop]--;

        plot.crop = selectedCrop;
        plot.plantedAt = Date.now();
        plot.fertilized = false;
        plot.stage = 0;

        saveFarmInventory();
        saveFarmState();

        updateFarmPlotVisual(plot);

        setMessage(
            `${FARM_CROPS[selectedCrop].name}을(를) 심었어요!`
        );

        return;
    }

    // 다 자란 작물 수확
    if (getCropStage(plot) >= 3) {

        const crop = plot.crop;

        farmInventory.crops[crop] += 2;

        plot.crop = null;
        plot.plantedAt = 0;
        plot.fertilized = false;
        plot.stage = 0;

        saveFarmInventory();
        saveFarmState();

        updateFarmPlotVisual(plot);

        setMessage(
            `${FARM_CROPS[crop].name} 2개를 수확했어요!`
        );

        return;
    }

    const remaining = Math.max(
        0,
        Math.ceil(
            (FARM_GROWTH_TIME -
            (Date.now() - plot.plantedAt)) / 1000
        )
    );

    setMessage(
        `${FARM_CROPS[plot.crop].name}이(가) 자라고 있어요.`
    );
}


// ================================================
// 비료 사용
// ================================================

function fertilizeFarmPlot(plot) {

    if (!plot.crop) {
        setMessage("먼저 밭에 씨앗을 심어 주세요.");
        return;
    }

    if (plot.fertilized) {
        setMessage("이 작물에는 이미 비료를 사용했어요.");
        return;
    }

    if (farmInventory.fertilizer <= 0) {
        setMessage("비료가 없어요. 비료 상점에서 구매하세요.");
        return;
    }

    farmInventory.fertilizer--;

    plot.fertilized = true;

    saveFarmInventory();
    saveFarmState();

    setMessage("비료를 사용했어요! 작물이 더 빨리 자라요.");
}


// ================================================
// 작물 판매
// ================================================

function sellFarmCrops() {

    let totalCoins = 0;
    let soldCount = 0;

    Object.keys(FARM_CROPS).forEach((crop) => {

        const amount = farmInventory.crops[crop];

        if (amount <= 0) return;

        totalCoins += amount * FARM_CROPS[crop].price;
        soldCount += amount;

        farmInventory.crops[crop] = 0;
    });

    if (soldCount === 0) {
        setMessage("판매할 작물이 없어요. 밭에서 작물을 수확해 주세요.");
        return;
    }

    addCoins(totalCoins);

    saveFarmInventory();

    setMessage(
        `작물 ${soldCount}개를 판매했어요! 코인 ${totalCoins}개를 얻었어요.`
    );
}


// ================================================
// 농장 근처 상호작용
// ================================================

function handleFarmInteraction(event) {

    if (!isPlaying) return;
    if (event.repeat) return;

    const key = event.key.toLowerCase();

    // 작물 선택
    if (key === "1") {
        selectedCrop = "carrot";
        setMessage("당근 씨앗을 선택했어요.");
        return;
    }

    if (key === "2") {
        selectedCrop = "potato";
        setMessage("감자 씨앗을 선택했어요.");
        return;
    }

    if (key === "3") {
        selectedCrop = "tomato";
        setMessage("토마토 씨앗을 선택했어요.");
        return;
    }

    const playerX = camera.position.x;
    const playerZ = camera.position.z;

    // 씨앗 상점 근처에서 B키
    if (key === "b") {

        const distance = Math.hypot(
            playerX - (-25),
            playerZ - (-5)
        );

        if (distance < 7) {
            buyFarmSeeds();
        }

        return;
    }

    // 비료 상점 근처에서 N키
    if (key === "n") {

        const distance = Math.hypot(
            playerX - 25,
            playerZ - (-5)
        );

        if (distance < 7) {
            buyFarmFertilizer();
        }

        return;
    }

    if (key !== "e" && key !== "g") return;

    // 농장 밭과의 거리 확인
    let nearestPlot = null;
    let nearestDistance = Infinity;

    farmPlots.forEach((plot) => {

        const distance = Math.hypot(
            playerX - plot.x,
            playerZ - plot.z
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPlot = plot;
        }
    });

    if (nearestPlot && nearestDistance < 3) {

        if (key === "e") {
            interactWithFarmPlot(nearestPlot);
        } else {
            fertilizeFarmPlot(nearestPlot);
        }

        return;
    }

    // 작물 판매대 근처에서 E키
    if (key === "e" && personalFarm) {

        const market = personalFarm.userData.market;

        if (market) {

            const distance = Math.hypot(
                playerX - market.position.x,
                playerZ - market.position.z
            );

            if (distance < 4) {
                sellFarmCrops();
            }
        }
    }
}

window.addEventListener(
    "keydown",
    handleFarmInteraction
);

        
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

if (owner?.userData?.villager) {
    startVillagerDialogue(owner);
} else if (owner?.userData?.species) {
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

        // ================================================
// 플레이어 집 입장 및 퇴장
// ================================================

function handlePlayerHomeInteraction() {

    if (!isPlaying) return;

    const homeX = PLAYER_HOME_POSITION.x;
    const homeZ = PLAYER_HOME_POSITION.z;

    // 집 안에 있는 경우
    if (isInsidePlayerHome) {

        isInsidePlayerHome = false;

        playerHomeExterior.visible = true;
        playerHomeInterior.visible = false;

        camera.position.set(
            homeX,
            1.7,
            homeZ + 8
        );

        if (typeof setMessage === "function") {
            setMessage("집 밖으로 나왔습니다.");
        }

        return;
    }

    // 집 현관과의 거리 확인
    const doorX = homeX;
    const doorZ = homeZ + 5.5;

    const distance = Math.sqrt(
        Math.pow(camera.position.x - doorX, 2) +
        Math.pow(camera.position.z - doorZ, 2)
    );

    if (distance > 4) return;

    // 집 안으로 이동
    isInsidePlayerHome = true;

    playerHomeExterior.visible = false;
    playerHomeInterior.visible = true;

    camera.position.set(
        homeX,
        1.7,
        homeZ + 2.5
    );

    if (typeof setMessage === "function") {
        setMessage("나만의 집에 들어왔습니다. E키를 누르면 밖으로 나갑니다.");
    }
}


// ================================================
// 집 입장 키 설정
// ================================================

window.addEventListener("keydown", function(event) {

    if (event.repeat) return;

    if (event.key.toLowerCase() !== "e") return;

    handlePlayerHomeInteraction();

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
if (isInsidePlayerHome) {

    camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        PLAYER_HOME_POSITION.x - 4.7,
        PLAYER_HOME_POSITION.x + 4.7
    );

    camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        PLAYER_HOME_POSITION.z - 3.7,
        PLAYER_HOME_POSITION.z + 3.7
    );

} else {

    camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -1490,
        1490
    );

    camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -1490,
        1490
    );

}

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

        // 주민 전용 움직임과 걷기 애니메이션
        if (data.villager) {
            if (data.isGuide) {
                // 숲 해설가는 안내 위치에서 천천히 움직임
                data.targetX = data.baseX;
                data.targetZ = data.baseZ;
            } else {
                // 일정 시간이 지나면 새로운 목적지 선택
                data.changeTargetTime -= delta;

                if (data.changeTargetTime <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * data.walkRadius;

                    data.targetX =
                        data.baseX + Math.cos(angle) * distance;

                    data.targetZ =
                        data.baseZ + Math.sin(angle) * distance;

                    data.changeTargetTime = 3 + Math.random() * 5;
                }
            }

            const dx = data.targetX - group.position.x;
            const dz = data.targetZ - group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            const isWalking = distance > 0.15;

            if (isWalking) {
                const moveDistance = Math.min(
                    distance,
                    data.walkSpeed * delta
                );

                group.position.x +=
                    (dx / distance) * moveDistance;

                group.position.z +=
                    (dz / distance) * moveDistance;

                // 이동 방향으로 몸을 돌림
                group.rotation.y = Math.atan2(dx, dz);

                // 팔과 다리를 번갈아 움직임
                const walkCycle =
                    elapsed * data.walkSpeed * 5 + data.phase;

                data.limbs.forEach((limb) => {
                    limb.leg.rotation.x =
                        Math.sin(walkCycle) * 0.65 * limb.side;

                    limb.arm.rotation.x =
                        -Math.sin(walkCycle) * 0.45 * limb.side;
                });

                // 걸을 때 몸이 살짝 위아래로 움직임
                group.position.y =
                    Math.abs(Math.sin(walkCycle * 2)) * 0.055;

                // 머리의 자연스러운 움직임
                data.head.rotation.z =
                    Math.sin(elapsed * 1.5 + data.phase) * 0.035;
            } else {
                // 멈추면 팔과 다리를 원래 위치로 복귀
                data.limbs.forEach((limb) => {
                    limb.leg.rotation.x *= 0.85;
                    limb.arm.rotation.x *= 0.85;
                });

                group.position.y = 0;

                // 가만히 서 있을 때 고개 움직임
                data.head.rotation.y =
                    Math.sin(elapsed * 0.7 + data.phase) * 0.08;
            }

            return;
        }

        // 식물은 제자리에서 살짝 흔들리도록 설정
        if (data.plant) {
            group.position.y = 0;

            group.rotation.z =
                Math.sin(elapsed * 1.2 + data.phase) * 0.025;

            return;
        }

        group.visible = true;

        const activity = data.species.activity;

        // 새와 날아다니는 곤충
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

        // 물고기
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

        // 지면에서 움직이는 생물
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

        // 날개 움직임
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
    updateFarm();

    updateNearbyVillager(delta);
    updateVillagerSocial(delta);
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
