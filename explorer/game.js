
import * as THREE from "three";

// ================================================
// BioMap 3D 생태 탐험
// ================================================

const container = document.getElementById("game-container");
const introPanel = document.getElementById("intro-panel");
const startButton = document.getElementById("start-button");
const habitatName = document.getElementById("habitat-name");
const bottomMessage = document.getElementById("bottom-message");
const speciesPanel = document.getElementById("species-panel");
const speciesEmoji = document.getElementById("species-emoji");
const speciesName = document.getElementById("species-name");
const speciesType = document.getElementById("species-type");
const speciesDescription = document.getElementById("species-description");
const closeSpeciesButton = document.getElementById("close-species");
const discoveryCount = document.getElementById("discovery-count");

const config = window.BIOMAP_CONFIG || {
    country: "대한민국",
    habitat: "산림"
};

let currentCountry = config.country;
let currentHabitat = config.habitat;
let currentSeason = "봄";
let isNight = false;
let isPlaying = false;
let isDragging = false;
let dragMoved = false;
let previousMouseX = 0;
let previousMouseY = 0;
let yaw = 0;
let pitch = 0;
let elapsed = 0;

const discovered = new Set();
const interactable = [];
const animatedCreatures = [];
const scenery = [];

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b8dba0");
scene.fog = new THREE.Fog("#b8dba0", 22, 75);

const camera = new THREE.PerspectiveCamera(
    70,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    160
);
camera.position.set(0, 1.7, 8);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

renderer.domElement.style.touchAction = "none";

const skyLight = new THREE.HemisphereLight("#e8f5d9", "#59634b", 2.0);
scene.add(skyLight);

