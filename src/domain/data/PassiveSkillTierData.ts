import rows from './json/passive-skill-tier.data.json';

type NestedMap = Record<string, Record<number, Record<string, number>>>;

const NESTED: NestedMap = {};
for (const row of rows) {
  const { skill, tier, ...params } = row;
  if (!NESTED[skill]) NESTED[skill] = {};
  NESTED[skill][tier] = params as Record<string, number>;
}

export const PassiveSkillTierData = NESTED;

export type PassiveSkillId =
  | 'lifesteal' | 'regen' | 'counter' | 'iron_shield'
  | 'multi_hit' | 'crit_mastery' | 'rage_mastery'
  | 'lightning_mastery' | 'shuriken_mastery' | 'lance_mastery'
  | 'revive' | 'angel_power';

export function getPassiveTierData(id: string, tier: number): Record<string, number> | undefined {
  const family = NESTED[id];
  if (!family) return undefined;
  return family[tier];
}
