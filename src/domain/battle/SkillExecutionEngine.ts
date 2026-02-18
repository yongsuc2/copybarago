import { AttackType, SkillEffectType, SkillHierarchy } from '../enums';
import type { ActiveSkill, ActiveSkillEffect, CompoundTrigger } from '../entities/ActiveSkill';
import { BattleDataTable } from '../data/BattleDataTable';
import { StatusEffect } from './StatusEffect';
import { StatusEffectType } from '../enums';
import { MAX_SKILL_CHAIN_DEPTH } from './SkillValidator';
import type { SeededRandom } from '../../infrastructure/SeededRandom';

export interface SkillExecutionUnit {
  name: string;
  currentHp: number;
  maxHp: number;
  getEffectiveAtk(): number;
  getEffectiveDef(): number;
  getEffectiveCrit(): number;
  rage: number;
  maxRage: number;
  magicCoefficient: number;
  takeDamage(amount: number): number;
  heal(amount: number): number;
  addStatusEffect(effect: StatusEffect): void;
  isAlive(): boolean;
  getHpPercent(): number;
  usedOnceConditions: Set<string>;
}

export interface SkillDamageResult {
  skillName: string;
  skillIcon: string;
  damage: number;
  isCrit: boolean;
  healAmount: number;
  rageChange: number;
  debuffApplied: boolean;
}

export class SkillExecutionEngine {
  private rng: SeededRandom;
  private resolvedEffectsMap: Map<string, ActiveSkillEffect[]> = new Map();

  constructor(rng: SeededRandom) {
    this.rng = rng;
  }

  resolveInjections(skills: ActiveSkill[]): void {
    this.resolvedEffectsMap.clear();

    for (const skill of skills) {
      const key = `${skill.id}:${skill.tier}`;
      this.resolvedEffectsMap.set(key, [...skill.effects]);
    }

    for (const skill of skills) {
      for (const effect of skill.effects) {
        if (effect.type === SkillEffectType.INJECT_EFFECT) {
          const targetSkill = skills.find(s => s.id === effect.targetSkillId);
          if (!targetSkill) continue;
          const targetKey = `${targetSkill.id}:${targetSkill.tier}`;
          const existing = this.resolvedEffectsMap.get(targetKey) ?? [];
          existing.push(...effect.injectedEffects);
          this.resolvedEffectsMap.set(targetKey, existing);
        }
      }
    }
  }

  getResolvedEffects(skill: ActiveSkill): ActiveSkillEffect[] {
    const key = `${skill.id}:${skill.tier}`;
    return this.resolvedEffectsMap.get(key) ?? skill.effects;
  }

  evaluateTrigger(
    trigger: CompoundTrigger,
    turnCount: number,
    source: SkillExecutionUnit,
    activatedSkillId?: string,
  ): boolean {
    const c1 = trigger.condition1;
    if (c1.kind === 'EVERY_N_TURNS') {
      if (turnCount % c1.interval !== 0) return false;
    } else if (c1.kind === 'ON_SKILL_ACTIVATION') {
      if (activatedSkillId !== c1.skillId) return false;
    }

    if (this.rng.next() > trigger.condition2.probability) return false;

    const c3 = trigger.condition3;
    switch (c3.type) {
      case 'NONE':
        break;
      case 'RAGE_FULL':
        if (source.rage < source.maxRage) return false;
        break;
      case 'HP_BELOW':
        if (source.getHpPercent() > c3.threshold) return false;
        break;
      case 'HP_ABOVE':
        if (source.getHpPercent() < c3.threshold) return false;
        break;
      case 'HP_BELOW_ONCE':
        if (source.getHpPercent() > c3.threshold) return false;
        if (source.usedOnceConditions.has('HP_BELOW_ONCE')) return false;
        source.usedOnceConditions.add('HP_BELOW_ONCE');
        break;
    }

    return true;
  }

