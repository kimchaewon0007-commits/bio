
import streamlit as st
import math

st.set_page_config(
    page_title="GREEN HABITAT",
    page_icon="🌿",
    layout="wide",
)

# -----------------------------
# 기본 설정
# -----------------------------
st.markdown("""
<style>
    .stApp {
        background:
            radial-gradient(circle at 15% 10%, rgba(177, 230, 167, 0.45), transparent 28%),
            radial-gradient(circle at 90% 15%, rgba(120, 190, 120, 0.25), transparent 25%),
            linear-gradient(135deg, #eef9e9 0%, #dff2d8 45%, #cde8c5 100%);
        color: #183b24;
    }

    .main .block-container {
        max-width: 1200px;
        padding-top: 2rem;
        padding-bottom: 3rem;
    }

    .hero {
        background: linear-gradient(135deg, #1d6b3a, #3f914d);
        border-radius: 28px;
        padding: 34px 38px;
        color: white;
        box-shadow: 0 14px 35px rgba(38, 94, 49, 0.20);
        margin-bottom: 24px;
    }

    .hero h1 {
        font-size: 44px;
        margin: 0 0 8px 0;
        font-weight: 800;
    }

    .hero p {
        font-size: 17px;
        margin: 0;
        opacity: 0.92;
    }

    .section-title {
        font-size: 25px;
        font-weight: 800;
        color: #1c5d32;
        margin: 25px 0 12px 0;
    }

    .card {
        background: rgba(255,255,255,0.78);
        border: 1px solid rgba(57, 116, 64, 0.12);
        border-radius: 22px;
        padding: 20px;
        box-shadow: 0 8px 22px rgba(38, 94, 49, 0.08);
    }

    .metric {
        background: rgba(255,255,255,0.86);
        border-radius: 20px;
        padding: 18px;
        text-align: center;
        border: 1px solid rgba(57, 116, 64, 0.10);
        min-height: 130px;
    }

    .metric-label {
        color: #55735d;
        font-size: 14px;
        font-weight: 700;
    }

    .metric-value {
        color: #1d6b3a;
        font-size: 32px;
        font-weight: 800;
        margin-top: 8px;
    }

    .species {
        background: rgba(255,255,255,0.82);
        border-radius: 18px;
        padding: 16px;
        margin-bottom: 10px;
        border-left: 6px solid #4d9a54;
    }

    .species-name {
        font-size: 18px;
        font-weight: 800;
        color: #245d31;
    }

    .species-desc {
        color: #5a705f;
        font-size: 13px;
        margin-top: 4px;
    }

    .good {
        color: #24733c;
        font-weight: 800;
    }

    .warn {
        color: #a56a18;
        font-weight: 800;
    }

    .low {
        color: #a64040;
        font-weight: 800;
    }

    div[data-testid="stSlider"] {
        padding-bottom: 8px;
    }

    .stButton > button {
        border-radius: 14px;
        border: 0;
        background: #2f7d3d;
        color: white;
        font-weight: 700;
    }

    .stButton > button:hover {
        background: #246632;
        color: white;
    }
</style>
""", unsafe_allow_html=True)


# -----------------------------
# 생물 데이터
# 점수는 교육용 시뮬레이션 모델
# -----------------------------
SPECIES = [
    {
        "name": "🐸 청개구리",
        "temp": (18, 27),
        "humidity": (65, 95),
        "water": (55, 100),
        "type": "양서류",
        "desc": "따뜻하고 습한 환경과 물이 가까운 서식지를 선호해요.",
    },
    {
        "name": "🦋 나비",
        "temp": (18, 30),
        "humidity": (40, 80),
        "water": (30, 85),
        "type": "곤충",
        "desc": "적당히 따뜻하고 식물이 풍부한 환경에서 활동하기 좋아요.",
    },
    {
        "name": "🐝 꿀벌",
        "temp": (15, 30),
        "humidity": (35, 75),
        "water": (25, 75),
        "type": "곤충",
        "desc": "꽃이 많은 온화한 환경에서 활동하기 좋은 대표적인 수분 매개자예요.",
    },
    {
        "name": "🦎 도마뱀",
        "temp": (22, 34),
        "humidity": (30, 70),
        "water": (15, 70),
        "type": "파충류",
        "desc": "비교적 따뜻하고 건조한 환경에서 활동하기 쉬워요.",
    },
    {
        "name": "🦌 사슴",
        "temp": (5, 25),
        "humidity": (40, 85),
        "water": (35, 90),
        "type": "포유류",
        "desc": "숲과 초지가 함께 있고 물을 구할 수 있는 환경을 선호해요.",
    },
    {
        "name": "🦉 부엉이",
        "temp": (5, 27),
        "humidity": (35, 85),
        "water": (25, 80),
        "type": "조류",
        "desc": "숲과 나무가 있는 다양한 환경에서 서식할 수 있어요.",
    },
    {
        "name": "🐟 민물고기",
        "temp": (10, 25),
        "humidity": (60, 100),
        "water": (75, 100),
        "type": "어류",
        "desc": "깨끗하고 충분한 물이 있는 하천이나 호수 환경이 중요해요.",
    },
    {
        "name": "🦋 잠자리",
        "temp": (18, 32),
        "humidity": (55, 100),
        "water": (65, 100),
        "type": "곤충",
        "desc": "물가 주변에서 번식하며 따뜻하고 습한 날씨에 활발해요.",
    },
    {
        "name": "🌲 소나무",
        "temp": (5, 27),
        "humidity": (30, 80),
        "water": (25, 80),
        "type": "식물",
        "desc": "다양한 기후에서 자랄 수 있는 대표적인 침엽수예요.",
    },
    {
        "name": "🌻 야생화",
        "temp": (12, 30),
        "humidity": (35, 80),
        "water": (35, 85),
        "type": "식물",
        "desc": "햇빛과 적당한 수분이 있는 환경에서 다양한 종이 나타날 수 있어요.",
    },
]


