import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(
    page_title="국가별 생물다양성",
    page_icon="🌿",
    layout="wide"
)
st.title("🌍 국가별 생물다양성 탐험")
st.write("국가별 서식 생물과 환경 조건에 따른 변화를 살펴보세요.")

# 국가별 생물 예시 데이터
# 실제 전체 생물종 목록이 아닌 기능 확인용 자료
data = [
    {"국가": "대한민국", "생물": "반달가슴곰", "분류": "동물"},
    {"국가": "대한민국", "생물": "수달", "분류": "동물"},
    {"국가": "대한민국", "생물": "소나무", "분류": "식물"},
    {"국가": "대한민국", "생물": "장수풍뎅이", "분류": "곤충"},
    {"국가": "브라질", "생물": "재규어", "분류": "동물"},
    {"국가": "브라질", "생물": "나무늘보", "분류": "동물"},
    {"국가": "브라질", "생물": "브로멜리아", "분류": "식물"},
    {"국가": "브라질", "생물": "잎꾼개미", "분류": "곤충"},
    {"국가": "호주", "생물": "코알라", "분류": "동물"},
    {"국가": "호주", "생물": "캥거루", "분류": "동물"},
    {"국가": "호주", "생물": "유칼립투스", "분류": "식물"},
    {"국가": "호주", "생물": "비단벌레", "분류": "곤충"},
    {"국가": "케냐", "생물": "사자", "분류": "동물"},
    {"국가": "케냐", "생물": "기린", "분류": "동물"},
    {"국가": "케냐", "생물": "아카시아", "분류": "식물"},
    {"국가": "케냐", "생물": "쇠똥구리", "분류": "곤충"},
    {"국가": "캐나다", "생물": "무스", "분류": "동물"},
    {"국가": "캐나다", "생물": "비버", "분류": "동물"},
    {"국가": "캐나다", "생물": "단풍나무", "분류": "식물"},
    {"국가": "캐나다", "생물": "나비", "분류": "곤충"},
]

df = pd.DataFrame(data)

st.subheader("🌱 1. 탐험할 국가 선택")

countries = sorted(df["국가"].unique())

selected_country = st.selectbox(
    "어느 나라의 생물을 살펴볼까요?",
    countries
)

country_df = df[df["국가"] == selected_country]

st.subheader(f"📍 {selected_country}의 생물")

col1, col2 = st.columns(2)

with col1:
    st.metric("예시 생물 수", len(country_df))

with col2:
    st.metric("생물 분류 수", country_df["분류"].nunique())

st.dataframe(
    country_df[["생물", "분류"]],
    use_container_width=True,
    hide_index=True
)

# 국가별 분류 구성 그래프
st.subheader("📊 2. 국가의 생물 분류")

type_counts = (
    country_df["분류"]
    .value_counts()
    .rename_axis("분류")
    .reset_index(name="생물 수")
)

fig = px.bar(
    type_counts,
    x="분류",
    y="생물 수",
    color="분류",
    title=f"{selected_country}의 분류별 예시 생물 수",
    color_discrete_sequence=["#39834A", "#83B86B", "#C4A66A"]
)

st.plotly_chart(fig, use_container_width=True)

# 여러 국가 비교
st.subheader("🌏 3. 국가끼리 생물다양성 비교")

selected_countries = st.multiselect(
    "비교할 국가를 선택하세요.",
    countries,
    default=countries[:2]
)

if selected_countries:
    compare_df = df[df["국가"].isin(selected_countries)]

    compare_counts = (
        compare_df.groupby(["국가", "분류"])
        .size()
        .reset_index(name="생물 수")
    )

    compare_fig = px.bar(
        compare_counts,
        x="국가",
        y="생물 수",
        color="분류",
        barmode="group",
        title="선택한 국가의 분류별 예시 생물 수",
        color_discrete_sequence=["#39834A", "#83B86B", "#C4A66A"]
    )

    st.plotly_chart(compare_fig, use_container_width=True)

# 환경 시뮬레이션
st.subheader("🌦️ 4. 국가별 환경 시뮬레이션")
st.write(
    "아래 조건을 바꾸면서 선택한 국가의 환경을 가상으로 설정해 보세요."
)

temperature = st.slider("기온 (℃)", -10, 45, 20)
rainfall = st.slider("강수량 (mm/월)", 0, 500, 100)
vegetation = st.slider("식생량 (%)", 0, 100, 60)

st.markdown("### 현재 설정")

st.write(f"- 탐험 국가: {selected_country}")
st.write(f"- 설정 기온: {temperature}℃")
st.write(f"- 설정 강수량: 월 {rainfall}mm")
st.write(f"- 설정 식생량: {vegetation}%")

if temperature < 5:
    st.info("추운 환경입니다. 추위에 적응한 생물의 서식 조건을 살펴보세요.")
elif temperature > 30:
    st.info("더운 환경입니다. 고온에 적응한 생물의 서식 조건을 살펴보세요.")
else:
    st.info("중간 정도의 기온입니다. 습도와 식생 조건도 함께 살펴보세요.")

if rainfall < 50:
    st.write("💧 강수량이 적은 환경")
elif rainfall > 250:
    st.write("🌧️ 강수량이 많은 환경")
else:
    st.write("🌦️ 중간 정도의 강수량")

if vegetation < 30:
    st.write("🌱 식생이 적은 환경")
else:
    st.write("🌳 식물이 비교적 풍부한 환경")

st.caption(
    "주의: 현재 데이터는 페이지 기능을 구현하기 위한 예시입니다. "
    "국가별 실제 전체 서식종 수나 실제 생태계 예측을 나타내지 않습니다."
)
