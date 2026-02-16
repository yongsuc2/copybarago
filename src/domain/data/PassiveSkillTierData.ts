export const PassiveSkillTierData = {
  lifesteal: {
    1: { rate: 0.15 },
    2: { rate: 0.22 },
    3: { rate: 0.30 },
    4: { rate: 0.40 },
  },
  regen: {
    1: { healPerTurn: 10 },
    2: { healPerTurn: 18 },
    3: { healPerTurn: 28 },
    4: { healPerTurn: 42 },
  },
  counter: {
    1: { damageRate: 0.3 },
    2: { damageRate: 0.45 },
    3: { damageRate: 0.6 },
    4: { damageRate: 0.8 },
  },
  iron_shield: {
    1: { hpPercent: 0.1 },
    2: { hpPercent: 0.18 },
    3: { hpPercent: 0.28 },
    4: { hpPercent: 0.4 },
  },
  multi_hit: {
    1: { chance: 0.25 },
    2: { chance: 0.35 },
    3: { chance: 0.45 },
    4: { chance: 0.6 },
  },
  crit_mastery: {
    1: { value: 0.15 },
    2: { value: 0.25 },
    3: { value: 0.35 },
    4: { value: 0.5 },
  },
  rage_mastery: {
    1: { value: 0.25 },
    2: { value: 0.4 },
    3: { value: 0.55 },
    4: { value: 0.75 },
  },
  hp_proficiency: {
    1: { value: 0.1 },
    2: { value: 0.18 },
    3: { value: 0.28 },
    4: { value: 0.4 },
  },
  atk_proficiency: {
    1: { value: 0.1 },
    2: { value: 0.18 },
    3: { value: 0.28 },
    4: { value: 0.4 },
  },
  def_proficiency: {
    1: { value: 0.1 },
    2: { value: 0.18 },
    3: { value: 0.28 },
    4: { value: 0.4 },
  },
  crit_proficiency: {
    1: { value: 0.1 },
    2: { value: 0.18 },
    3: { value: 0.28 },
    4: { value: 0.4 },
  },
  defense_ultimate: {
    1: { value: 0.5 },
    2: { value: 0.7 },
    3: { value: 0.9 },
    4: { value: 1.2 },
  },
  valor_ultimate: {
    1: { value: 0.5 },
    2: { value: 0.7 },
    3: { value: 0.9 },
    4: { value: 1.2 },
  },
  super_atk: {
    1: { value: 0.8 },
    2: { value: 1.1 },
    3: { value: 1.4 },
    4: { value: 1.8 },
  },
  revive: {
    1: { hpPercent: 0.3 },
    2: { hpPercent: 0.4 },
    3: { hpPercent: 0.55 },
    4: { hpPercent: 0.75 },
  },
  angel_power: {
    4: { value: 1.0 },
  },
} as const;

export type PassiveSkillId = keyof typeof PassiveSkillTierData;

export function getPassiveTierData(id: string, tier: number): Record<string, number> | undefined {
  const family = PassiveSkillTierData[id as PassiveSkillId];
  if (!family) return undefined;
  return (family as Record<number, Record<string, number>>)[tier];
}
