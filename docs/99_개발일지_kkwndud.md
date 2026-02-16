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

## 2026-02-16

### 장비 등급별 패시브 능력 + 무기 종류(검/지팡이/활)
- WeaponSubType enum(SWORD/STAFF/BOW) 추가, AOE_DAMAGE EffectType 추가
- EquipmentPassiveTable 데이터 테이블 생성: 무기(검=ATK_UP, 지팡이=AOE_DAMAGE, 활=RAGE_BOOST) + 비무기 6종(방어구=SHIELD, 반지=CRIT_UP, 목걸이=ATK_UP, 신발=REGEN, 장갑=MULTI_HIT, 모자=DEF_UP) × 6등급
- Equipment 엔티티에 weaponSubType 프로퍼티 + getPassive() 메서드 추가
- TreasureChest: 무기 생성 시 랜덤 subType 배정, 장비 이름에 종류 반영
- Forge: 같은 weaponSubType만 합성 가능, 결과에 subType 상속
- SaveSerializer: weaponSubType 직렬화 + 기존 무기 id hash 기반 결정적 마이그레이션
- BattleManager: getEquipmentPassiveSkills(player) 메서드 추가, 장비 패시브를 Skill 객체로 변환
- Battle.ts: AOE_DAMAGE 처리 (주 타겟 외 나머지 적에게 ATK% 범위 피해)
- ChapterScreen 4곳 + ContentScreen 2곳: BattleUnit 생성 시 장비 패시브 스킬 포함
- EquipmentIcon: 무기 아이콘을 weaponSubType 기반으로 변경 (검/지팡이/활 형태)
- EquipmentScreen: 슬롯탭 장비 클릭 → 패시브 능력 표시, 합성탭 장비 클릭 → 합성 정보 표시
- DebugPanel: 디버그 장비 생성 시 무기에 랜덤 subType 배정
- EquipmentDataTable: WEAPON_SUB_TYPE_LABELS(검/지팡이/활) 추가

### 합성 시스템 간소화 + 합성 UI 아이콘화
- upgradeCount(승급 시스템) 완전 제거: Equipment 엔티티, Forge, SaveSerializer, EquipmentScreen, 테스트
- 에픽/전설 합성 수량 2개 → 3개로 통일 (모든 등급 3개 합성)
- 합성 탭 아이콘 다이어그램: 보유 장비=실선 테두리 불투명, 부족=점선 테두리 반투명
- 합성 결과/패시브 변화 미리보기 유지

### 장비 강화 레벨 슬롯 귀속
- 강화 레벨이 장비가 아닌 **슬롯에 귀속**되도록 변경
- EquipmentSlot에 `slotLevels[]`, `slotPromoteCounts[]` 배열 추가
- `equip()`: 새 장비에 슬롯 레벨 적용, 교체된 장비는 현재 레벨 유지한 채 보관함으로
- `unequip()`: 해제된 장비 현재 레벨 유지한 채 보관함으로, 슬롯 레벨 유지
- `syncLevel()`: 강화 후 슬롯 레벨 동기화
- `initFromEquipped()`: 기존 세이브 호환 (slotLevels 없으면 장착 장비에서 추출)
- SaveSerializer: slotLevels/slotPromoteCounts 직렬화/역직렬화 + 하위호환
- EquipmentScreen: 강화 성공 후 `slot.syncLevel(index)` 호출

### 지팡이 패시브 MAGIC_BOOST로 변경
- 지팡이 패시브를 AOE_DAMAGE → MAGIC_BOOST(마법 스킬 계수 증가)로 변경
- EffectType.MAGIC_BOOST enum 추가
- PassiveSkill StatModifierEffect에 'MAGIC_COEFFICIENT' stat 타입 추가
- BattleUnit.applyPassiveSkill에서 MAGIC_COEFFICIENT 처리 (base 0.5에 가산)
- BattleManager.passiveToPassiveSkill에 MAGIC_BOOST 변환 추가

### 7일 출석체크 이벤트 시스템 (K-4)
- AttendanceDataTable: 7일 보상 데이터 테이블 (보석/에픽펫/장비뽑기/골드/장비석/펫알+사료/보석200)
- AttendanceSystem: 출석 상태 관리 (checkedDays, cycleStartDate, lastCheckDate, canCheckIn, resetCycle)
- GameManager: claimAttendance() 메서드 (RESOURCE/PET/EQUIPMENT_GACHA 보상 분기 처리), checkDailyReset에 사이클 리셋 연동
- SaveSerializer: attendance 상태 직렬화/역직렬화 + 기존 세이브 하위호환
- EventScreen: 출석체크 탭 UI (4열 그리드, 수령됨/수령가능/잠금 상태, 보상 결과 표시)
- NavBar: CalendarDays 아이콘으로 이벤트 탭 추가
- App.tsx: event 라우트 추가

### 디버그 패널 출석 Day+1
- DebugPanel에 "출석 Day+1" 버튼 추가 (lastCheckDate 초기화로 canCheckIn 활성화)
- 7일 완료 시 자동 resetCycle() 호출

### 펫 형상(PetIcon SVG) + 특수능력
- PetIcon SVG 컴포넌트: 18종 펫별 고유 형태, 티어별 색상 (S=금, A=보라, B=초록)
- PetTable에 ability 필드 추가: 펫별 고유 전투 패시브 (방어막/흡혈/공격력/방어력/연타/재생/반격/부활/치명타)
- 등급별 능력 스케일: COMMON=1x → IMMORTAL=5x (gradeScale 가산)
- BattleManager.getPetAbilitySkill(): 활성 펫 능력을 PassiveSkill로 변환
- ChapterScreen 4곳 + ContentScreen 2곳 + BattleManager.createPlayerUnit: 펫 능력 전투 적용
- PetScreen: PetIcon + 특수능력 설명 표시, 출전 중 상태 표시
