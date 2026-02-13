import { PetTier } from '../enums';
import { Stats } from '../value-objects/Stats';
import { SeededRandom } from '../../infrastructure/SeededRandom';

export interface PetTemplateData {
  id: string;
  name: string;
  tier: PetTier;
  basePassiveBonus: Stats;
  weight: number;
}

const PET_TEMPLATES: PetTemplateData[] = [
  { id: 'elsa', name: 'Elsa', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 8, maxHp: 40 }), weight: 2 },
  { id: 'piggy', name: 'Piggy', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 5, maxHp: 30 }), weight: 2 },
  { id: 'freya', name: 'Freya', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 12, maxHp: 20 }), weight: 2 },
  { id: 'slime_king', name: 'Slime King', tier: PetTier.S, basePassiveBonus: Stats.create({ def: 5, maxHp: 60 }), weight: 2 },
  { id: 'flash', name: 'Flash', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 10, crit: 0.03 }), weight: 2 },
  { id: 'unicorn', name: 'Unicorn', tier: PetTier.S, basePassiveBonus: Stats.create({ maxHp: 80 }), weight: 2 },
  { id: 'ice_wind_fox', name: 'Ice Wind Fox', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 7, maxHp: 35 }), weight: 3 },
  { id: 'little_elle', name: 'Little Elle', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 6, maxHp: 40 }), weight: 3 },
  { id: 'cleopatra', name: 'Cleopatra', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 9, maxHp: 30 }), weight: 2 },

  { id: 'purple_demon_fox', name: 'Purple Demon Fox', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 6, maxHp: 25 }), weight: 8 },
  { id: 'baby_dragon', name: 'Baby Dragon', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 7, maxHp: 20 }), weight: 8 },
  { id: 'monopoly', name: 'Monopoly', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 4, maxHp: 30 }), weight: 8 },
  { id: 'glazed_shroom', name: 'Glazed Shroom', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 5, maxHp: 25 }), weight: 8 },
  { id: 'flame_fox', name: 'Flame Fox', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 8, maxHp: 15 }), weight: 8 },
  { id: 'cactus_fighter', name: 'Cactus Fighter', tier: PetTier.A, basePassiveBonus: Stats.create({ def: 3, maxHp: 35 }), weight: 8 },

  { id: 'brown_bunny', name: 'Brown Bunny', tier: PetTier.B, basePassiveBonus: Stats.create({ atk: 3, maxHp: 15 }), weight: 15 },
  { id: 'blue_bird', name: 'Blue Bird', tier: PetTier.B, basePassiveBonus: Stats.create({ atk: 2, maxHp: 20 }), weight: 15 },
  { id: 'green_frog', name: 'Green Frog', tier: PetTier.B, basePassiveBonus: Stats.create({ def: 2, maxHp: 18 }), weight: 15 },
];

export const PetTable = {
  getTemplate(id: string): PetTemplateData | undefined {
    return PET_TEMPLATES.find(p => p.id === id);
  },

  getAllTemplates(): PetTemplateData[] {
    return PET_TEMPLATES;
  },

  getRandomTemplate(rng: SeededRandom): PetTemplateData {
    return rng.weightedPick(
      PET_TEMPLATES.map(t => ({ item: t, weight: t.weight }))
    );
  },

  getTemplatesByTier(tier: PetTier): PetTemplateData[] {
    return PET_TEMPLATES.filter(p => p.tier === tier);
  },
};
