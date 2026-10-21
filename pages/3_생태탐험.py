import streamlit as st
import random

from style import (
    apply_nature_theme,
    show_falling_leaves,
    show_nature_hero,
    show_nature_section,
)

st.set_page_config(
    page_title="생태 탐험",
    page_icon="🌿",
    layout="wide"
)

apply_nature_theme()
show_falling_leaves()
# -------------------------
# 페이지 제목
# -------------------------
show_nature_hero(
    "FIELD EXPLORATION · 03",
    "🌿 생태 탐험",
    "나라와 서식지를 선택하고 그곳에 살아가는 생물들의 세계를 탐험해 보세요."
)

st.info(
    "탐험할 국가와 서식지를 선택한 다음 생물을 관찰하면 "
    "각 생물의 특징과 생태 정보를 확인할 수 있어요."
)

st.info(
    "탐험 안내: 서식지를 선택한 뒤 생물을 눌러 "
    "이름과 생태적 특징을 확인할 수 있습니다."
)

# -------------------------
# 국가 및 서식지 선택
# -------------------------
col1, col2 = st.columns(2)

with col1:
    country = st.selectbox(
        "🌍 탐험할 국가",
        ["브라질", "대한민국", "호주", "케냐", "캐나다"]
    )

habitats = {
    "브라질": ["열대우림", "습지"],
    "대한민국": ["산림", "습지"],
    "호주": ["유칼립투스 숲", "건조 지대"],
    "케냐": ["사바나", "초원"],
    "캐나다": ["침엽수림", "호수 주변"]
}

with col2:
    habitat = st.selectbox(
        "🌳 탐험할 서식지",
        habitats[country]
    )

# -------------------------
# 서식지별 생태 정보
# -------------------------
habitat_data = {
    ("브라질", "열대우림"): {
        "emoji": "🌴",
        "description": "따뜻하고 비가 많이 내리는 숲입니다.",
        "background": "#d8edcf",
        "species": [
            {
                "name": "재규어",
                "emoji": "🐆",
                "type": "포유류",
                "desc": "열대림과 습지 등에서 생활하는 대형 고양잇과 동물입니다."
            },
            {
                "name": "나무늘보",
                "emoji": "🦥",
                "type": "포유류",
                "desc": "나무 위에서 생활하는 데 적응한 동물입니다."
            },
            {
                "name": "큰부리새",
                "emoji": "🦜",
                "type": "조류",
                "desc": "큰 부리가 특징인 열대 지역의 새입니다."
            }
        ]
    },
    ("브라질", "습지"): {
        "emoji": "🪷",
        "description": "물이 풍부하고 다양한 수생 생물이 살아가는 환경입니다.",
        "background": "#d7eee8",
        "species": [
            {
                "name": "카이만",
                "emoji": "🐊",
                "type": "파충류",
                "desc": "중남미의 강과 습지에서 볼 수 있는 악어류입니다."
            },
            {
                "name": "큰부리새",
                "emoji": "🦜",
                "type": "조류",
                "desc": "큰 부리가 특징인 새입니다."
            }
        ]
    },
    ("대한민국", "산림"): {
        "emoji": "🌲",
        "description": "계절에 따라 기온과 식생이 달라지는 산림입니다.",
        "background": "#e2efd9",
        "species": [
            {
                "name": "반달가슴곰",
                "emoji": "🐻",
                "type": "포유류",
                "desc": "산림 생태계에서 생활하는 곰입니다."
            },
            {
                "name": "다람쥐",
                "emoji": "🐿️",
                "type": "포유류",
                "desc": "숲에서 먹이를 찾고 씨앗을 저장하는 작은 포유류입니다."
            },
            {
                "name": "소나무",
                "emoji": "🌲",
                "type": "식물",
                "desc": "한국 산림에서 흔히 볼 수 있는 침엽수입니다."
            }
        ]
    },
    ("대한민국", "습지"): {
        "emoji": "🪷",
        "description": "물과 육지가 만나는 곳으로 다양한 생물이 서식합니다.",
        "background": "#d8eeea",
        "species": [
            {
                "name": "수달",
                "emoji": "🦦",
                "type": "포유류",
                "desc": "하천과 습지 주변에서 생활하며 물고기 등을 먹습니다."
            },
            {
                "name": "개구리",
                "emoji": "🐸",
                "type": "양서류",
                "desc": "물과 육지를 오가며 생활하는 양서류입니다."
            }
        ]
    },
    ("호주", "유칼립투스 숲"): {
        "emoji": "🌳",
        "description": "유칼립투스가 자라는 숲으로 여러 고유 생물의 서식지입니다.",
        "background": "#e4efd9",
        "species": [
            {
                "name": "코알라",
                "emoji": "🐨",
                "type": "포유류",
                "desc": "유칼립투스 잎을 주로 먹으며 나무 위에서 생활합니다."
            },
            {
                "name": "앵무새",
                "emoji": "🦜",
                "type": "조류",
                "desc": "호주에는 다양한 종류의 앵무새가 서식합니다."
            }
        ]
    },
    ("호주", "건조 지대"): {
        "emoji": "🏜️",
        "description": "강수량이 적어 건조 환경에 적응한 생물이 살아갑니다.",
        "background": "#f4e6c8",
        "species": [
            {
                "name": "붉은캥거루",
                "emoji": "🦘",
                "type": "포유류",
                "desc": "호주의 건조하고 탁 트인 지역에서도 생활하는 캥거루입니다."
            },
            {
                "name": "도마뱀",
                "emoji": "🦎",
                "type": "파충류",
                "desc": "건조한 환경에 적응한 여러 종류의 도마뱀이 살아갑니다."
            }
        ]
    },
    ("케냐", "사바나"): {
        "emoji": "🌾",
        "description": "풀과 나무가 함께 자라며 대형 초식동물과 포식자가 살아갑니다.",
        "background": "#f3e9c8",
        "species": [
            {
                "name": "사자",
                "emoji": "🦁",
                "type": "포유류",
                "desc": "사바나 생태계의 대표적인 포식자입니다."
            },
            {
                "name": "기린",
                "emoji": "🦒",
                "type": "포유류",
                "desc": "긴 목을 이용해 높은 나무의 잎을 먹습니다."
            },
            {
                "name": "얼룩말",
                "emoji": "🦓",
                "type": "포유류",
                "desc": "무리 생활을 하며 주로 풀을 먹습니다."
            }
        ]
    },
    ("케냐", "초원"): {
        "emoji": "🌾",
        "description": "풀이 풍부한 지역으로 초식동물과 포식자가 함께 살아갑니다.",
        "background": "#f3e9c8",
        "species": [
            {
                "name": "얼룩말",
                "emoji": "🦓",
                "type": "포유류",
                "desc": "풀을 먹고 무리를 이루어 생활합니다."
            },
            {
                "name": "사자",
                "emoji": "🦁",
                "type": "포유류",
                "desc": "다른 동물을 사냥하는 대형 포식자입니다."
            }
        ]
    },
    ("캐나다", "침엽수림"): {
        "emoji": "🌲",
        "description": "추운 겨울을 견디는 침엽수가 넓게 자라는 숲입니다.",
        "background": "#e1eee4",
        "species": [
            {
                "name": "무스",
                "emoji": "🫎",
                "type": "포유류",
                "desc": "북아메리카의 숲과 습지 주변에서 생활하는 큰 사슴류입니다."
            },
            {
                "name": "비버",
                "emoji": "🦫",
                "type": "포유류",
                "desc": "물가에서 생활하며 나무를 이용해 댐을 만들기도 합니다."
            }
        ]
    },
    ("캐나다", "호수 주변"): {
        "emoji": "🏞️",
        "description": "호수와 숲이 어우러져 다양한 수생·육상 생물이 살아갑니다.",
        "background": "#d7eaf0",
        "species": [
            {
                "name": "비버",
                "emoji": "🦫",
                "type": "포유류",
                "desc": "호수와 강 주변에서 살아가는 반수생 포유류입니다."
            },
            {
                "name": "물고기",
                "emoji": "🐟",
                "type": "동물",
                "desc": "캐나다의 호수에는 여러 종류의 민물고기가 살아갑니다."
            }
        ]
    }
}

