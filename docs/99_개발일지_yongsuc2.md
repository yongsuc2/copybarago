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

- **다단 히트 → 확률 기반 추가 타격으로 변경**
  - 기존: Multi-Hit Mastery가 고정 3회 타격
  - 변경: 공격 시 50% 확률로 1회 추가 타격 (총 2회)
  - BattleUnit: multiHitCount → multiHitChance (확률값)
  - Battle.processAttack(): 고정 루프 → 기본 1회 + 확률 추가 1회
  - animateTurn(): 히트별 개별 접근→타격→후퇴 연출 (groupByHit)
  - ON_ATTACK 스킬은 추가 타격에서도 동일 발동

- **쪽박/중박/대박 카운터 기반 룰렛 시스템 구현**
  - 원작 카피바라고의 카운터 기반 룰렛 시스템 반영
  - ANGEL=중박(12회→중박 룰렛), DEMON=대박(7회→대박 룰렛), CHANCE=쪽박
  - ROULETTE/LUCKY_MACHINE/MERCHANT 인카운터 타입 제거
  - JUNGBAK_ROULETTE/DAEBAK_ROULETTE 신규 타입 추가
  - Chapter에 jungbakCount/daebakCount 카운터 추가
  - advanceDay()에서 카운터 임계값 체크 후 룰렛 자동 발동
  - resolveEncounter()에서 ANGEL/DEMON 해결 시 카운터 증가
  - 인카운터 가중치 재배분: COMBAT(40%), ANGEL(25%), DEMON(15%), CHANCE(20%)
  - ChapterScreen에 중박/대박 카운터 진행도 표시 UI 추가

- **전투 딜 그래프 구현**
  - 전투 중 토글 버튼(📊)으로 딜 그래프 표시/숨김
  - 데미지 소스별 누적 집계: 일반 공격, 스킬별(광창/수리검 등), 반격, 독 피해
  - 내림차순 정렬, 막대그래프 + 수치 + 비율(%) 표시
  - DamageGraph 컴포넌트 신규 생성

- **흡혈 스킬 정의 명시**
  - 일반 공격 피해에만 적용 (15%), 스킬 데미지 미적용
  - 기획서(01_전투시스템.md, 04_스킬시스템.md) 업데이트

- **분노(Rage) 게이지 시스템 구현**
  - 원작 카피바라고의 분노 시스템 반영
  - BattleUnit: rage/maxRage/ragePerAttack/bonusRagePerAttack/rageDamageMultiplier 필드 추가
  - Battle: processAttack 끝에 분노 충전, processRageAttack(ATK×2.0×multiplier), processOnRageSkills
  - EffectType: RAGE_POWER/RAGE_BOOST, TriggerCondition: ON_RAGE, BattleLogType: RAGE_ATTACK 추가
  - rage_mastery 변경: ATK_UP 버프 → RAGE_POWER (분노 공격 데미지 +100%)
  - complete_rage_mastery 추가: RAGE_BOOST (게이지 2배속 충전)
  - 분노 공격 스킬 3종 추가: rage_lightning(⚡30), rage_lance(🔱35), rage_flame_wave(🔥25)
  - BattleArena: 플레이어 HP 바 아래 분노 게이지 바 (주황→빨강 그라데이션)
  - ChapterScreen: RAGE_ATTACK 딜 그래프/애니메이션 처리
  - SYNERGY_MAP 업데이트 (SKULL/KNIGHT/GHOST에 분노 스킬 추가)

- **엘리트/중간보스 강제 전투 구간 구현**
  - 원작 카피바라고의 특정 일차 강제 전투 구간 반영
  - 20일차: 엘리트 전투 (CHAPTER_ELITE_POOL), 30일차: 중간보스 전투 (CHAPTER_BOSS_POOL)
  - 승리 시 금상자: 신화 스킬 3개 중 1개 선택
  - Chapter: isEliteDay()/isMidBossDay() 판정, createEliteBattle/createMidBossBattle 생성
  - EncounterDataTable: forcedBattleDays = { elite: 20, midBoss: 30 }
  - BattleArena: battleLabel prop (엘리트/보스/최종 보스 배지)
  - ChapterScreen: battleType 상태, startEliteBattle/startMidBossBattle, 금상자 UI
  - 패배 시 챕터 실패 (기존 패배 로직 동일)

