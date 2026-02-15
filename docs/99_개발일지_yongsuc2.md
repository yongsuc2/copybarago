# 카피바라고! 개발일지 — yongsuc2

---

## 2026-02-12 (Day 1)

### 완료 작업
- 역기획서 12개 문서 작성 (00~11)
  - 게임개요, 전투, 캐릭터성장, 장비, 스킬, 스테이지/던전, 가챠, 재화, PvP, 펫, 이벤트, 과금
- OOP 설계 문서 작성 (90_OOP설계문서.md)
  - 4레이어 아키텍처, 도메인 모델, 서비스 레이어, 이벤트 버스, 데이터 테이블
- 프로그래밍 작업 목록 작성 (91_작업목록.md)
  - 8개 Phase, 총 125개 작업 정의

### 결정 사항
- 1차 구현: 웹 브라우저 프로토타입
- 2차 구현: Unity 이식
- OOP 설계를 기술 스택 독립적으로 작성하여 이식 용이하게 함
- AI Agent(Claude Code)가 문서를 보고 구현하는 방식으로 개발 진행

---

## 2026-02-12 (Day 1 - 오후)

### 완료 작업
- **Phase 0: 프로젝트 셋업** (작업 0-1 ~ 0-5)
- **Phase 1A: 열거형 + 값 객체** (작업 1A-1 ~ 1A-4)
- **Phase 1B: 핵심 엔티티** (작업 1B-1 ~ 1B-10)
- **Phase 2A: 전투 시스템** (작업 2A-1 ~ 2A-11)
- **Phase 2B: 챕터 시스템** (작업 2B-1 ~ 2B-12)
- **Phase 2C: 적 데이터** (작업 2C-1 ~ 2C-3)
- **Phase 3: 성장 시스템 서비스** (Forge, EquipmentManager, PetManager)
- **Phase 4: 콘텐츠 시스템** (Tower, CatacombDungeon, DailyDungeon, Arena, Travel, GoblinMiner)
- **Phase 5: 경제 시스템** (TreasureChest, Collection, DailyResetSystem)
- **Phase 6: 메타 시스템** (GameEvent, SaveManager, OfflineRewardCalculator, DailyRoutineScheduler, ResourceAllocator)
- **Phase 7: UI/프레젠테이션** (GameManager, GameContext, 모든 화면)
- **Phase 8: 빌드 검증** (tsc + vitest + vite build)

---

## 2026-02-13 (Day 2)

### 완료 작업
- **UI 아이콘 추가** (lucide-react)
- **전체 한글화**
- **전투 비주얼 UI 구현** (CharacterSprite, BattleArena, PlayerStatsBar, 공격 애니메이션)
- **모험 화면 기획서 작성**
- **7D-1: 인벤토리 시스템** (장비 보관함 탭)
- **7D-4: 퀘스트 화면** (일일/주간 퀘스트)

---

## 2026-02-14 (Day 3)

### 완료 작업
- **모험 시스템 기획서 분리** (docs/12_모험시스템.md)
- **챕터 보물상자 시스템 구현** (Phase 9)
- **챕터 결과 오버레이 추가**
- **작업 목록/개발일지 2인 분할 관리 구조 도입**
- **인카운터 UI 한글화** (선택지 라벨/설명 한글 변환, ENCOUNTER_TYPE_LABEL 매핑)
- **스킬 아이콘 추가** (24종 스킬에 이모지 아이콘 부여, Skill.icon 필드)
- **퀘스트 테스트 코드 확장** (21개 테스트: 미션 ID 일관성, 통합 테스트, 엣지 케이스)
- **AdventureStage 상시 스테이지 구현**
  - AdventureStage.tsx 신규: 전투/인카운터/대기 모드 통합
  - 인카운터 이모지 비주얼 매핑 (7종 + CHANCE 세분화)
  - CSS: adventure-stage, stage-encounter-visual, @keyframes shake 추가
  - ChapterScreen.tsx JSX 구조 재배치 (4분기 → 3분기 통합)
  - 모험화면_기획서.md 업데이트

