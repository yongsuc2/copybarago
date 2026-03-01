import { Stats } from '../value-objects/Stats';
import { ActiveSkill } from '../entities/ActiveSkill';
import { PassiveSkill } from '../entities/PassiveSkill';
import { StatusEffect } from './StatusEffect';
import { StatusEffectType, PassiveType, StatType, SkillEffectType, SkillHierarchy, SkillTag } from '../enums';
import { BattleDataTable } from '../data/BattleDataTable';
import type { SkillExecutionUnit } from './SkillExecutionEngine';

export type SessionSkill = ActiveSkill | PassiveSkill;

export function isActiveSkill(skill: SessionSkill): skill is ActiveSkill {
  return 'hierarchy' in skill;
}

export function isPassiveSkill(skill: SessionSkill): skill is PassiveSkill {
  return !('hierarchy' in skill);
}

export class BattleUnit implements SkillExecutionUnit {
  currentHp: number;
  maxHp: number;
  baseAtk: number;
  baseDef: number;
  baseCrit: number;
  activeSkills: ActiveSkill[];
  passiveSkills: PassiveSkill[];
  statusEffects: StatusEffect[];
  isPlayer: boolean;
  name: string;
  reviveUsed: boolean;
  reviveHpPercent: number;
  multiHitChance: number;
  lifestealRate: number;
  counterTriggerChance: number;
  rage: number;
  maxRage: number;
  ragePerAttack: number;
  magicCoefficient: number;
  shield: number;
  usedOnceConditions: Set<string>;
  skillTagBonuses: Map<SkillTag, number>;
  lowHpModifiers: { stat: StatType; maxBonus: number }[];
  hpDamageCoefficient: number;

  constructor(
    name: string,
    stats: Stats,
    activeSkills: ActiveSkill[] = [],
    passiveSkills: PassiveSkill[] = [],
    isPlayer: boolean = true,
  ) {
    this.name = name;
    this.currentHp = stats.hp;
    this.maxHp = stats.maxHp;
    this.baseAtk = stats.atk;
    this.baseDef = stats.def;
    this.baseCrit = stats.crit;
    this.activeSkills = [...activeSkills];
    this.passiveSkills = [...passiveSkills];
    this.statusEffects = [];
    this.isPlayer = isPlayer;
    this.reviveUsed = false;
    this.reviveHpPercent = 0;
    this.multiHitChance = 0;
    this.lifestealRate = 0;
    this.counterTriggerChance = 0;
    this.rage = 0;
    this.maxRage = BattleDataTable.rage.maxRage;
    this.ragePerAttack = this.extractRagePerAttack();
    this.magicCoefficient = BattleDataTable.damage.baseMagicCoefficient;
    this.shield = 0;
    this.usedOnceConditions = new Set();
    this.skillTagBonuses = new Map();
    this.lowHpModifiers = [];
    this.hpDamageCoefficient = 0;

    this.applyPassiveSkills();
  }

  private extractRagePerAttack(): number {
    for (const skill of this.activeSkills) {
      if (skill.id === 'rage_accumulate') {
        for (const eff of skill.effects) {
          if (eff.type === SkillEffectType.ADD_RAGE) {
            return eff.amount;
          }
        }
      }
    }
    return 0;
  }

  private applyPassiveSkills(): void {
    const statMods = this.passiveSkills.filter(s => s.effect.type === PassiveType.STAT_MODIFIER);
    const others = this.passiveSkills.filter(s => s.effect.type !== PassiveType.STAT_MODIFIER);
    for (const skill of statMods) this.applyPassiveSkill(skill);
    for (const skill of others) this.applyPassiveSkill(skill);
  }

  private applyPassiveSkill(skill: PassiveSkill): void {
    switch (skill.effect.type) {
      case PassiveType.STAT_MODIFIER: {
        const { stat, value, isPercentage } = skill.effect;
        if (stat === StatType.ATK) {
          this.baseAtk = isPercentage ? Math.floor(this.baseAtk * (1 + value)) : this.baseAtk + value;
        } else if (stat === StatType.DEF) {
          this.baseDef = isPercentage ? Math.floor(this.baseDef * (1 + value)) : this.baseDef + value;
        } else if (stat === StatType.CRIT) {
          this.baseCrit = Math.min(1.0, this.baseCrit + value);
        } else if (stat === StatType.HP) {
          const oldMax = this.maxHp;
          this.maxHp = isPercentage ? Math.floor(this.maxHp * (1 + value)) : this.maxHp + value;
          this.currentHp += (this.maxHp - oldMax);
        } else if (stat === 'MAGIC_COEFFICIENT') {
          this.magicCoefficient += value;
        }
        break;
      }
      case PassiveType.COUNTER:
        this.counterTriggerChance = Math.max(this.counterTriggerChance, skill.effect.triggerChance);
        break;
      case PassiveType.LIFESTEAL:
        this.lifestealRate += skill.effect.rate;
        break;
      case PassiveType.SHIELD_ON_START:
        this.shield += Math.floor(this.maxHp * skill.effect.hpPercent);
        break;
      case PassiveType.REVIVE:
        this.reviveHpPercent = skill.effect.hpPercent;
        break;
      case PassiveType.REGEN:
        this.addStatusEffect(new StatusEffect(StatusEffectType.REGEN, 999, skill.effect.healPerTurn));
        break;
      case PassiveType.MULTI_HIT:
        this.multiHitChance += skill.effect.chance;
        break;
      case PassiveType.SKILL_MODIFIER: {
        const { targetTag, modifier } = skill.effect;
        if (modifier.damageMultiplier) {
          const current = this.skillTagBonuses.get(targetTag) ?? 0;
          this.skillTagBonuses.set(targetTag, current + modifier.damageMultiplier);
        }
        break;
      }
      case PassiveType.LOW_HP_MODIFIER: {
        this.lowHpModifiers.push({ stat: skill.effect.stat, maxBonus: skill.effect.maxBonus });
        break;
      }
      case PassiveType.MAX_HP_DAMAGE: {
        this.hpDamageCoefficient += skill.effect.coefficient;
        break;
      }
    }
  }