def range_score(value, low, high):
    """범위 안이면 1, 범위에서 멀어질수록 0에 가까워지는 점수."""
    if low <= value <= high:
        return 1.0

    distance = low - value if value < low else value - high
    width = max(high - low, 1)
    return max(0.0, 1.0 - distance / (width * 1.5))


def species_score(species, temp, humidity, water):
    a = range_score(temp, *species["temp"])
    b = range_score(humidity, *species["humidity"])
    c = range_score(water, *species["water"])
    return (a * 0.45) + (b * 0.30) + (c * 0.25)


def biodiversity_score(temp, humidity, water):
    scores = [
        species_score(s, temp, humidity, water)
        for s in SPECIES
    ]

    # 여러 종이 동시에 살 수 있는 정도를 계산
    active = sum(1 for score in scores if score >= 0.55)
    average = sum(scores) / len(scores)

    # 종 수와 환경 안정성을 함께 반영
    result = (active / len(SPECIES)) * 65 + average * 35
    return round(max(0, min(100, result)), 1), scores


def score_message(score):
    if score >= 80:
        return "🌳 매우 다양한 생물이 살아가기 좋은 환경이에요.", "good"
    if score >= 60:
        return "🌿 다양한 생물이 살아갈 수 있는 환경이에요.", "good"
    if score >= 40:
        return "🍃 일부 생물에게 적합한 환경이에요.", "warn"
    return "🥀 현재 조건에서는 서식할 수 있는 생물이 적어요.", "low"


# -----------------------------
# 세션 상태
# -----------------------------
if "temperature" not in st.session_state:
    st.session_state.temperature = 22
if "humidity" not in st.session_state:
    st.session_state.humidity = 70
if "water" not in st.session_state:
    st.session_state.water = 65


# -----------------------------
# 헤더
# -----------------------------
st.markdown("""
<div class="hero">
    <h1>🌿 GREEN HABITAT</h1>
    <p>환경을 조절하고, 생물다양성이 어떻게 달라지는지 직접 실험해보세요.</p>
</div>
""", unsafe_allow_html=True)

st.markdown(
    '<div class="section-title">🌱 나만의 생태환경 만들기</div>',
    unsafe_allow_html=True
)

left, right = st.columns([1.05, 1.45])

with left:
    st.markdown('<div class="card">', unsafe_allow_html=True)

    temperature = st.slider(
        "🌡️ 온도",
        min_value=-5,
        max_value=40,
        value=st.session_state.temperature,
        step=1,
        help="주변 환경의 평균 온도를 설정합니다."
    )

    humidity = st.slider(
        "💧 습도",
        min_value=0,
        max_value=100,
        value=st.session_state.humidity,
        step=1,
        help="환경의 상대습도를 설정합니다."
    )

    water = st.slider(
        "🌊 수분·물의 풍부함",
        min_value=0,
        max_value=100,
        value=st.session_state.water,
        step=1,
        help="하천, 연못, 토양 수분 등을 단순화한 교육용 지표입니다."
    )

    st.session_state.temperature = temperature
    st.session_state.humidity = humidity
    st.session_state.water = water

    st.markdown('</div>', unsafe_allow_html=True)

