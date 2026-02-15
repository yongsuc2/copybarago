export const SkillDataTable = {
  lightning: { damage: 15 },
  lance: { damage: 12 },
  shuriken: { damage: 10 },
  sword_aura: { damage: 12 },
  thunderstorm: { damage: 40 },
  tyrant: { damage: 35 },
  demon_power: { damage: 60 },

  rage_lightning: { damage: 30 },
  rage_lance: { damage: 35 },
  rage_flame_wave: { damage: 25 },

  poison_weapon: { damagePerTurn: 8, duration: 3 },

  lifesteal: { rate: 0.15 },
  regen: { healPerTurn: 10 },
  counter: { reflectRate: 0.3 },
  iron_shield: { shieldRate: 0.1 },
  multi_hit_mastery: { chance: 0.25 },
  crit_mastery: { critBonus: 0.15 },
  rage_mastery: { powerBonus: 0.25 },
  complete_rage_mastery: { bonusRagePerAttack: 25 },
  shrink_magic: { reduction: 0.2, duration: 3 },

  hp_proficiency: { bonus: 0.1 },
  atk_proficiency: { bonus: 0.1 },
  def_proficiency: { bonus: 0.1 },
  crit_proficiency: { bonus: 0.1 },
  defense_ultimate: { bonus: 0.5 },
  valor_ultimate: { bonus: 0.5 },
  super_atk: { bonus: 0.8 },
  angel_power: { bonus: 1.0 },

  revive: { hpPercent: 0.3 },
} as const;

const SD = SkillDataTable;

const pct = (v: number) => `${v * 100}%`;

export function getSkillDescription(id: string): string {
  const descriptions: Record<string, string> = {
    lightning: `공격 시 번개를 내려 ${SD.lightning.damage}의 추가 피해`,
    lance: `턴 시작 시 창으로 ${SD.lance.damage}의 선제 피해`,
    shuriken: `공격 시 수리검으로 ${SD.shuriken.damage}의 추가 피해`,
    sword_aura: `공격 시 검기로 ${SD.sword_aura.damage}의 추가 피해`,
    thunderstorm: `턴 시작 시 뇌우로 ${SD.thunderstorm.damage}의 피해`,
    tyrant: `공격 시 폭군의 일격으로 ${SD.tyrant.damage}의 추가 피해`,
    demon_power: `공격 시 마왕의 힘으로 ${SD.demon_power.damage}의 추가 피해`,

    rage_lightning: `분노 공격 시 번개로 ${SD.rage_lightning.damage}의 추가 피해`,
    rage_lance: `분노 공격 시 광창으로 ${SD.rage_lance.damage}의 추가 피해`,
    rage_flame_wave: `분노 공격 시 화염파로 ${SD.rage_flame_wave.damage}의 추가 피해`,

    poison_weapon: `공격 시 독을 부여하여 ${SD.poison_weapon.duration}턴간 매턴 ${SD.poison_weapon.damagePerTurn} 피해`,

    lifesteal: `가한 피해의 ${pct(SD.lifesteal.rate)}만큼 체력 회복`,
    regen: `매 턴 체력 ${SD.regen.healPerTurn} 회복`,
    counter: `피격 시 받은 피해의 ${pct(SD.counter.reflectRate)}를 반격`,
    iron_shield: `최대 체력의 ${pct(SD.iron_shield.shieldRate)}만큼 방어막 생성`,
    multi_hit_mastery: `공격 시 ${pct(SD.multi_hit_mastery.chance)} 확률로 추가 타격`,
    crit_mastery: `치명타 확률 ${pct(SD.crit_mastery.critBonus)} 증가`,
    rage_mastery: `분노 공격 데미지 ${pct(SD.rage_mastery.powerBonus)} 증가`,
    complete_rage_mastery: `분노 게이지 충전량 2배`,
    shrink_magic: `턴 시작 시 적 공격력 ${pct(SD.shrink_magic.reduction)} 감소 (${SD.shrink_magic.duration}턴)`,

    hp_proficiency: `방어력 ${pct(SD.hp_proficiency.bonus)} 증가`,
    atk_proficiency: `공격력 ${pct(SD.atk_proficiency.bonus)} 증가`,
    def_proficiency: `방어력 ${pct(SD.def_proficiency.bonus)} 증가`,
    crit_proficiency: `치명타 확률 ${pct(SD.crit_proficiency.bonus)} 증가`,
    defense_ultimate: `방어력 ${pct(SD.defense_ultimate.bonus)} 증가`,
    valor_ultimate: `공격력 ${pct(SD.valor_ultimate.bonus)} 증가`,
    super_atk: `공격력 ${pct(SD.super_atk.bonus)} 증가`,
    angel_power: `공격력 ${pct(SD.angel_power.bonus)} 증가`,

    revive: `사망 시 최대 체력의 ${pct(SD.revive.hpPercent)}로 부활 (1회)`,
  };
  return descriptions[id] ?? '';
}
