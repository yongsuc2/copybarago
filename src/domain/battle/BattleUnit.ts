import { Stats } from '../value-objects/Stats';
import { Skill } from '../entities/Skill';
import { StatusEffect } from './StatusEffect';
import { StatusEffectType, EffectType, TriggerCondition } from '../enums';

export class BattleUnit {
  currentHp: number;
  maxHp: number;
  baseAtk: number;
  baseDef: number;
  baseCrit: number;
  activeSkills: Skill[];
  statusEffects: StatusEffect[];
  isPlayer: boolean;
  name: string;
  reviveUsed: boolean;
  multiHitCount: number;
  lifestealRate: number;
  counterRate: number;

  constructor(
    name: string,
    stats: Stats,
    skills: Skill[] = [],
    isPlayer: boolean = true,
  ) {
    this.name = name;
    this.currentHp = stats.hp;
    this.maxHp = stats.maxHp;
    this.baseAtk = stats.atk;
    this.baseDef = stats.def;
    this.baseCrit = stats.crit;
    this.activeSkills = [...skills];
    this.statusEffects = [];
    this.isPlayer = isPlayer;
    this.reviveUsed = false;
    this.multiHitCount = 1;
    this.lifestealRate = 0;
    this.counterRate = 0;

    this.applyPassiveSkills();
  }

  private applyPassiveSkills(): void {
    for (const skill of this.activeSkills) {
      if (skill.triggerCondition !== TriggerCondition.PASSIVE) continue;

      switch (skill.effect.type) {
        case EffectType.MULTI_HIT:
          this.multiHitCount = Math.max(this.multiHitCount, Math.floor(skill.effect.value));
          break;
        case EffectType.LIFESTEAL:
          this.lifestealRate += skill.effect.value;
          break;
        case EffectType.BUFF:
          if (skill.effect.statusEffectType && skill.effect.duration > 0) {
            this.addStatusEffect(new StatusEffect(
              skill.effect.statusEffectType,
              skill.effect.duration,
              skill.effect.value,
            ));
          }
          break;
        case EffectType.HOT:
          if (skill.effect.statusEffectType) {
            this.addStatusEffect(new StatusEffect(
              skill.effect.statusEffectType,
              skill.effect.duration,
              skill.effect.value,
            ));
          }
          break;
      }
    }
  }

  getEffectiveAtk(): number {
    let atk = this.baseAtk;
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

  takeDamage(amount: number): number {
    const actual = Math.max(0, Math.min(amount, this.currentHp));
    this.currentHp -= actual;
    return actual;
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
    return !this.reviveUsed && this.hasSkillOfType(EffectType.REVIVE);
  }

  tryRevive(): boolean {
    if (!this.canRevive()) return false;

    const reviveSkill = this.activeSkills.find(
      s => s.effect.type === EffectType.REVIVE
    );
    if (!reviveSkill) return false;

    this.reviveUsed = true;
    this.currentHp = Math.floor(this.maxHp * reviveSkill.effect.value);
    return true;
  }

  addStatusEffect(effect: StatusEffect): void {
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
      totalHeal += effect.getHealPerTurn();
      effect.tick();
    }

    if (totalDamage > 0) this.takeDamage(totalDamage);
    if (totalHeal > 0) this.heal(totalHeal);

    this.statusEffects = this.statusEffects.filter(e => !e.isExpired());

    return { damage: totalDamage, heal: totalHeal };
  }

  getSkillsByTrigger(trigger: TriggerCondition): Skill[] {
    return this.activeSkills.filter(s => s.triggerCondition === trigger);
  }

  addSkill(skill: Skill): void {
    this.activeSkills.push(skill);
    if (skill.triggerCondition === TriggerCondition.PASSIVE) {
      this.applyPassiveSkillSingle(skill);
    }
  }

  private applyPassiveSkillSingle(skill: Skill): void {
    switch (skill.effect.type) {
      case EffectType.MULTI_HIT:
        this.multiHitCount = Math.max(this.multiHitCount, Math.floor(skill.effect.value));
        break;
      case EffectType.LIFESTEAL:
        this.lifestealRate += skill.effect.value;
        break;
      case EffectType.BUFF:
        if (skill.effect.statusEffectType && skill.effect.duration > 0) {
          this.addStatusEffect(new StatusEffect(
            skill.effect.statusEffectType,
            skill.effect.duration,
            skill.effect.value,
          ));
        }
        break;
      case EffectType.HOT:
        if (skill.effect.statusEffectType) {
          this.addStatusEffect(new StatusEffect(
            skill.effect.statusEffectType,
            skill.effect.duration,
            skill.effect.value,
          ));
        }
        break;
    }
  }

  hasSkillOfType(effectType: EffectType): boolean {
    return this.activeSkills.some(s => s.effect.type === effectType);
  }

  getHpPercent(): number {
    return this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
  }
}