const sun = new THREE.DirectionalLight("#fff0cc", 2.4);
sun.position.set(-12, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const groundMaterial = new THREE.MeshStandardMaterial({
    color: "#62884d",
    roughness: 1
});
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const world = new THREE.Group();
scene.add(world);

const flowerColors = ["#f4b6cf", "#f7d76b", "#eee7ff", "#ef947c"];
const seasonColors = {
    "봄": {
        ground: "#8eae68",
        leaves: ["#91bd70", "#b0d58c", "#6d9c54"],
        flower: true,
        description: "새잎이 돋고 꽃이 피기 시작하는 계절입니다. 곤충의 활동이 늘고, 많은 생물이 번식과 둥지 준비를 시작합니다."
    },
    "여름": {
        ground: "#56834a",
        leaves: ["#276b39", "#397e42", "#4b914a"],
        flower: true,
        description: "기온이 높고 식물이 활발하게 자라는 계절입니다. 곤충과 새의 활동을 관찰하기 좋지만, 실제 활동 시기는 지역과 종에 따라 달라집니다."
    },
    "가을": {
        ground: "#9c8d53",
        leaves: ["#b97836", "#c99b45", "#8d6736"],
        flower: false,
        description: "열매와 씨앗이 익고 일부 낙엽수의 잎 색이 변합니다. 여러 생물이 먹이를 저장하거나 겨울을 준비합니다."
    },
    "겨울": {
        ground: "#b9c7c1",
        leaves: ["#526e55", "#607c60", "#48644c"],
        flower: false,
        description: "온대 지역은 기온이 낮아지고 일부 식물이 휴면합니다. 동물은 겨울잠, 이동, 먹이 탐색 등 종마다 다른 전략을 사용합니다."
    }
};

const habitats = {
    "브라질": {
        "열대우림": {
            climate: "따뜻하고 습한 열대우림",
            ground: "#4f7950",
            plants: ["거대한 활엽수", "야자수", "양치식물", "난초"],
            species: [
                ["재규어", "🐆", "포유류", "먹이사슬의 상위 포식자입니다. 숲과 물가를 오가며 생활합니다.", "day"],
                ["나무늘보", "🦥", "포유류", "나무 위에서 주로 생활하며 잎을 먹습니다.", "day"],
                ["카피바라", "🦫", "포유류", "물가와 습지 주변에서 풀을 먹고 생활합니다.", "day"],
                ["큰부리새", "🦜", "조류", "열대림의 나무에서 열매와 다양한 먹이를 찾습니다.", "day"],
                ["마코앵무", "🦜", "조류", "강한 부리로 씨앗과 견과류 등을 먹습니다.", "day"],
                ["오셀롯", "🐈", "포유류", "숲에서 작은 포유류와 새 등을 사냥하는 고양잇과 동물입니다.", "night"],
                ["청개구리", "🐸", "양서류", "습한 환경에서 생활하며 곤충을 먹습니다.", "night"],
                ["나비", "🦋", "곤충", "꽃의 꿀을 먹는 종이 있으며 꽃가루 이동에 도움을 줄 수 있습니다.", "day"],
                ["잎꾼개미", "🐜", "곤충", "잎 조각을 운반해 균류를 기르는 독특한 개미입니다.", "night"],
                ["독화살개구리", "🐸", "양서류", "중남미의 일부 열대림에 사는 개구리 무리입니다. 종마다 색과 독성에 차이가 있습니다.", "day"]
            ]
        },
        "습지": {
            climate: "강과 범람원이 발달한 습지",
            ground: "#527d65",
            plants: ["갈대", "수생식물", "야자수", "부들"],
            species: [
                ["카이만", "🐊", "파충류", "강과 습지에서 물고기와 다른 동물을 먹습니다.", "night"],
                ["카피바라", "🦫", "포유류", "물가에서 쉬고 풀을 먹는 대형 설치류입니다.", "day"],
                ["큰수달", "🦦", "포유류", "강에서 물고기를 잡아먹으며 무리로 생활하기도 합니다.", "day"],
                ["아나콘다", "🐍", "파충류", "물가와 습지에 적응한 큰 뱀입니다.", "night"],
                ["물총새", "🐦", "조류", "물가에서 물고기와 작은 수생동물을 사냥합니다.", "day"],
                ["잠자리", "🪰", "곤충", "유충은 물속에서 생활하며 성충은 다른 작은 곤충을 잡아먹습니다.", "day"],
                ["개구리", "🐸", "양서류", "물과 육지를 오가며 생활하는 종이 많습니다.", "night"],
                ["수련", "🪷", "수생식물", "물 위에 잎과 꽃을 펼치는 수생식물입니다.", "day"]
            ]
        }
    },
    "대한민국": {
        "산림": {
            climate: "계절 변화가 뚜렷한 온대 산림",
            ground: "#64834c",
            plants: ["소나무", "참나무", "단풍나무", "진달래", "고사리", "버섯"],
            species: [
                ["고라니", "🦌", "포유류", "풀과 잎 등을 먹으며 숲 가장자리와 초지에서도 생활합니다.", "day"],
                ["다람쥐", "🐿️", "포유류", "씨앗과 열매를 먹고 먹이를 저장하기도 합니다.", "day"],
                ["너구리", "🦝", "포유류", "잡식성으로 열매, 곤충, 작은 동물 등을 먹습니다.", "night"],
                ["멧돼지", "🐗", "포유류", "땅을 파서 뿌리와 무척추동물 등을 찾는 잡식성 동물입니다.", "night"],
                ["딱따구리", "🐦", "조류", "나무줄기에서 곤충을 찾고 나무 구멍을 둥지로 이용할 수 있습니다.", "day"],
                ["올빼미", "🦉", "조류", "종에 따라 주로 밤에 활동하며 작은 동물을 사냥합니다.", "night"],
                ["사슴벌레", "🪲", "곤충", "애벌레는 썩은 나무와 관련된 환경에서 자라는 종이 있습니다.", "night"],
                ["호랑나비", "🦋", "곤충", "애벌레와 성충의 먹이가 다르며 식물과 밀접하게 연결됩니다.", "day"],
                ["청개구리", "🐸", "양서류", "습한 곳에서 생활하고 곤충을 먹습니다.", "night"],
                ["소나무", "🌲", "식물", "바늘 모양 잎을 가진 상록 침엽수입니다.", "day"],
                ["참나무", "🌳", "식물", "도토리를 생산하며 많은 동물에게 먹이와 서식처를 제공합니다.", "day"],
                ["진달래", "🌸", "식물", "봄에 꽃이 피는 낙엽 관목입니다.", "day"],
                ["고사리", "🌿", "식물", "포자로 번식하는 양치식물입니다.", "day"],
                ["버섯", "🍄", "균류", "많은 균류는 유기물을 분해해 영양분 순환에 기여합니다.", "night"]
            ]
        },
        "습지": {
            climate: "하천과 연못 주변의 습지",
            ground: "#648d77",
            plants: ["갈대", "부들", "버드나무", "수련"],
            species: [
                ["수달", "🦦", "포유류", "하천에서 물고기와 수생동물을 먹으며 살아갑니다.", "day"],
                ["백로", "🪽", "조류", "얕은 물에서 물고기와 작은 수생동물을 잡습니다.", "day"],
                ["청둥오리", "🦆", "조류", "물가에서 식물과 작은 수생동물을 먹습니다.", "day"],
                ["개구리", "🐸", "양서류", "습지에서 번식하고 곤충을 먹습니다.", "night"],
                ["잠자리", "🪰", "곤충", "물속 유충 시기를 거치는 곤충입니다.", "day"],
                ["물방개", "🪲", "곤충", "물속에서 생활하는 수서 딱정벌레입니다.", "night"],
                ["버드나무", "🌳", "식물", "물가에서 자라는 종이 많고 가지가 유연합니다.", "day"],
                ["수련", "🪷", "식물", "물 위에 잎을 펼쳐 빛을 받습니다.", "day"]
            ]
        }
    },
    "호주": {
        "유칼립투스 숲": {
            climate: "유칼립투스가 우점하는 호주 숲",
            ground: "#71875a",
            plants: ["유칼립투스", "뱅크시아", "아카시아", "고사리"],
            species: [
                ["코알라", "🐨", "포유류", "특정 유칼립투스 잎을 주로 먹으며 나무 위에서 많은 시간을 보냅니다.", "night"],
                ["웜뱃", "🐾", "포유류", "굴을 파고 살며 주로 밤에 풀과 뿌리 등을 먹습니다.", "night"],
                ["왈라비", "🦘", "포유류", "풀과 잎을 먹는 유대류로 종에 따라 숲과 초지에서 삽니다.", "dawn"],
                ["쿠카부라", "🐦", "조류", "큰 물총새류로 작은 동물과 파충류 등을 먹습니다.", "day"],
                ["바늘두더지", "🦔", "포유류", "개미와 흰개미 등을 먹으며 땅을 파는 데 적합합니다.", "night"],
                ["주머니쥐", "🐾", "포유류", "나무 구멍을 이용하고 과일과 잎 등을 먹는 종이 있습니다.", "night"],
                ["강력한올빼미", "🦉", "조류", "숲에서 야간에 사냥하는 대형 올빼미입니다.", "night"],
                ["매미", "🪰", "곤충", "유충은 오랫동안 땅속에서 자라는 종이 있습니다.", "day"],
                ["개미", "🐜", "곤충", "토양을 움직이고 유기물과 다른 생물을 이용합니다.", "day"],
                ["유칼립투스", "🌳", "식물", "많은 코알라가 먹이와 쉼터로 이용하는 나무입니다.", "day"],
                ["뱅크시아", "🌼", "식물", "꽃차례에 꿀이 생겨 새와 곤충을 끌어들일 수 있습니다.", "day"]
            ]
        },
        "건조 지대": {
            climate: "강수량이 적은 호주 건조 지대",
            ground: "#b6a06b",
            plants: ["스피니펙스 풀", "아카시아", "건조지 관목", "유칼립투스"],
            species: [
                ["붉은캥거루", "🦘", "포유류", "건조한 초지에서 풀과 식물을 먹습니다.", "dawn"],
                ["딩고", "🐕", "포유류", "호주의 야생 개과 동물로 여러 환경에서 먹이를 찾습니다.", "dawn"],
                ["바늘두더지", "🦔", "포유류", "개미와 흰개미를 먹으며 더운 시간대를 피할 수 있습니다.", "night"],
                ["모니터도마뱀", "🦎", "파충류", "건조 지대의 종은 체온을 조절하며 활동합니다.", "day"],
                ["코카투", "🦜", "조류", "강한 부리로 씨앗과 견과류 등을 먹습니다.", "day"],
                ["흰개미", "🐜", "곤충", "식물성 물질을 분해하는 데 중요한 역할을 합니다.", "night"],
                ["아카시아", "🌿", "식물", "건조 환경에 적응한 여러 종이 있습니다.", "day"],
                ["스피니펙스", "🌾", "식물", "건조한 호주 내륙의 대표적인 풀 무리입니다.", "day"]
            ]
        }
    },
    "케냐": {
        "사바나": {
            climate: "풀과 드문드문 나무가 자라는 사바나",
            ground: "#b59a55",
            plants: ["아카시아", "바오밥", "키 큰 풀", "가시관목"],
            species: [
                ["사자", "🦁", "포유류", "먹이사슬의 상위 포식자로 주로 어두운 시간에 활동하기도 합니다.", "night"],
                ["기린", "🦒", "포유류", "긴 목으로 나무의 잎을 먹습니다.", "day"],
                ["얼룩말", "🦓", "포유류", "무리를 이루어 생활하며 풀을 먹습니다.", "day"],
                ["아프리카코끼리", "🐘", "포유류", "식물과 나무껍질 등을 먹고 서식지 구조에 영향을 줍니다.", "day"],
                ["점박이하이에나", "🐾", "포유류", "사냥과 사체 이용을 모두 하며 주로 어두운 시간에 활동합니다.", "night"],
                ["미어캣", "🐾", "포유류", "아프리카 남부의 건조한 지역에 살며, 케냐의 대표적인 사바나 종은 아닙니다.", "day"],
                ["쇠똥구리", "🪲", "곤충", "동물의 배설물을 이용해 영양분 순환을 돕습니다.", "day"],
                ["흰개미", "🐜", "곤충", "식물성 물질을 분해하며 토양 생태계에 영향을 줍니다.", "night"],
                ["아카시아", "🌳", "식물", "가시와 작은 잎을 가진 종들이 사바나에 자랍니다.", "day"],
                ["바오밥", "🌳", "식물", "굵은 줄기에 물을 저장하는 것으로 알려진 나무입니다.", "day"],
                ["나비", "🦋", "곤충", "꽃의 꿀을 먹고 꽃가루 이동에 기여할 수 있습니다.", "day"]
            ]
        },
        "초원": {
            climate: "풀의 비중이 높은 열대 초원",
            ground: "#b8a05a",
            plants: ["키 큰 풀", "짧은 풀", "아카시아", "가시관목"],
            species: [
                ["얼룩말", "🦓", "포유류", "풀을 뜯으며 무리를 이루어 생활합니다.", "day"],
                ["가젤", "🦌", "포유류", "빠르게 달리며 풀과 잎을 먹는 영양류입니다.", "day"],
                ["사자", "🦁", "포유류", "초식동물을 사냥하는 포식자입니다.", "night"],
                ["타조", "🐦", "조류", "날지 못하는 대형 조류로 씨앗과 작은 동물도 먹습니다.", "day"],
                ["코끼리", "🐘", "포유류", "나무와 풀을 먹고 이동하며 식생에 영향을 줍니다.", "day"],
                ["쇠똥구리", "🪲", "곤충", "배설물을 먹이와 번식 장소로 이용합니다.", "day"],
                ["흰개미", "🐜", "곤충", "초원에서 식물성 물질 분해와 토양 과정에 기여합니다.", "night"],
                ["아카시아", "🌳", "식물", "풀 사이에 자라는 나무로 그늘과 먹이를 제공합니다.", "day"]
            ]
        }
    },
    "캐나다": {
        "침엽수림": {
            climate: "겨울이 길고 침엽수가 우점하는 아한대 숲",
            ground: "#71856a",
            plants: ["가문비나무", "전나무", "자작나무", "이끼", "블루베리"],
            species: [
                ["무스", "🫎", "포유류", "큰 사슴류로 잎과 수생식물 등을 먹습니다.", "dawn"],
                ["비버", "🦫", "포유류", "나무를 이용해 댐을 만들고 물가에서 생활합니다.", "night"],
                ["흑곰", "🐻", "포유류", "열매, 식물, 곤충 등 다양한 먹이를 이용합니다.", "day"],
                ["캐나다스라소니", "🐈", "포유류", "숲에 살며 눈신토끼 등을 사냥합니다.", "night"],
                ["눈신토끼", "🐇", "포유류", "계절에 따라 털색이 달라지는 개체가 있으며 식물을 먹습니다.", "dawn"],
                ["캐나다어치", "🐦", "조류", "숲에서 먹이를 저장하고 여러 종류의 먹이를 이용합니다.", "day"],
                ["딱따구리", "🐦", "조류", "나무껍질 아래의 곤충 등을 찾아 먹습니다.", "day"],
                ["모기", "🦟", "곤충", "유충은 물에서 자라며 성충은 여러 동물의 먹이가 됩니다.", "night"],
                ["가문비나무", "🌲", "식물", "추운 기후의 숲을 이루는 대표적인 침엽수입니다.", "day"],
                ["블루베리", "🫐", "식물", "열매는 새와 포유류의 먹이가 될 수 있습니다.", "day"],
                ["이끼", "🌿", "식물에 가까운 선태식물", "습한 바닥과 바위에 자라며 물을 머금습니다.", "day"]
            ]
        },
        "호수 주변": {
            climate: "호수와 숲이 연결된 담수 생태계",
            ground: "#6d967f",
            plants: ["갈대", "수련", "버드나무", "가문비나무"],
            species: [
                ["비버", "🦫", "포유류", "물가에서 나무와 식물을 이용해 살아갑니다.", "night"],
                ["수달", "🦦", "포유류", "물고기와 수생동물을 먹는 반수생 포유류입니다.", "day"],
                ["무스", "🫎", "포유류", "호숫가의 수생식물과 잎을 먹을 수 있습니다.", "dawn"],
                ["아비", "🐦", "조류", "호수에서 잠수해 물고기를 잡는 북미의 물새입니다.", "day"],
                ["송어", "🐟", "어류", "차가운 담수에 사는 종이 있으며 물속 먹이망의 일부입니다.", "day"],
                ["잠자리", "🪰", "곤충", "유충은 물속에서 자라며 성충은 날아다니는 곤충을 잡습니다.", "day"],
                ["개구리", "🐸", "양서류", "호숫가의 얕은 물과 습한 환경을 이용합니다.", "night"],
                ["수련", "🪷", "식물", "호수의 얕은 물에서 잎과 꽃을 펼칩니다.", "day"],
                ["갈대", "🌾", "식물", "물가에서 자라며 작은 동물의 은신처를 제공합니다.", "day"]
            ]
        }
    }
};

// ================================================
// UI: 계절, 시간, 안내
// ================================================

const toolbar = document.createElement("div");
toolbar.id = "biomap-toolbar";
toolbar.style.cssText = `
    position:fixed;top:92px;left:20px;z-index:30;
    display:flex;gap:8px;align-items:center;flex-wrap:wrap;
    max-width:calc(100% - 40px);
    background:rgba(20,57,35,.82);padding:10px 12px;
    border-radius:14px;color:white;font:14px Arial,sans-serif;
`;
toolbar.innerHTML = `
    <label>계절
        <select id="season-select" style="margin-left:5px;padding:6px;border-radius:8px">
            <option>봄</option><option>여름</option><option>가을</option><option>겨울</option>
        </select>
    </label>
    <button id="time-toggle" style="padding:7px 10px;border:0;border-radius:8px;cursor:pointer">🌙 밤으로 전환</button>
    <span id="time-label">☀️ 낮</span>
`;
document.body.appendChild(toolbar);

const seasonSelect = document.getElementById("season-select");
const timeToggle = document.getElementById("time-toggle");
const timeLabel = document.getElementById("time-label");

const seasonInfo = document.createElement("div");
seasonInfo.style.cssText = `
    position:fixed;right:20px;top:150px;z-index:10;
    width:min(320px,calc(100% - 40px));padding:14px 16px;
    color:#244b32;background:rgba(249,255,244,.94);
    border-radius:14px;font:13px/1.65 Arial,'Malgun Gothic',sans-serif;
`;
document.body.appendChild(seasonInfo);

function setMessage(text) {
    bottomMessage.textContent = text;
}

function updateSeasonInfo() {
    seasonInfo.innerHTML = `
        <strong>${currentCountry} · ${currentHabitat} · ${currentSeason}</strong>
        <div style="margin-top:6px">${seasonColors[currentSeason].description}</div>
        <div style="margin-top:6px">현재 시간: ${isNight ? "밤" : "낮"}</div>
        <div>이 환경의 생물 예시는 실제 분포를 참고한 교육용 모형입니다.</div>
    `;
}

function applyTime() {
    if (isNight) {
        scene.background.set("#101d36");
        scene.fog.color.set("#101d36");
        skyLight.intensity = 0.65;
        sun.intensity = 0.22;
        sun.color.set("#9ab9ff");
        timeLabel.textContent = "🌙 밤";
        timeToggle.textContent = "☀️ 낮으로 전환";
    } else {
        scene.background.set("#b8dba0");
        scene.fog.color.set("#b8dba0");
        skyLight.intensity = 2.0;
        sun.intensity = 2.4;
        sun.color.set("#fff0cc");
        timeLabel.textContent = "☀️ 낮";
        timeToggle.textContent = "🌙 밤으로 전환";
    }

    updateSeasonInfo();
}

timeToggle.addEventListener("click", () => {
    isNight = !isNight;
    applyTime();
});

seasonSelect.addEventListener("change", () => {
    currentSeason = seasonSelect.value;
    groundMaterial.color.set(seasonColors[currentSeason].ground);
    rebuildEnvironment();
    updateSeasonInfo();
    setMessage(`${currentSeason} 환경으로 바뀌었어요.`);
});

// ================================================
// 생물 모형과 정보
// ================================================

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

function makeLabel(text, y = 2.0) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(20,57,35,0.82)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 72, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
    );
    sprite.scale.set(2.3, 0.72, 1);
    sprite.position.y = y;
    return sprite;
}