- **몬스터 분노/스킬/2마리 전투 시스템 구현**
  - 몬스터 분노: ragePerAttack 필드를 EnemyTemplate에 추가, Alpha Wolf(20), Demon Lord(15)에 적용
  - 몬스터 스킬 확장: Orc(연타), Dark Knight(반격+방어막), Stone Golem(반격+방어막), Alpha Wolf(연타+반격)
  - 방어막(Shield) 시스템: EffectType.SHIELD 추가, BattleUnit.takeDamage()에 쉴드 우선 흡수, iron_shield 스킬 추가
  - 복수 적 전투(1vs2): Battle 클래스 enemies 배열화, 50% 확률로 2마리 등장 (각 0.7배 스탯, 서로 다른 종류)
  - 순차 공격 타겟팅: 앞 적부터 처치, 죽으면 다음 적 자동 타겟
  - BattleArena: 복수 적 렌더링, 방어막 바, 적 분노 게이지, 사망 적 반투명 처리
  - ChapterScreen: 복수 적 HP 추적 (RunningHps), 적별 애니메이션 (activeEnemyIndex)

---

## 2026-02-16 (Day 5 - 오전)

### 완료 작업
- **스킬 티어/업그레이드 시스템 구현**
  - 모든 스킬 패밀리에 4단계 티어 도입 (tier 1=일반 → tier 2=전설 → tier 3=신화 → tier 4=불멸)
  - Skill 엔티티: `grade` 파라미터를 `tier: number`로 교체, `grade`는 getter로 파생
  - SkillDataTable: 26개 패밀리 × 4티어 밸런스 수치 정의, getSkillDescription(id, tier) 시그니처 변경
  - SkillTable: 패밀리 정의 배열 + tier 루프로 104개 Skill 인스턴스 생성, getNextTierSkill/getTier1Skills/isSpecialSkill 메서드 추가
  - EncounterGenerator: 스킬 풀을 "새 스킬(tier 1) + 업그레이드(현재 tier+1)" 혼합으로 재구성
  - 천사 인카운터: tier 1~2만 제공, 악마/중박 룰렛: 전체, 대박 룰렛/금상자: tier 3(신화급)
  - Chapter.resolveEncounter: 동일 패밀리 보유 시 교체(업그레이드), 미보유 시 추가
  - ChapterScreen 금상자: tier 3 풀 생성 시 보유 스킬 tier 확인, 교체/추가 분기
  - angel_power/demon_power: 예외 — 단일 티어 4(불멸), 대박 룰렛에서만 획득
  - 스킬 이름 티어 접미사: tier 2+=`II`, `III`, `IV`

---

## 2026-02-16 (Day 5 - 오후)

### 완료 작업
- **스킬 시스템 전면 재설계 구현** (Y-9)
  - 기존 단일 Skill/SkillTable/SkillDataTable → 완전히 새로운 아키텍처
  - **계층 구조**: BUILTIN/UPPER/LOWER/LOWEST 4단계, 역방향 연쇄 금지
  - **CompoundTrigger**: 3개 AND 조건 (When + Probability + Special)
  - **공격 타입**: PHYSICAL/MAGIC/FIXED 분리, 각각 다른 DEF 감소율
  - **스킬 효과**: ATTACK/TRIGGER_SKILL/INJECT_EFFECT/HEAL_HP/ADD_RAGE/CONSUME_RAGE/DEBUFF 7종
  - **INJECT_EFFECT**: 장착 시점에 타겟 스킬의 resolvedEffects에 효과 주입
  - **패시브 분리**: PassiveSkill + PassiveEffect union type (8종 PassiveType)
  - **SkillExecutionEngine**: 재귀적 스킬 체인 실행, MAX_SKILL_CHAIN_DEPTH=3
  - **SkillValidator**: 계층 검증 규칙 5종
  - **데이터**: ActiveSkillTierData(14 패밀리 × 4티어) + PassiveSkillTierData(17 패밀리 × 4티어)
  - **레지스트리**: ActiveSkillRegistry(27 패밀리) + PassiveSkillRegistry(17 패밀리)
  - 전투 시스템(BattleUnit, Battle) 전면 리팩터
  - 연관 파일 전체 동시 수정 (Chapter, Encounter, EncounterGenerator, EnemyTemplate, BattleManager, Arena, ContentScreen, ChapterScreen)
  - 기존 테스트 전면 업데이트 + 신규 테스트 2개 파일 추가

