import streamlit as st
import streamlit.components.v1 as components


def apply_nature_theme():
    """모든 페이지에 공통 자연 테마 적용"""

    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Pretendard:wght@400;500;600;700;800&display=swap');

    :root {
        --forest: #245b3b;
        --forest-dark: #153f2a;
        --leaf: #78ad58;
        --lime: #d8edaa;
        --cream: #f8faef;
        --glass: rgba(255, 255, 255, 0.76);
        --border: rgba(59, 111, 65, 0.15);
    }

    .stApp {
        background:
            radial-gradient(
                ellipse at 0% 0%,
                rgba(190, 231, 151, 0.58),
                transparent 38%
            ),
            radial-gradient(
                ellipse at 100% 15%,
                rgba(131, 191, 117, 0.28),
                transparent 32%
            ),
            linear-gradient(
                145deg,
                #f5f9e9 0%,
                #e7f3d9 48%,
                #d9edcf 100%
            );

        color: var(--forest-dark);
        font-family: 'Pretendard', 'Gowun Dodum', sans-serif;
    }

    .main .block-container {
        max-width: 1240px;
        padding-top: 2rem;
        padding-bottom: 4rem;
    }

    h1, h2, h3 {
        color: var(--forest) !important;
        letter-spacing: -0.7px;
    }

    h1 {
        font-weight: 800 !important;
    }

    p, label, li {
        color: #355b40;
    }

    /* 상단 메뉴 영역 */
    header[data-testid="stHeader"] {
        background: rgba(245, 249, 233, 0.70);
    }

    /* 유리 느낌의 카드 */
    div[data-testid="stMetric"],
    div[data-testid="stVerticalBlockBorderWrapper"] {
        border-radius: 22px;
    }

    div[data-testid="stMetric"] {
        background: var(--glass);
        border: 1px solid var(--border);
        padding: 20px;
        box-shadow: 0 8px 25px rgba(38, 84, 43, 0.06);
    }

    div[data-testid="stMetricLabel"] {
        color: #58785d;
        font-weight: 600;
    }

    div[data-testid="stMetricValue"] {
        color: var(--forest);
        font-weight: 800;
    }

    /* 버튼 */
    .stButton > button {
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 14px;
        background: linear-gradient(135deg, #34794a, #5d9b50);
        color: white;
        font-weight: 700;
        padding: 0.55rem 1rem;
        transition: all 0.22s ease;
        box-shadow: 0 5px 13px rgba(43, 104, 54, 0.13);
    }

    .stButton > button:hover {
        background: linear-gradient(135deg, #245c38, #438343);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 17px rgba(43, 104, 54, 0.2);
    }

    /* 선택 메뉴 */
    div[data-baseweb="select"] > div {
        border-radius: 13px;
        border-color: #c6dfb7;
        background-color: rgba(255,255,255,0.82);
    }

    /* 슬라이더 */
    div[data-testid="stSlider"] [role="slider"] {
        background-color: #43834b;
        border-color: #43834b;
    }

    /* 데이터 테이블 */
    div[data-testid="stDataFrame"] {
        border: 1px solid var(--border);
        border-radius: 17px;
        overflow: hidden;
    }

    /* 생물 카드 */
    .nature-card {
        background: rgba(255, 255, 255, 0.77);
        border: 1px solid rgba(77, 128, 74, 0.17);
        border-radius: 22px;
        padding: 22px;
        box-shadow: 0 8px 24px rgba(35, 86, 44, 0.07);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        height: 100%;
    }

    .nature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 32px rgba(35, 86, 44, 0.13);
    }

    .nature-card .animal {
        font-size: 46px;
        margin-bottom: 8px;
    }

    .nature-card .animal-name {
        font-size: 20px;
        font-weight: 800;
        color: #245b3b;
        margin-bottom: 5px;
    }

    .nature-card .animal-type {
        display: inline-block;
        padding: 5px 11px;
        border-radius: 20px;
        background: #e4f1d8;
        color: #477448;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 10px;
    }

    .nature-card .animal-desc {
        color: #58725b;
        font-size: 14px;
        line-height: 1.7;
    }

    /* 큰 제목 영역 */
    .nature-hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(120deg, #174a30, #34794b 65%, #79a95b);
        border-radius: 30px;
        padding: 38px;
        color: white;
        box-shadow: 0 18px 40px rgba(32, 84, 44, 0.19);
        margin-bottom: 26px;
    }

    .nature-hero::after {
        content: "❧";
        position: absolute;
        right: 28px;
        bottom: -54px;
        font-size: 190px;
        color: rgba(255,255,255,0.10);
        transform: rotate(-20deg);
    }

    .nature-hero .eyebrow {
        color: #d7edb8;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 3px;
        margin-bottom: 10px;
    }

    .nature-hero .hero-title {
        color: white;
        font-size: clamp(30px, 4vw, 46px);
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 12px;
    }

    .nature-hero .hero-desc {
        color: rgba(255,255,255,0.87);
        font-size: 16px;
        line-height: 1.8;
        max-width: 650px;
    }

    /* 섹션 제목 */
    .nature-section {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 30px 0 15px;
        color: #245b3b;
        font-size: 23px;
        font-weight: 800;
    }

    .nature-section::before {
        content: "";
        width: 5px;
        height: 25px;
        background: linear-gradient(#82b85d, #34794b);
        border-radius: 10px;
    }

    /* 하단 안내 */
    .nature-footer {
        text-align: center;
        color: #648067;
        font-size: 12px;
        padding: 25px 0 8px;
        border-top: 1px solid rgba(68, 112, 69, 0.14);
        margin-top: 35px;
    }

    /* 동작을 줄이도록 설정한 환경에서는 움직임 비활성화 */
    @media (prefers-reduced-motion: reduce) {
        .nature-card,
        .stButton > button {
            transition: none;
        }

        .nature-card:hover,
        .stButton > button:hover {
            transform: none;
        }
    }
    </style>
    """, unsafe_allow_html=True)


def show_falling_leaves():
    """페이지 상단에 은은하게 떨어지는 나뭇잎 표시"""

    components.html("""
    <div id="leaf-layer" aria-hidden="true"></div>

    <style>
    #leaf-layer {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        pointer-events: none;
        z-index: 999;
    }

    .falling-leaf {
        position: absolute;
        top: -60px;
        opacity: 0;
        animation: leaf-fall linear infinite;
        filter: drop-shadow(0 3px 3px rgba(38, 80, 38, 0.10));
        user-select: none;
    }

    @keyframes leaf-fall {
        0% {
            transform: translate3d(0, -5vh, 0) rotate(0deg);
            opacity: 0;
        }

        10% {
            opacity: 0.58;
        }

        45% {
            transform: translate3d(45px, 45vh, 0) rotate(160deg);
        }

        80% {
            opacity: 0.42;
        }

        100% {
            transform: translate3d(-35px, 110vh, 0) rotate(330deg);
            opacity: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .falling-leaf {
            display: none;
        }
    }
    </style>

    <script>
    const layer = document.getElementById("leaf-layer");

    if (layer && !layer.dataset.created) {
        layer.dataset.created = "true";

        const leaves = ["🍃", "🌿", "🍂"];
        const count = 13;

        for (let i = 0; i < count; i++) {
            const leaf = document.createElement("span");
            leaf.className = "falling-leaf";
            leaf.textContent = leaves[i % leaves.length];

            leaf.style.left = (Math.random() * 100) + "%";
            leaf.style.fontSize = (14 + Math.random() * 13) + "px";
            leaf.style.animationDuration = (12 + Math.random() * 14) + "s";
            leaf.style.animationDelay = (-Math.random() * 24) + "s";

            layer.appendChild(leaf);
        }
    }
    </script>
    """, height=0, scrolling=False)


def show_nature_hero(eyebrow, title, description):
    """공통 제목 배너"""

    st.markdown(f"""
    <section class="nature-hero">
        <div class="eyebrow">{eyebrow}</div>
        <div class="hero-title">{title}</div>
        <div class="hero-desc">{description}</div>
    </section>
    """, unsafe_allow_html=True)


def show_nature_section(title):
    """공통 섹션 제목"""

    st.markdown(
        f'<div class="nature-section">{title}</div>',
        unsafe_allow_html=True
    )