### 생성된 파일
```
src/presentation/components/AdventureStage.tsx
```

### 수정된 파일
```
src/domain/entities/Skill.ts (icon 필드 추가)
src/domain/data/SkillTable.ts (24종 아이콘 할당)
src/domain/chapter/EncounterGenerator.ts (한글 라벨, 스킬 아이콘 포함)
src/presentation/screens/ChapterScreen.tsx (AdventureStage 통합, 구조 재배치)
src/index.css (adventure-stage 스타일, shake 키프레임)
src/__tests__/domain/Battle.test.ts (Skill icon 파라미터 추가)
src/__tests__/meta/GameEvent.test.ts (21개 테스트 확장)
docs/화면기획문서/모험화면_기획서.md (상시 스테이지 반영)
```

### 누적 현황
- 테스트: 19개 파일, 142개 테스트 전부 통과
- tsc 타입 체크 통과

---

## 2026-02-15 (Day 4)

### 완료 작업
- **데이터 테이블 분리 리팩토링**
  - 하드코딩된 게임 데이터를 중앙화된 데이터 테이블로 분리
  - EncounterDataTable: 인카운터 타입 라벨/설명, 출현 가중치, 수치/옵션 템플릿
  - EquipmentDataTable: 장비 등급/슬롯 라벨, 판매가
  - ResourceDataTable: 재화 라벨(전체/약어), 색상, 던전 라벨
  - Skill 엔티티 description 필드 추가 + SkillTable 24종 스킬 설명 부여
  - 소비자 파일 6개 업데이트 (EncounterGenerator, ChapterScreen, EquipmentScreen, DebugPanel, ChapterTreasureScreen, QuestScreen, ContentScreen)

### 생성된 파일
```
src/domain/data/EncounterDataTable.ts
src/domain/data/EquipmentDataTable.ts
src/domain/data/ResourceDataTable.ts
```

### 수정된 파일
```
src/domain/entities/Skill.ts (description 필드 추가)
src/domain/data/SkillTable.ts (24종 스킬 설명 추가)
src/domain/chapter/EncounterGenerator.ts (EncounterDataTable 참조)
src/presentation/screens/ChapterScreen.tsx (EncounterDataTable 참조)
src/presentation/screens/EquipmentScreen.tsx (EquipmentDataTable 참조)
src/presentation/screens/DebugPanel.tsx (EquipmentDataTable 참조)
src/presentation/screens/ChapterTreasureScreen.tsx (ResourceDataTable 참조)
src/presentation/screens/QuestScreen.tsx (ResourceDataTable 참조)
src/presentation/screens/ContentScreen.tsx (ResourceDataTable 참조)
docs/12_모험시스템.md (인카운터 데이터 파일 경로 추가)
```

- **다단 히트 → 확률 기반 추가 타격으로 변경**
  - 기존: Multi-Hit Mastery가 고정 3회 타격
  - 변경: 공격 시 50% 확률로 1회 추가 타격 (총 2회)
  - BattleUnit: multiHitCount → multiHitChance (확률값)
  - Battle.processAttack(): 고정 루프 → 기본 1회 + 확률 추가 1회
  - animateTurn(): 히트별 개별 접근→타격→후퇴 연출 (groupByHit)
  - ON_ATTACK 스킬은 추가 타격에서도 동일 발동

### 수정된 파일
```
src/domain/battle/BattleUnit.ts (multiHitCount → multiHitChance)
src/domain/battle/Battle.ts (processAttack → processSingleHit 분리)
src/domain/data/SkillTable.ts (Multi-Hit Mastery 값 3 → 0.5)
src/presentation/screens/ChapterScreen.tsx (groupByHit, animateHitGroup 추가)
src/__tests__/domain/Battle.test.ts (multiHitChance 테스트)
docs/01_전투시스템.md (연타 설명 변경)
docs/04_스킬시스템.md (연타 마스터리 효과 변경)
docs/02_캐릭터성장시스템.md (해골 계승 연타 설명 변경)
```

### 누적 현황
- 테스트: 19개 파일, 142개 테스트 전부 통과
- tsc 타입 체크 통과