  executeSkillEffects(
    skill: ActiveSkill,
    source: SkillExecutionUnit,
    target: SkillExecutionUnit,
    allSkills: ActiveSkill[],
    depth: number = 0,
  ): SkillDamageResult[] {
    if (depth >= MAX_SKILL_CHAIN_DEPTH) return [];
    if (!target.isAlive()) return [];

    const results: SkillDamageResult[] = [];
    const effects = this.getResolvedEffects(skill);

    for (const effect of effects) {
      if (!target.isAlive()) break;

      switch (effect.type) {
        case SkillEffectType.ATTACK: {
          const { damage, isCrit } = this.calculateSkillDamage(
            source, target, effect.attackType, effect.coefficient,
          );
          const dealt = target.takeDamage(damage);
          results.push({
            skillName: skill.name, skillIcon: skill.icon,
            damage: dealt, isCrit, healAmount: 0, rageChange: 0, debuffApplied: false,
          });

          if (effect.duration && effect.duration > 0) {
            const dotDamage = Math.floor(source.getEffectiveAtk() * effect.coefficient);
            const dotType = effect.attackType === AttackType.MAGIC
              ? StatusEffectType.BURN : StatusEffectType.POISON;
            target.addStatusEffect(new StatusEffect(dotType, effect.duration, dotDamage, skill.id));
          }
          break;
        }

        case SkillEffectType.TRIGGER_SKILL: {
          let shouldTrigger = true;
          if (effect.triggerConditions) {
            shouldTrigger = this.evaluateTrigger(
              effect.triggerConditions, 1, source, skill.id,
            );
          }
          if (shouldTrigger) {
            const childSkill = allSkills.find(s => s.id === effect.targetSkillId);
            if (childSkill) {
              for (let i = 0; i < effect.count; i++) {
                if (!target.isAlive()) break;
                const childResults = this.executeSkillEffects(
                  childSkill, source, target, allSkills, depth + 1,
                );
                results.push(...childResults);
              }
            }
          }
          break;
        }

        case SkillEffectType.HEAL_HP: {
          const healAmount = Math.floor(source.maxHp * effect.amount);
          const healed = source.heal(healAmount);
          if (healed > 0) {
            results.push({
              skillName: skill.name, skillIcon: skill.icon,
              damage: 0, isCrit: false, healAmount: healed, rageChange: 0, debuffApplied: false,
            });
          }
          break;
        }

        case SkillEffectType.ADD_RAGE: {
          source.rage = Math.min(source.rage + effect.amount, source.maxRage);
          results.push({
            skillName: skill.name, skillIcon: skill.icon,
            damage: 0, isCrit: false, healAmount: 0, rageChange: effect.amount, debuffApplied: false,
          });
          break;
        }

        case SkillEffectType.CONSUME_RAGE: {
          source.rage = Math.max(0, source.rage - effect.amount);
          break;
        }

        case SkillEffectType.DEBUFF: {
          let seType: StatusEffectType;
          switch (effect.stat) {
            case 'ATK': seType = StatusEffectType.ATK_DOWN; break;
            case 'DEF': seType = StatusEffectType.DEF_DOWN; break;
            default: seType = StatusEffectType.ATK_DOWN; break;
          }
          target.addStatusEffect(new StatusEffect(seType, effect.duration, effect.reduction));
          results.push({
            skillName: skill.name, skillIcon: skill.icon,
            damage: 0, isCrit: false, healAmount: 0, rageChange: 0, debuffApplied: true,
          });
          break;
        }

        case SkillEffectType.INJECT_EFFECT:
          break;
      }
    }

    return results;
  }

  private calculateSkillDamage(
    source: SkillExecutionUnit,
    target: SkillExecutionUnit,
    attackType: AttackType,
    coefficient: number,
  ): { damage: number; isCrit: boolean } {
    let rawDamage: number;

    switch (attackType) {
      case AttackType.PHYSICAL: {
        const atk = source.getEffectiveAtk();
        const def = target.getEffectiveDef();
        rawDamage = Math.max(1, atk * 1.0 * coefficient - Math.floor(def * BattleDataTable.damage.defenseReduction));
        break;
      }
      case AttackType.MAGIC: {
        const atk = source.getEffectiveAtk();
        const def = target.getEffectiveDef();
        rawDamage = Math.max(1, atk * source.magicCoefficient * coefficient - Math.floor(def * BattleDataTable.damage.magicDefenseReduction));
        break;
      }
      case AttackType.FIXED: {
        rawDamage = Math.floor(source.getEffectiveAtk() * coefficient);
        break;
      }
    }

    const variance = this.rng.nextFloat(BattleDataTable.damage.varianceMin, BattleDataTable.damage.varianceMax);
    const isCrit = attackType !== AttackType.FIXED && this.rng.chance(source.getEffectiveCrit());
    const critMult = isCrit ? BattleDataTable.damage.critMultiplier : 1.0;

    return {
      damage: Math.max(1, Math.floor(rawDamage * variance * critMult)),
      isCrit,
    };
  }
}