---

## 2026-02-16 (Day 5 - 밸런스 + 비주얼)

### 완료 작업
- **패시브 스킬 밸런스 조정**
  - 천사의 힘: ATK +100% → +30%
  - 중복 패시브 병합: ATK%(atk_proficiency만 유지), DEF%(def_proficiency만 유지), CRIT(crit_mastery만 유지)
  - 반격 메카닉 변경: 피해 반사 → 확률 기반 일반 공격 발동 (triggerChance 0.1~0.5)
  - 연타 확률 하향: 0.1~0.35
  - 기본 크리티컬 확률 5% → 0%

- **인카운터 밸런스 조정**
  - 천사: 체력 회복 제거, 스킬 3개 중 1개 선택으로 변경
  - 악마 확률 15% → 10%, 우연 확률 20% → 25%
  - 우연: 상자 → 스킬 3개 선택, 축복 → 챕터 기반 랜덤 골드
  - 치유의 샘: 50% → 15%

- **전투/경제 밸런스 조정**
  - 전투 골드: 일수(perDay) 계수 추가, perChapter 5→2
  - 챕터 클리어 보상: 데이터 테이블 분리, 챕터별 차등 골드+보석
  - 일수 기반 몬스터 스케일링: 챕터 내 진행에 따라 최대 +80%
  - 재능 스탯: HP 20→15, ATK 5→3, DEF 3→2

- **스킬 비주얼 이펙트 구현**
  - 스킬 투사체: skillIcon이 대상에게 날아가는 애니메이션 (캐릭터 이동 대신)
  - 크리티컬 강화: 24px + CRIT! 라벨 + text-shadow 글로우 + scale 애니메이션
  - 데미지 팝업에 스킬 아이콘 표시

- **상태 효과 아이콘 + DoT 중첩 규칙 구현** (Y-12)
  - 캐릭터 HP바/분노바 아래 상태 효과 아이콘 표시 (버프=녹색, 디버프=빨간 테두리)
  - 남은 턴 수 뱃지, DoT 중첩 수(×N) 표시
  - DoT 중첩 규칙: 같은 스킬(sourceSkillId) → 상위 등급 덮어쓰기, 다른 스킬 → 공존
  - StatusEffect에 sourceSkillId 추가, BattleUnit.addStatusEffect() 분기 로직

- **뽑기 시스템 통합** (Y-13)
  - 브론즈/실버/골드 3종 → 단일 장비 상자로 통합
  - 합성 비율(3:1) 기반 확률 분배: 일반 66.76%, 우수 22.25%, 희귀 7.42%, 에픽 2.47%, 전설 0.82%, 신화 0.27%
  - 비용 150보석, 10연차 1,350보석, 천장 180회 → 신화 확정
  - S-등급 대상 에픽 이상으로 확장
  - 엘리트/보스 몬스터 강화, 보물상자 보상 50% 하향

---

## 2026-02-17 (Day 6)

### 완료 작업
- **데이터 테이블 JSON 분리** (Y-14)
  - 15개 데이터 테이블의 순수 데이터를 JSON 파일로 분리
  - TypeScript 래퍼 파일이 JSON을 import하여 타입 안전성 + 헬퍼 함수 유지
  - 소비자(consumer) 코드 변경 없이 동일 export API 유지
  - JSON 파일은 Excel/VS Code에서 직관적으로 편집 가능
  - 변환 대상: BattleDataTable, EncounterDataTable, ActiveSkillTierData, PassiveSkillTierData, SkillDataTable, EnemyTable, EquipmentDataTable, EquipmentTable, EquipmentPassiveTable, PetTable, ResourceDataTable, AttendanceDataTable, TalentTable, HeritageTable, ChapterTreasureTable
  - 변환하지 않은 파일 (로직 중심): ActiveSkillRegistry, PassiveSkillRegistry, SkillTable
  - tsconfig.app.json에 resolveJsonModule 추가