with right:
    score, scores = biodiversity_score(
        temperature,
        humidity,
        water
    )

    message, message_class = score_message(score)

    st.markdown('<div class="card">', unsafe_allow_html=True)

    st.markdown(
        f"""
        <div style="text-align:center; padding:15px;">
            <div style="font-size:15px; color:#58735d; font-weight:700;">
                현재 생물다양성 지수
            </div>
            <div style="font-size:68px; font-weight:900; color:#28733c; margin:4px 0;">
                {score}
            </div>
            <div style="font-size:16px;" class="{message_class}">
                {message}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.progress(score / 100)

    st.markdown(
        """
        <div style="text-align:center; color:#657866; font-size:13px; margin-top:10px;">
            ※ 이 지수는 게임형 학습을 위한 단순화된 시뮬레이션입니다.
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown('</div>', unsafe_allow_html=True)


# -----------------------------
# 현재 환경
# -----------------------------
st.markdown(
    '<div class="section-title">☘️ 현재 생태환경</div>',
    unsafe_allow_html=True
)

m1, m2, m3 = st.columns(3)

with m1:
    st.markdown(
        f"""
        <div class="metric">
            <div class="metric-label">🌡️ 온도</div>
            <div class="metric-value">{temperature}℃</div>
        </div>
        """,
        unsafe_allow_html=True
    )

with m2:
    st.markdown(
        f"""
        <div class="metric">
            <div class="metric-label">💧 습도</div>
            <div class="metric-value">{humidity}%</div>
        </div>
        """,
        unsafe_allow_html=True
    )

with m3:
    st.markdown(
        f"""
        <div class="metric">
            <div class="metric-label">🌊 수분 환경</div>
            <div class="metric-value">{water}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


# -----------------------------
# 서식 가능성이 높은 생물
# -----------------------------
st.markdown(
    '<div class="section-title">🐾 이 환경에서는 어떤 생물이 살기 좋을까?</div>',
    unsafe_allow_html=True
)

ranked = sorted(
    zip(SPECIES, scores),
    key=lambda x: x[1],
    reverse=True
)

top_species = ranked[:6]

cols = st.columns(2)

for i, (species, s) in enumerate(top_species):
    with cols[i % 2]:
        percentage = round(s * 100)

        if percentage >= 75:
            label = "매우 적합"
        elif percentage >= 55:
            label = "적합"
        elif percentage >= 35:
            label = "부분적으로 적합"
        else:
            label = "적합도가 낮음"

        st.markdown(
            f"""
            <div class="species">
                <div class="species-name">
                    {species["name"]}
                    <span style="float:right; font-size:13px;">
                        {percentage}% · {label}
                    </span>
                </div>
                <div class="species-desc">
                    {species["type"]} · {species["desc"]}
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )


# -----------------------------
# 조건 변화 설명
# -----------------------------
st.markdown(
    '<div class="section-title">🔬 환경을 바꾸면 어떻게 될까?</div>',
    unsafe_allow_html=True
)

if temperature < 10:
    temp_text = "현재 온도에서는 추운 환경에 적응한 생물이 상대적으로 유리합니다."
elif temperature < 20:
    temp_text = "현재 온도에서는 서늘한 환경을 선호하는 생물이 비교적 유리합니다."
elif temperature <= 28:
    temp_text = "현재 온도는 다양한 생물이 함께 살아가기 좋은 범위에 가까워요."
else:
    temp_text = "현재 온도에서는 따뜻한 환경에 적응한 생물이 상대적으로 유리합니다."

if humidity < 35:
    humid_text = "습도가 낮아 습지나 물을 필요로 하는 생물에게 불리할 수 있어요."
elif humidity > 80:
    humid_text = "습도가 높아 양서류나 습한 환경을 이용하는 생물에게 유리할 수 있어요."
else:
    humid_text = "습도가 너무 높거나 낮지 않아 여러 생물이 이용할 수 있는 조건입니다."

st.markdown(
    f"""
    <div class="card">
        <p>🌡️ <b>온도 변화:</b> {temp_text}</p>
        <p>💧 <b>습도 변화:</b> {humid_text}</p>
        <p>🌊 <b>물의 변화:</b> 물이 풍부해질수록 물가와 습지를 이용하는 생물의 서식 가능성이 높아집니다.</p>
        <p style="color:#63806a; font-size:13px;">
            생물마다 선호하는 환경 범위가 다르기 때문에 하나의 조건만 바꾸는 것보다
            여러 환경 조건의 균형이 중요합니다.
        </p>
    </div>
    """,
    unsafe_allow_html=True
)


# -----------------------------
# 실험 추천
# -----------------------------
st.markdown(
    '<div class="section-title">🧪 직접 실험해보기</div>',
    unsafe_allow_html=True
)

st.markdown(
    """
    <div class="card">
        <b>실험 방법</b><br><br>
        ① 온도를 10℃로 설정해보기<br>
        ② 온도를 30℃로 바꿔보기<br>
        ③ 습도를 30% → 90%로 바꿔보기<br>
        ④ 물의 풍부함을 10 → 90으로 바꿔보기<br><br>
        조건이 달라질 때 <b>생물다양성 지수와 서식 가능 생물</b>이 어떻게 달라지는지 비교해보세요.
    </div>
    """,
    unsafe_allow_html=True
)

st.caption(
    "🌿 GREEN HABITAT · 생물다양성 교육용 시뮬레이션 | "
    "생물별 환경 적합성은 실제 개체수 예측이 아닌 단순화된 모델입니다."
