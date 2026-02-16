export const ActiveSkillTierData = {
  ilban_attack: {
    1: { coefficient: 1.0 },
    2: { coefficient: 1.0 },
    3: { coefficient: 1.0 },
    4: { coefficient: 1.0 },
  },
  bunno_attack: {
    1: { coefficient: 0.75 },
    2: { coefficient: 0.85 },
    3: { coefficient: 1.0 },
    4: { coefficient: 1.2 },
  },

  rage_accumulate: {
    1: { amount: 25 },
    2: { amount: 35 },
    3: { amount: 45 },
    4: { amount: 60 },
  },
  hp_recovery: {
    1: { amount: 10 },
    2: { amount: 18 },
    3: { amount: 28 },
    4: { amount: 42 },
  },
  lightning_summon: {
    1: { coefficient: 0.2 },
    2: { coefficient: 0.3 },
    3: { coefficient: 0.42 },
    4: { coefficient: 0.6 },
  },
  lance_summon: {
    1: { coefficient: 0.15 },
    2: { coefficient: 0.25 },
    3: { coefficient: 0.38 },
    4: { coefficient: 0.55 },
  },
  sword_aura_summon: {
    1: { coefficient: 0.15 },
    2: { coefficient: 0.25 },
    3: { coefficient: 0.38 },
    4: { coefficient: 0.55 },
  },
  poison_inject: {
    1: { coefficient: 0.06, duration: 3 },
    2: { coefficient: 0.09, duration: 4 },
    3: { coefficient: 0.13, duration: 5 },
    4: { coefficient: 0.18, duration: 6 },
  },
  flame_summon: {
    1: { coefficient: 0.18 },
    2: { coefficient: 0.28 },
    3: { coefficient: 0.4 },
    4: { coefficient: 0.58 },
  },

  shuriken_summon: {
    1: { coefficient: 0.1 },
    2: { coefficient: 0.18 },
    3: { coefficient: 0.28 },
    4: { coefficient: 0.42 },
  },

  thunder_shuriken: {
    1: { injectedProbability: 0.2 },
    2: { injectedProbability: 0.3 },
    3: { injectedProbability: 0.42 },
    4: { injectedProbability: 0.6 },
  },
  rage_shuriken: {
    1: { injectedProbability: 0.2 },
    2: { injectedProbability: 0.3 },
    3: { injectedProbability: 0.42 },
    4: { injectedProbability: 0.6 },
  },
  recovery_shuriken: {
    1: { injectedProbability: 0.2 },
    2: { injectedProbability: 0.3 },
    3: { injectedProbability: 0.42 },
    4: { injectedProbability: 0.6 },
  },
  thunder_strike: {
    1: { count: 1 },
    2: { count: 1 },
    3: { count: 2 },
    4: { count: 2 },
  },
  lance_strike: {
    1: { count: 1 },
    2: { count: 1 },
    3: { count: 2 },
    4: { count: 2 },
  },
  aura_strike: {
    1: { count: 1 },
    2: { count: 1 },
    3: { count: 2 },
    4: { count: 2 },
  },
  bunno_thunder: {
    1: { count: 1 },
    2: { count: 2 },
    3: { count: 2 },
    4: { count: 3 },
  },
  bunno_lance: {
    1: { count: 1 },
    2: { count: 2 },
    3: { count: 2 },
    4: { count: 3 },
  },
  bunno_flame: {
    1: { count: 1 },
    2: { count: 2 },
    3: { count: 2 },
    4: { count: 3 },
  },
  rage_gauge_boost: {
    1: { amount: 25 },
    2: { amount: 35 },
    3: { amount: 45 },
    4: { amount: 60 },
  },
  venom_sword: {
    1: { duration: 3 },
    2: { duration: 4 },
    3: { duration: 5 },
    4: { duration: 6 },
  },
  thunderstorm: {
    1: { count: 2 },
    2: { count: 3 },
    3: { count: 4 },
    4: { count: 5 },
  },
  tyrant: {
    1: { coefficient: 0.3 },
    2: { coefficient: 0.45 },
    3: { coefficient: 0.6 },
    4: { coefficient: 0.8 },
  },
  shrink_magic: {
    1: { reduction: 0.2, duration: 3 },
    2: { reduction: 0.3, duration: 3 },
    3: { reduction: 0.4, duration: 4 },
    4: { reduction: 0.5, duration: 5 },
  },
  demon_power: {
    4: { coefficient: 0.5 },
  },
} as const;

export type ActiveSkillId = keyof typeof ActiveSkillTierData;

export function getActiveTierData(id: string, tier: number): Record<string, number> | undefined {
  const family = ActiveSkillTierData[id as ActiveSkillId];
  if (!family) return undefined;
  return (family as Record<number, Record<string, number>>)[tier];
}
