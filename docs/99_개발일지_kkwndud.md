# 카피바라고! 개발일지 — kkwndud

---

## 2026-02-15

### 전투 배속 기능 (1x / 2x)
- ChapterScreen에 `battleSpeed` state + ref 추가, delay/PHASE_DURATION을 배속으로 나눠 적용
- BattleArena에 `speedMultiplier` prop 추가, `--battle-speed` CSS 변수로 애니메이션 속도 제어, 데미지 팝업 타이머 조정
- AdventureStage에 `speedMultiplier` prop 전달 인터페이스 추가
- index.css: `.ba-character`, `.ba-hit`, `.ba-hp-fill`, `.ba-damage-popup`, `.ba-rage-fill`, `.ba-shield-fill` transition/animation에 `calc(... / var(--battle-speed, 1))` 적용
- 전투 중 딜 그래프 버튼 왼쪽에 배속 토글 버튼 배치

### 장비 화면 RPG식 탭 구조 변경
- 기존 "장착/보관함/합성" 3탭 → "무기/방어구/반지/장신구/합성" 5탭으로 변경
- 각 슬롯 탭에서 장착 중 아이템 + 보관함 아이템을 한 화면에서 확인/장착/해제 가능
- 보관함 아이템은 등급 높은 순 → S등급 우선 → 레벨 높은 순 정렬
- 장착 슬롯에 빨간 테두리 강조 추가

### 장비 슬롯 7종 확장 + 장비 아이콘 SVG
- 기존 4종(무기/방어구/반지/장신구) → 7종(무기/방어구/반지/목걸이/신발/장갑/모자)으로 확장
- ACCESSORY(장신구) → NECKLACE(목걸이)로 마이그레이션 (SaveSerializer에 변환 로직 추가)
- 새 슬롯별 스탯: 목걸이(ATK+HP 혼합), 신발(HP), 장갑(ATK), 모자(HP)
- 반지만 2개 장착, 나머지 전부 1개
- EquipmentIcon SVG 컴포넌트 생성: 슬롯+등급별 색상/형태 차별화
- 무기 아이콘: 등급에 따라 검(일반~우수) → 지팡이(희귀~에픽) → 활(전설~신화) 형태 변화
- 장비 화면/뽑기 화면에 아이콘 적용, 뽑기 결과에 슬롯 한글 라벨 표시