place = habitat_data[(country, habitat)]

# -------------------------
# 탐험 장면
# -------------------------
st.markdown("---")
st.subheader(f"{place['emoji']} {country} · {habitat}")

st.markdown(
    f"""
    <div style="
        background: {place['background']};
        border-radius: 24px;
        padding: 32px;
        min-height: 180px;
        border: 1px solid #cbdcc1;
        text-align: center;
    ">
        <div style="font-size: 64px;">{place['emoji']}</div>
        <h2 style="color:#245b3b;">생태 탐험 구역</h2>
        <p style="font-size:18px;">{place['description']}</p>
    </div>
    """,
    unsafe_allow_html=True
)

st.write("")
st.subheader("👣 주변 생물 탐색")
st.write("아래 생물을 선택해 이 서식지에 사는 생물을 알아보세요.")

# -------------------------
# 생물 선택 및 상세 정보
# -------------------------
columns = st.columns(len(place["species"]))

for index, species in enumerate(place["species"]):
    with columns[index]:
        st.markdown(
            f"""
            <div style="
                background: white;
                padding: 18px;
                border-radius: 18px;
                text-align: center;
                border: 1px solid #d5e8ca;
                min-height: 130px;
            ">
                <div style="font-size:42px;">{species['emoji']}</div>
                <strong>{species['name']}</strong>
                <p>{species['type']}</p>
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            f"{species['name']} 관찰하기",
            key=f"observe_{country}_{habitat}_{index}"
        ):
            st.session_state["observed_species"] = species
            st.session_state["observed_location"] = (country, habitat)

# 국가나 서식지를 바꿨다면 이전 선택 정보는 표시하지 않음
if st.session_state.get("observed_location") == (country, habitat):
    selected_species = st.session_state.get("observed_species")

    if selected_species:
        st.markdown("---")
        st.subheader(
            f"{selected_species['emoji']} 관찰 기록: {selected_species['name']}"
        )
        st.write(f"**분류:** {selected_species['type']}")
        st.write(f"**생태 정보:** {selected_species['desc']}")

        if st.button("관찰 기록 닫기"):
            st.session_state.pop("observed_species", None)
            st.session_state.pop("observed_location", None)
            st.rerun()

st.markdown("---")
st.caption(
    "교육용 생태 탐험 시뮬레이션입니다. "
    "표시되는 생물은 선택된 서식지를 설명하기 위한 예시이며, "
    "실제 현장에서 해당 생물을 관찰할 수 있다는 뜻은 아닙니다."
)