function makeCreature(species, x, z, index) {
    const [name, emoji, type, description, activity] = species;
    const group = new THREE.Group();
    const animalColor = [
        "#b77c4c", "#8b7355", "#d8c59a", "#777b7c",
        "#c2a06b", "#7c8c62", "#d2a4bb", "#7e9fc7"
    ][index % 8];

    const bodyMat = makeMaterial(animalColor);
    const darkMat = makeMaterial("#35352e");
    const body = addMesh(
        group, new THREE.SphereGeometry(0.48, 12, 9),
        bodyMat, 0, 0.68, 0
    );
    body.scale.set(1.2, 0.8, 1.6);

    addMesh(
        group, new THREE.SphereGeometry(0.30, 12, 9),
        bodyMat, 0, 1.12, -0.46
    );

    addMesh(
        group, new THREE.SphereGeometry(0.05, 8, 6),
        darkMat, -0.12, 1.17, -0.72
    );
    addMesh(
        group, new THREE.SphereGeometry(0.05, 8, 6),
        darkMat, 0.12, 1.17, -0.72
    );

    for (const legX of [-0.27, 0.27]) {
        for (const legZ of [-0.35, 0.35]) {
            addMesh(
                group, new THREE.CylinderGeometry(0.07, 0.09, 0.43, 6),
                bodyMat, legX, 0.27, legZ
            );
        }
    }

    if (["기린", "사자", "얼룩말", "무스", "고라니"].includes(name)) {
        const neck = addMesh(
            group, new THREE.CylinderGeometry(0.13, 0.20, 0.8, 8),
            bodyMat, 0, 1.28, -0.42
        );
        neck.rotation.x = -0.25;
    }

    if (name === "나비") {
        for (const side of [-1, 1]) {
            const wing = addMesh(
                group, new THREE.SphereGeometry(0.24, 8, 6),
                makeMaterial("#f0a9d2"), side * 0.2, 1.25, 0
            );
            wing.scale.set(1, 0.7, 0.2);
            wing.userData.wing = true;
        }
    }

    if (["소나무", "참나무", "유칼립투스", "아카시아", "바오밥", "가문비나무"].includes(name)) {
        group.clear();

        const trunk = addMesh(
            group, new THREE.CylinderGeometry(0.18, 0.3, 2.3, 7),
            makeMaterial("#765033"), 0, 1.15, 0
        );

        const foliageColor =
            name === "가을"
                ? "#c6813e"
                : seasonColors[currentSeason].leaves[index % 3];

        if (["소나무", "가문비나무"].includes(name)) {
            for (let i = 0; i < 3; i++) {
                addMesh(
                    group, new THREE.ConeGeometry(1.0 - i * 0.13, 1.6, 7),
                    makeMaterial(foliageColor), 0, 2.0 + i * 0.72, 0
                );
            }
        } else {
            const crown = addMesh(
                group, new THREE.SphereGeometry(1.0, 9, 7),
                makeMaterial(foliageColor), 0, 2.6, 0
            );
            crown.scale.set(1.35, 0.8, 1.15);
        }
    } else if (["고사리", "이끼", "풀", "갈대", "진달래", "블루베리", "수련", "난초", "뱅크시아"].includes(name)) {
        group.clear();

        const plantColor = seasonColors[currentSeason].leaves[index % 3];

        if (name === "수련") {
            addMesh(group, new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), makeMaterial("#477f4e"), 0, 0.1, 0);
            addMesh(group, new THREE.SphereGeometry(0.25, 10, 7), makeMaterial("#f1a8cf"), 0, 0.28, 0);
        } else {
            for (let i = 0; i < 5; i++) {
                const leaf = addMesh(
                    group, new THREE.ConeGeometry(0.14, 0.75, 5),
                    makeMaterial(plantColor),
                    Math.sin(i * 1.2) * 0.25,
                    0.35,
                    Math.cos(i * 1.2) * 0.25
                );
                leaf.rotation.z = (i - 2) * 0.18;
            }

            if (seasonColors[currentSeason].flower) {
                addMesh(
                    group, new THREE.SphereGeometry(0.19, 8, 6),
                    makeMaterial(flowerColors[index % flowerColors.length]),
                    0, 0.82, 0
                );
            }
        }
    } else {
        group.add(makeLabel(`${emoji} ${name}`, 1.95));
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
    group.userData.walking = !["식물", "수생식물", "균류"].includes(type);
    group.userData.plant = ["식물", "수생식물", "균류"].includes(type);

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

function makeTree(x, z, scale, index) {
    const group = new THREE.Group();

    addMesh(
        group, new THREE.CylinderGeometry(0.18, 0.30, 2.7, 7),
        makeMaterial("#705038"), 0, 1.35, 0
    );

    const color = seasonColors[currentSeason].leaves[index % 3];

    for (let i = 0; i < 3; i++) {
        addMesh(
            group, new THREE.ConeGeometry(1.3 - i * 0.15, 2.0, 7),
            makeMaterial(color), 0, 2.3 + i * 0.85, 0
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
        group, new THREE.CylinderGeometry(0.025, 0.04, 0.42, 5),
        makeMaterial("#437b3c"), 0, 0.21, 0
    );

    addMesh(
        group, new THREE.SphereGeometry(0.14, 8, 6),
        makeMaterial(flowerColors[index % flowerColors.length]),
        0, 0.46, 0
    );

    group.position.set(x, 0, z);
    world.add(group);
    scenery.push(group);
}

function clearWorld() {
    while (world.children.length) {
        const object = world.children[0];
        world.remove(object);
        object.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    interactable.length = 0;
    animatedCreatures.length = 0;
    scenery.length = 0;
}

function rebuildEnvironment() {
    clearWorld();

    const habitat = habitats[currentCountry]?.[currentHabitat]
        || habitats["대한민국"]["산림"];

    currentHabitat = habitats[currentCountry]?.[currentHabitat]
        ? currentHabitat
        : "산림";

    habitatName.textContent = `${currentCountry} · ${currentHabitat}`;
    groundMaterial.color.set(seasonColors[currentSeason].ground);
    groundMaterial.color.lerp(new THREE.Color(habitat.ground), 0.55);

    // 주변 숲의 배경 나무
    for (let i = 0; i < 70; i++) {
        const x = (Math.random() - 0.5) * 62;
        const z = (Math.random() - 0.5) * 62;

        if (Math.abs(x) < 4 && z > -8 && z < 12) continue;

        makeTree(x, z, 0.65 + Math.random() * 0.7, i);
    }

    // 서식지의 대표 식물과 생물
    const list = habitat.species;

    list.forEach((species, index) => {
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

    // 작은 꽃과 풀을 추가
    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 42;
        const z = (Math.random() - 0.5) * 42;

        if (seasonColors[currentSeason].flower && Math.random() > 0.4) {
            makeFlower(x, z, i);
        }
    }

    updateSeasonInfo();
    applyTime();
}

function showSpeciesInfo(species) {
    if (!species) return;

    speciesEmoji.textContent = species.emoji;
    speciesName.textContent = species.name;
    speciesType.textContent = species.type;

    const activityText = {
        day: "활동 정보: 주행성 예시",
        night: "활동 정보: 야행성 예시",
        dawn: "활동 정보: 새벽이나 해질 무렵 활동하는 종의 예시"
    };

    speciesDescription.textContent =
        `${species.description} ${activityText[species.activity] || ""} ` +
        "실제 활동 시간은 종, 계절, 날씨와 지역에 따라 달라질 수 있습니다.";

    speciesPanel.classList.remove("hidden");

    if (!discovered.has(species.name)) {
        discovered.add(species.name);
        discoveryCount.textContent = String(discovered.size);
    }

    setMessage(`${species.name} 관찰 기록을 열었어요.`);
}

closeSpeciesButton.addEventListener("click", () => {
    speciesPanel.classList.add("hidden");
});

// ================================================
// 마우스 드래그 시선 이동 및 생물 클릭
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
// WASD 이동: D는 오른쪽, A는 왼쪽
// ================================================

const keys = Object.create(null);

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (["w", "a", "s", "d", " "].includes(event.key.toLowerCase())) {
        event.preventDefault();
    }

    if (event.key === "Escape") {
        isDragging = false;
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
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
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
// 동물 움직임과 낮/밤 활동 표시
// ================================================

function updateCreatures(delta) {
    elapsed += delta;

    animatedCreatures.forEach((group) => {
        const data = group.userData;
        if (!data.species) return;

        const active = data.species.activity;
        const activityMatches =
            (isNight && active === "night") ||
            (!isNight && active !== "night");

        group.visible = true;

        if (data.plant) return;

        if (data.walking && activityMatches) {
            const speed = active === "night" ? 0.22 : 0.12;
            group.position.x = data.baseX + Math.sin(elapsed * speed + data.phase) * 0.8;
            group.position.z = data.baseZ + Math.cos(elapsed * speed + data.phase) * 0.45;
            group.rotation.y += Math.sin(elapsed + data.phase) * delta * 0.15;
        }

        group.position.y = data.plant
            ? 0
            : Math.max(0, Math.sin(elapsed * 3 + data.phase) * 0.035);
    });
}

// ================================================
// 시작 및 화면 크기
// ================================================

startButton.addEventListener("click", () => {
    isPlaying = true;
    introPanel.classList.add("hidden");
    setMessage("WASD로 이동하고, 마우스로 둘러보세요. 생물을 클릭하면 정보를 볼 수 있어요.");
});

window.addEventListener("resize", () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    updateMovement(delta);
    updateCreatures(delta);

    renderer.render(scene, camera);
}

const clock = new THREE.Clock();

rebuildEnvironment();
applyTime();
animate();