---

## 2026-02-17 (Day 6 - 오후)

### 완료 작업
- **챕터 획득 골드 UI** — 챕터 헤더 카드에 sessionGold 표시 (Coins 아이콘 + 골드색)
- **상태효과 틱 애니메이션 분리** — DOT_DAMAGE/HOT_HEAL을 적 공격 애니메이션에서 분리, 턴 끝에 캐릭터 이동 없이 데미지 팝업만 표시
- **전투 연출 순서도 기획서** — 01_전투시스템.md에 페이즈 타이밍, 턴 연출 흐름, 히트 그룹 분할, HP 중간 갱신 문서화
- **DoT 메카닉 기획서** — 04_스킬시스템.md에 즉발 피해 vs 지속 피해 구분, DoT 틱 타이밍 문서화
- **엘리트/보스 dayProgress 스케일링** — 일반 몬스터만 적용되던 일수 보너스를 엘리트/보스에도 적용
- **엘리트/보스 챕터별 고정 배치** (Y-15) — 랜덤 풀 → chapterBossAssignment JSON 테이블 기반 고정 배치 (3패턴 순환)

---

## 2026-02-18 (Day 7)

### 완료 작업
- **분노 즉시 발동** — 일반 공격으로 분노 게이지가 차면 같은 턴에 즉시 분노 공격 발동 (다음 턴 대기 제거)
- **PROFICIENCY 스킬 카테고리 삭제** (Y-16)
  - SkillCategory.PROFICIENCY enum 값 제거
  - hp/atk/def/crit_proficiency 4개 스킬 정의, 16개 티어 데이터, 설명 빌더 전체 삭제
  - PassiveSkillRegistry에서 atk/def_proficiency 2개 항목 삭제
  - PassiveSkillId 타입에서 제거
  - 테스트 코드 동기화
- **스킬 밸런스 하향 조정**
  - lifesteal tier 1: 0.15→0.08 (비례 하향)
  - multi_hit_mastery tier 1: 0.25→0.1 (비례 하향)
  - crit_mastery tier 1: 0.15→0.07 (비례 하향)
  - shrink_magic tier 1 reduction: 0.2→0.1 (비례 하향)
  - 각 스킬 tier 2~4도 동일 비율로 하향
- **회복 시스템 최대체력 비례(%) 전환**
  - REGEN (StatusEffect): 고정값→ `Math.floor(maxHp * value)` 비례 회복
  - HEAL_HP (SkillExecutionEngine): 고정값→ `Math.floor(maxHp * amount)` 비례 회복
  - skill-tier.data.json regen: 10/18/28/42 → 0.02/0.035/0.05/0.07
  - passive-skill-tier.data.json regen: 동일 변환
  - active-skill-tier.data.json hp_recovery: 동일 변환
  - equipment-passive.data.json 신발 REGEN: 3~60 → 0.005~0.05
  - pet.data.json REGEN 펫 3종: 고정값→비율값 변환

- **죽은 코드 삭제** — SkillTable.ts, SkillDataTable.ts, skill-tier.data.json (미사용 파일 제거)
- **밸런스 실제 데이터 반영** — 이전 밸런스 변경이 죽은 코드에만 적용된 문제 수정, passive-skill-tier/active-skill-tier에 재적용
- **속성 마스터리 패시브 3종 추가** (SKILL_MODIFIER 구현)
  - 번개 마스터리, 수리검 마스터리, 광창 마스터리 — 태그 기반 데미지 증가 (+8%~25%)
  - BattleUnit에 skillTagBonuses 저장, SkillExecutionEngine ATTACK 케이스에서 태그 배율 적용
