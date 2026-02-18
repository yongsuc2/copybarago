import rows from './json/skill-tier.data.json';

type NestedMap = Record<string, Record<number, Record<string, number>>>;

const NESTED: NestedMap = {};
for (const row of rows) {
  const { skill, tier, ...params } = row;
  if (!NESTED[skill]) NESTED[skill] = {};
  NESTED[skill][tier] = params as Record<string, number>;
}

export const SkillDataTable = NESTED;

const pct = (v: number) => `${v * 100}%`;

function tierData(id: string, tier: number): Record<string, number> | undefined {
  return NESTED[id]?.[tier];
}

export function getSkillDescription(id: string, tier: number = 1): string {
  const d = tierData(id, tier);
  if (!d) return '';

  const builders: Record<string, (v: Record<string, number>) => string> = {
    lightning: v => `공격 시 번개를 내려 ${v.damage}의 추가 피해`,
    lance: v => `턴 시작 시 창으로 ${v.damage}의 선제 피해`,
    shuriken: v => `공격 시 수리검으로 ${v.damage}의 추가 피해`,
    sword_aura: v => `공격 시 검기로 ${v.damage}의 추가 피해`,
    thunderstorm: v => `턴 시작 시 뇌우로 ${v.damage}의 피해`,
    tyrant: v => `공격 시 폭군의 일격으로 ${v.damage}의 추가 피해`,

    rage_lightning: v => `분노 공격 시 번개로 ${v.damage}의 추가 피해`,
    rage_lance: v => `분노 공격 시 광창으로 ${v.damage}의 추가 피해`,
    rage_flame_wave: v => `분노 공격 시 화염파로 ${v.damage}의 추가 피해`,

    poison_weapon: v => `공격 시 독을 부여하여 ${v.duration}턴간 매턴 ${v.damagePerTurn} 피해`,

    lifesteal: v => `가한 피해의 ${pct(v.rate)}만큼 체력 회복`,
    regen: v => `매 턴 최대체력의 ${pct(v.healPerTurn)} 회복`,
    counter: v => `피격 시 받은 피해의 ${pct(v.reflectRate)}를 반격`,
    iron_shield: v => `최대 체력의 ${pct(v.shieldRate)}만큼 방어막 생성`,
    multi_hit_mastery: v => `공격 시 ${pct(v.chance)} 확률로 추가 타격`,
    crit_mastery: v => `치명타 확률 ${pct(v.critBonus)} 증가`,
    rage_mastery: v => `분노 공격 데미지 ${pct(v.powerBonus)} 증가`,
    complete_rage_mastery: () => `분노 게이지 충전량 2배`,
    shrink_magic: v => `턴 시작 시 적 공격력 ${pct(v.reduction)} 감소 (${v.duration}턴)`,

    defense_ultimate: v => `방어력 ${pct(v.bonus)} 증가`,
    valor_ultimate: v => `공격력 ${pct(v.bonus)} 증가`,
    super_atk: v => `공격력 ${pct(v.bonus)} 증가`,
    angel_power: v => `공격력 ${pct(v.bonus)} 증가`,
    demon_power: v => `공격 시 마왕의 힘으로 ${v.damage}의 추가 피해`,

    revive: v => `사망 시 최대 체력의 ${pct(v.hpPercent)}로 부활 (1회)`,
  };

  const builder = builders[id];
  return builder ? builder(d) : '';
}
