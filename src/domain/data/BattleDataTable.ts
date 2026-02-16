export const BattleDataTable = {
  damage: {
    defenseReduction: 0.5,
    magicDefenseReduction: 0.3,
    baseMagicCoefficient: 0.5,
    varianceMin: 0.9,
    varianceMax: 1.1,
    critMultiplier: 1.5,
  },

  rage: {
    maxRage: 100,
    playerRagePerAttack: 25,
    attackMultiplier: 1.2,
  },


  skill: {
    onAttackAtkRatio: 0.3,
    onRageAtkRatio: 0.3,
    turnStartAtkRatio: 0.2,
  },

  enemy: {
    dualSpawnChance: 0.5,
    dualStatMultiplier: 0.7,
    scalingPerChapter: 1.12,
    scalingPerTowerFloor: 1.08,
    dayProgressMaxBonus: 0.8,
  },

  combatGoldReward: {
    base: 10,
    perChapter: 5,
  },

  maxTurns: 100,
} as const;
