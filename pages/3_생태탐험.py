import streamlit as st
import random
from pathlib import Path
import streamlit.components.v1 as components

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
# -------------------------
# 3D 생태 탐험 화면
# -------------------------

st.markdown("---")

st.subheader(f"{place['emoji']} {country} · {habitat}")

st.write(
    "3D 자연 공간을 직접 탐험하며 "
    "주변 생물을 관찰해 보세요."
)

# 프로젝트 최상위 폴더의 explorer 폴더 경로
explorer_dir = Path(__file__).resolve().parent.parent / "explorer"

# 3D 화면에 필요한 파일 읽기
html_path = explorer_dir / "index.html"
css_path = explorer_dir / "style.css"
js_path = explorer_dir / "game.js"

# 파일이 모두 있는지 확인
missing_files = []

if not html_path.exists():
    missing_files.append("explorer/index.html")

if not css_path.exists():
    missing_files.append("explorer/style.css")

if not js_path.exists():
    missing_files.append("explorer/game.js")

if missing_files:
    st.error("다음 파일을 찾을 수 없습니다.")

    for file_name in missing_files:
        st.write(f"- {file_name}")

else:
    # HTML, CSS, JavaScript 읽기
    html_content = html_path.read_text(encoding="utf-8")
    css_content = css_path.read_text(encoding="utf-8")
    js_content = js_path.read_text(encoding="utf-8")

    # CSS 파일을 HTML 안에 직접 삽입
    html_content = html_content.replace(
        '<link rel="stylesheet" href="./style.css">',
        "<style>\n" + css_content + "\n</style>"
    )

    # JavaScript 파일을 HTML 안에 직접 삽입
    html_content = html_content.replace(
        '<script type="module" src="./game.js"></script>',
        '<script type="module">\n'
        + js_content
        + '\n</script>'
    )

    # HTML 안에 외부 파일 경로가 남아 있는지 확인
    if (
        '<link rel="stylesheet" href="./style.css">' in html_content
        or '<script type="module" src="./game.js"></script>' in html_content
    ):
        st.error(
            "HTML에서 CSS 또는 JavaScript 파일을 연결하는 부분을 "
            "찾지 못했습니다. index.html의 파일 경로를 확인해 주세요."
        )
    else:
        # Streamlit 화면 안에 3D 탐험 화면 표시
        components.html(
            html_content,
            height=780,
            scrolling=False
        )

st.markdown("---")

st.caption(
    "교육용 3D 생태 탐험입니다. "
    "화면의 생물 모형은 생태계를 이해하기 위한 시각 자료입니다."
)