- **크리티컬 물리 전용** — 마법/고정 공격에서 크리티컬 제거, 물리만 적용
- **데미지 분산 제거** — variance(0.9~1.1) 랜덤 배율 삭제
- **폭군의 일격 밸런스 하향** — coefficient 0.3→0.11 (비례 하향)
- **연타 밸런스 하향** — chance 0.1→0.07 (비례 하향)
- **연타 일반 공격 전용 + UPPER 스킬 연계** — 연타 발동을 일반 공격에서만 적용, 연타 시 UPPER 스킬(번개/검기/광창 등)도 재발동, 연타 재발동은 차단
- **기획 문서 수치 제거** — 하드코딩된 밸런스 수치(50%, 80%, 20%) 제거, 개념만 남김
- **뇌우 스킬 삭제** — 번개 강타와 컨셉 중복, 코드/데이터/문서 완전 삭제
- **소환 횟수 스킬 정체 구간 제거** — 번개/광창/검기 강타, 분노 번개/광창/화염파 모두 T1~T4 = 1/2/3/4회로 변경
- **몬스터 스케일링 곡선 개선** — scalingPerChapter 1.12→1.25, dayProgressMaxBonus 0.8→0.3 (챕터 N+1 1일 ≈ 챕터 N 50일)
- **몬스터 컨셉 리밸런스** — 일반 몬스터 총 전투력 균등화 (체력형/균형형/공격형/돌격형/방어형)
- **골드 보상 UI 버그 수정** — 인카운터 골드 보상이 sessionGold에 미반영되던 문제 수정

---

## 2026-02-21 (Day 10)

### 완료 작업
- **스킬 연출 순서 그룹화** (Y-19)
  - reorderBySkillType() 함수 추가: 같은 skillName끼리 묶어서 연속 연출
  - ATTACK/RAGE_ATTACK 경계 기준 배치 분리 (연타 배치는 별도 유지)
  - 투사체 이펙트: CRIT 타입도 감지하도록 확장, approach 시점에 damageEntries 선설정

- **로비 상세 스탯 팝업** (Y-20)
  - Player.getStatsBreakdown(): 기본 스탯을 출처별(기본/재능/장비/유산/펫) 분해 반환
  - Player.getCombatPassives(): 장비 패시브 기반 전투 스탯(방어막/연타/재생/버프/마법강화/분노충전) + 고정 전투 스탯(치명타 데미지/흡혈/회피/반격) 반환
  - MainScreen에 [상세] 버튼 + modal-overlay 팝업 UI
  - 기본 스탯 섹션: 총합 + 0이 아닌 출처만 하위 표시
  - 전투 스탯 섹션: 0이어도 전부 표시 (향후 확장 대비)
  - 장비 패시브 섹션: 장착 장비 패시브 합산값 표시

---

## 2026-02-21 (Day 10 - 오후)

### 완료 작업
- **체력 강화 패시브 (hp_fortify)** — T1~T4 최대 체력 5%~15% 증가, 세션 레벨+전투 레벨 이중 적용 방지
- **마법 마스터리 패시브 (magic_mastery)** — T1~T4 마법 계수 +0.1~0.35
- **검기 AoE 공격** — sword_aura_summon에 isAoe 플래그 추가, 모든 생존 적에게 피해
- **방어 공식 변경** — 고정 차감 → 퍼센트 감소 `ATK × (k / (k + DEF))` (k=100 물리, k=150 마법)
- **세션 maxHp 연동** — baseSessionMaxHp/recalcSessionMaxHp/getBattlePassiveSkills 도입, HP 비율 보존
- **연속 스킬 연출 속도 조정** — CONSECUTIVE_SKILL_BOOST 1.7→1.45
- **전투 시작 함수 통합** — startEliteBattle/startMidBossBattle/startBossBattle → startSpecialBattle(type)
- **테스트 코드 추가** — BattleUnit(hp_fortify/magic_mastery/STAT_MODIFIER 순서/방어막), Chapter(세션HP/비율보존/getBattlePassiveSkills), SkillExecutionEngine(AoE/방어공식)
- **스킬 특징(traits) 필드 추가** (Y-22) — ActiveSkillFamilyDef·PassiveSkillFamilyDef에 traits: string[] 필드 추가, 기획/개발 참고용(UI 미표시), 04_스킬시스템.md에 스킬 특징 테이블 문서화
