export const SkillDataTable = {
  lightning: {
    1: { damage: 15 }, 2: { damage: 25 },
    3: { damage: 40 }, 4: { damage: 60 },
  },
  lance: {
    1: { damage: 12 }, 2: { damage: 22 },
    3: { damage: 36 }, 4: { damage: 55 },
  },
  shuriken: {
    1: { damage: 10 }, 2: { damage: 18 },
    3: { damage: 30 }, 4: { damage: 48 },
  },
  sword_aura: {
    1: { damage: 12 }, 2: { damage: 22 },
    3: { damage: 36 }, 4: { damage: 55 },
  },
  thunderstorm: {
    1: { damage: 40 }, 2: { damage: 65 },
    3: { damage: 95 }, 4: { damage: 130 },
  },
  tyrant: {
    1: { damage: 35 }, 2: { damage: 55 },
    3: { damage: 80 }, 4: { damage: 115 },
  },

  rage_lightning: {
    1: { damage: 30 }, 2: { damage: 50 },
    3: { damage: 75 }, 4: { damage: 110 },
  },
  rage_lance: {
    1: { damage: 35 }, 2: { damage: 55 },
    3: { damage: 80 }, 4: { damage: 115 },
  },
  rage_flame_wave: {
    1: { damage: 25 }, 2: { damage: 42 },
    3: { damage: 65 }, 4: { damage: 95 },
  },

  poison_weapon: {
    1: { damagePerTurn: 8, duration: 3 },
    2: { damagePerTurn: 12, duration: 4 },
    3: { damagePerTurn: 18, duration: 5 },
    4: { damagePerTurn: 25, duration: 6 },
  },

  lifesteal: {
    1: { rate: 0.15 }, 2: { rate: 0.22 },
    3: { rate: 0.30 }, 4: { rate: 0.40 },
  },
  regen: {
    1: { healPerTurn: 10 }, 2: { healPerTurn: 18 },
    3: { healPerTurn: 28 }, 4: { healPerTurn: 42 },
  },
  counter: {
    1: { reflectRate: 0.3 }, 2: { reflectRate: 0.45 },
    3: { reflectRate: 0.6 }, 4: { reflectRate: 0.8 },
  },
  iron_shield: {
    1: { shieldRate: 0.1 }, 2: { shieldRate: 0.18 },
    3: { shieldRate: 0.28 }, 4: { shieldRate: 0.4 },
  },
  multi_hit_mastery: {
    1: { chance: 0.25 }, 2: { chance: 0.35 },
    3: { chance: 0.45 }, 4: { chance: 0.6 },
  },
  crit_mastery: {
    1: { critBonus: 0.15 }, 2: { critBonus: 0.25 },
    3: { critBonus: 0.35 }, 4: { critBonus: 0.5 },
  },
  rage_mastery: {
    1: { powerBonus: 0.25 }, 2: { powerBonus: 0.4 },
    3: { powerBonus: 0.55 }, 4: { powerBonus: 0.75 },
  },
  complete_rage_mastery: {
    1: { bonusRagePerAttack: 25 }, 2: { bonusRagePerAttack: 40 },
    3: { bonusRagePerAttack: 55 }, 4: { bonusRagePerAttack: 75 },
  },
  shrink_magic: {
    1: { reduction: 0.2, duration: 3 },
    2: { reduction: 0.3, duration: 3 },
    3: { reduction: 0.4, duration: 4 },
    4: { reduction: 0.5, duration: 5 },
  },

  hp_proficiency: {
    1: { bonus: 0.1 }, 2: { bonus: 0.18 },
    3: { bonus: 0.28 }, 4: { bonus: 0.4 },
  },
  atk_proficiency: {
    1: { bonus: 0.1 }, 2: { bonus: 0.18 },
    3: { bonus: 0.28 }, 4: { bonus: 0.4 },
  },
  def_proficiency: {
    1: { bonus: 0.1 }, 2: { bonus: 0.18 },
    3: { bonus: 0.28 }, 4: { bonus: 0.4 },
  },
  crit_proficiency: {
    1: { bonus: 0.1 }, 2: { bonus: 0.18 },
    3: { bonus: 0.28 }, 4: { bonus: 0.4 },
  },
  defense_ultimate: {
    1: { bonus: 0.5 }, 2: { bonus: 0.7 },
    3: { bonus: 0.9 }, 4: { bonus: 1.2 },
  },
  valor_ultimate: {
    1: { bonus: 0.5 }, 2: { bonus: 0.7 },
    3: { bonus: 0.9 }, 4: { bonus: 1.2 },
  },
  super_atk: {
    1: { bonus: 0.8 }, 2: { bonus: 1.1 },
    3: { bonus: 1.4 }, 4: { bonus: 1.8 },
  },
  revive: {
    1: { hpPercent: 0.3 }, 2: { hpPercent: 0.4 },
    3: { hpPercent: 0.55 }, 4: { hpPercent: 0.75 },
  },

  angel_power: { 4: { bonus: 1.0 } },
  demon_power: { 4: { damage: 60 } },
} as const;

type SD = typeof SkillDataTable;

const pct = (v: number) => `${v * 100}%`;

function tierData<K extends keyof SD>(id: K, tier: number) {
  const family = SkillDataTable[id] as Record<number, unknown>;
  return family[tier] as Record<string, number> | undefined;
}

export function getSkillDescription(id: string, tier: number = 1): string {
  const d = tierData(id as keyof SD, tier);
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
    regen: v => `매 턴 체력 ${v.healPerTurn} 회복`,
    counter: v => `피격 시 받은 피해의 ${pct(v.reflectRate)}를 반격`,
    iron_shield: v => `최대 체력의 ${pct(v.shieldRate)}만큼 방어막 생성`,
    multi_hit_mastery: v => `공격 시 ${pct(v.chance)} 확률로 추가 타격`,
    crit_mastery: v => `치명타 확률 ${pct(v.critBonus)} 증가`,
    rage_mastery: v => `분노 공격 데미지 ${pct(v.powerBonus)} 증가`,
    complete_rage_mastery: () => `분노 게이지 충전량 2배`,
    shrink_magic: v => `턴 시작 시 적 공격력 ${pct(v.reduction)} 감소 (${v.duration}턴)`,

    hp_proficiency: v => `방어력 ${pct(v.bonus)} 증가`,
    atk_proficiency: v => `공격력 ${pct(v.bonus)} 증가`,
    def_proficiency: v => `방어력 ${pct(v.bonus)} 증가`,
    crit_proficiency: v => `치명타 확률 ${pct(v.bonus)} 증가`,
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
