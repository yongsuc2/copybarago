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
    1: { triggerChance: 0.1 },
    2: { triggerChance: 0.2 },
    3: { triggerChance: 0.35 },
    4: { triggerChance: 0.5 },
  },
  iron_shield: {
    1: { hpPercent: 0.1 },
    2: { hpPercent: 0.18 },
    3: { hpPercent: 0.28 },
    4: { hpPercent: 0.4 },
  },
  multi_hit: {
    1: { chance: 0.1 },
    2: { chance: 0.15 },
    3: { chance: 0.25 },
    4: { chance: 0.35 },
  },
  crit_mastery: {
    1: { value: 0.12 },
    2: { value: 0.2 },
    3: { value: 0.3 },
    4: { value: 0.42 },
  },
  rage_mastery: {
    1: { value: 0.25 },
    2: { value: 0.4 },
    3: { value: 0.55 },
    4: { value: 0.75 },
  },
  atk_proficiency: {
    1: { value: 0.15 },
    2: { value: 0.25 },
    3: { value: 0.4 },
    4: { value: 0.6 },
  },
  def_proficiency: {
    1: { value: 0.15 },
    2: { value: 0.25 },
    3: { value: 0.4 },
    4: { value: 0.6 },
  },
  revive: {
    1: { hpPercent: 0.3 },
    2: { hpPercent: 0.4 },
    3: { hpPercent: 0.55 },
    4: { hpPercent: 0.75 },
  },
  angel_power: {
    4: { value: 0.3 },
  },
} as const;

export type PassiveSkillId = keyof typeof PassiveSkillTierData;

export function getPassiveTierData(id: string, tier: number): Record<string, number> | undefined {
  const family = PassiveSkillTierData[id as PassiveSkillId];
  if (!family) return undefined;
  return (family as Record<number, Record<string, number>>)[tier];
}