  private getLowHpBonus(stat: StatType): number {
    const hpRatio = this.getHpPercent();
    if (hpRatio >= 0.5) return 0;
    const r = (0.5 - hpRatio) / 0.5;
    let bonus = 0;
    for (const mod of this.lowHpModifiers) {
      if (mod.stat === stat) bonus += mod.maxBonus * r * r;
    }
    return bonus;
  }

  getHpBonusDamage(): number {
    if (this.hpDamageCoefficient <= 0) return 0;
    return Math.floor(this.maxHp * this.hpDamageCoefficient);
  }

  getEffectiveAtk(): number {
    let atk = this.baseAtk;
    const lowHpBonus = this.getLowHpBonus(StatType.ATK);
    if (lowHpBonus > 0) atk = Math.floor(atk * (1 + lowHpBonus));
    for (const effect of this.statusEffects) {
      if (effect.type === StatusEffectType.ATK_UP) {
        atk = Math.floor(atk * (1 + effect.value));
      }
      if (effect.type === StatusEffectType.ATK_DOWN) {
        atk = Math.floor(atk * (1 - effect.value));
      }
    }
    return Math.max(1, atk);
  }

  getEffectiveDef(): number {
    let def = this.baseDef;
    const lowHpBonus = this.getLowHpBonus(StatType.DEF);
    if (lowHpBonus > 0) def = Math.floor(def * (1 + lowHpBonus));
    for (const effect of this.statusEffects) {
      if (effect.type === StatusEffectType.DEF_UP) {
        def = Math.floor(def * (1 + effect.value));
      }
      if (effect.type === StatusEffectType.DEF_DOWN) {
        def = Math.floor(def * (1 - effect.value));
      }
    }
    return Math.max(0, def);
  }

  getEffectiveCrit(): number {
    let crit = this.baseCrit;
    for (const effect of this.statusEffects) {
      if (effect.type === StatusEffectType.CRIT_UP) {
        crit += effect.value;
      }
    }
    return Math.min(1.0, crit);
  }

  getSkillDamageMultiplier(tags: SkillTag[]): number {
    let bonus = 0;
    for (const tag of tags) {
      bonus += this.skillTagBonuses.get(tag) ?? 0;
    }
    return 1 + bonus;
  }

  takeDamage(amount: number): number {
    let remaining = amount;
    let dealt = 0;
    if (this.shield > 0) {
      const absorbed = Math.min(remaining, this.shield);
      this.shield -= absorbed;
      remaining -= absorbed;
      dealt += absorbed;
    }
    const hpDmg = Math.max(0, Math.min(remaining, this.currentHp));
    this.currentHp -= hpDmg;
    dealt += hpDmg;
    return dealt;
  }

  heal(amount: number): number {
    const actual = Math.min(amount, this.maxHp - this.currentHp);
    this.currentHp += actual;
    return actual;
  }

  isAlive(): boolean {
    return this.currentHp > 0;
  }

  canRevive(): boolean {
    return !this.reviveUsed && this.reviveHpPercent > 0;
  }

  tryRevive(): boolean {
    if (!this.canRevive()) return false;
    this.reviveUsed = true;
    this.currentHp = Math.floor(this.maxHp * this.reviveHpPercent);
    return true;
  }

  addStatusEffect(effect: StatusEffect): void {
    if (effect.isDot()) {
      if (effect.sourceSkillId) {
        const existingIdx = this.statusEffects.findIndex(
          e => e.isDot() && e.sourceSkillId === effect.sourceSkillId,
        );
        if (existingIdx >= 0) {
          if (effect.value >= this.statusEffects[existingIdx].value) {
            this.statusEffects[existingIdx] = effect;
          }
          return;
        }
      }
      this.statusEffects.push(effect);
      return;
    }
    const existing = this.statusEffects.find(e => e.type === effect.type);
    if (existing) {
      existing.remainingTurns = Math.max(existing.remainingTurns, effect.remainingTurns);
      return;
    }
    this.statusEffects.push(effect);
  }

  tickStatusEffects(): { damage: number; heal: number } {
    let totalDamage = 0;
    let totalHeal = 0;

    for (const effect of this.statusEffects) {
      totalDamage += effect.getDamagePerTurn();
      if (effect.isHot()) {
        totalHeal += Math.floor(this.maxHp * effect.value);
      }
      effect.tick();
    }

    if (totalDamage > 0) this.takeDamage(totalDamage);
    if (totalHeal > 0) this.heal(totalHeal);

    this.statusEffects = this.statusEffects.filter(e => !e.isExpired());

    return { damage: totalDamage, heal: totalHeal };
  }

  getHpPercent(): number {
    return this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
  }

  getBuiltinSkills(): ActiveSkill[] {
    return this.activeSkills.filter(s => s.hierarchy === SkillHierarchy.BUILTIN);
  }

  getUpperSkills(): ActiveSkill[] {
    return this.activeSkills.filter(s => s.hierarchy === SkillHierarchy.UPPER);
  }

  getAllSkillsForEngine(): ActiveSkill[] {
    return this.activeSkills;
  }
}
