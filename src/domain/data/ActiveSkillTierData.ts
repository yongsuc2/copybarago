import rows from './json/active-skill-tier.data.json';

type NestedMap = Record<string, Record<number, Record<string, number>>>;

const NESTED: NestedMap = {};
for (const row of rows) {
  const { skill, tier, ...params } = row;
  if (!NESTED[skill]) NESTED[skill] = {};
  NESTED[skill][tier] = params as Record<string, number>;
}

export const ActiveSkillTierData = NESTED;

export type ActiveSkillId =
  | 'ilban_attack' | 'bunno_attack'
  | 'rage_accumulate' | 'hp_recovery'
  | 'lightning_summon' | 'lance_summon' | 'sword_aura_summon'
  | 'poison_inject' | 'flame_summon' | 'shuriken_summon'
  | 'thunder_shuriken' | 'rage_shuriken' | 'recovery_shuriken' | 'poison_shuriken'
  | 'shuriken_strike' | 'thunder_strike' | 'lance_strike' | 'aura_strike'
  | 'bunno_thunder' | 'bunno_lance' | 'bunno_flame'
  | 'rage_gauge_boost' | 'venom_sword'
  | 'tyrant' | 'shrink_magic' | 'demon_power'
  | 'hp_crush' | 'stun_strike';

export function getActiveTierData(id: string, tier: number): Record<string, number> | undefined {
  const family = NESTED[id];
  if (!family) return undefined;
  return family[tier];
}
