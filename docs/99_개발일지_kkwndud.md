# 카피바라고! 개발일지 — kkwndud

---

## 2026-02-15

### 전투 배속 기능 (1x / 2x)
- ChapterScreen에 `battleSpeed` state + ref 추가, delay/PHASE_DURATION을 배속으로 나눠 적용
- BattleArena에 `speedMultiplier` prop 추가, `--battle-speed` CSS 변수로 애니메이션 속도 제어, 데미지 팝업 타이머 조정
- AdventureStage에 `speedMultiplier` prop 전달 인터페이스 추가
- index.css: `.ba-character`, `.ba-hit`, `.ba-hp-fill`, `.ba-damage-popup`, `.ba-rage-fill`, `.ba-shield-fill` transition/animation에 `calc(... / var(--battle-speed, 1))` 적용
- 전투 중 딜 그래프 버튼 왼쪽에 배속 토글 버튼 배치
