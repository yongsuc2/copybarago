import { SkillHierarchy, SkillEffectType } from '../enums';
import type { ActiveSkill, ActiveSkillEffect } from '../entities/ActiveSkill';

const HIERARCHY_ORDER: Record<SkillHierarchy, number> = {
  [SkillHierarchy.BUILTIN]: 0,
  [SkillHierarchy.UPPER]: 1,
  [SkillHierarchy.LOWER]: 2,
  [SkillHierarchy.LOWEST]: 3,
};

function isStrictlyLower(source: SkillHierarchy, target: SkillHierarchy): boolean {
  return HIERARCHY_ORDER[target] > HIERARCHY_ORDER[source];
}

export function validateSkillHierarchy(skills: ActiveSkill[]): string[] {
  const errors: string[] = [];
  const skillMap = new Map<string, ActiveSkill>();

  for (const skill of skills) {
    const key = `${skill.id}:${skill.tier}`;
    skillMap.set(key, skill);
  }

  const getSkill = (id: string): ActiveSkill | undefined => {
    for (const s of skills) {
      if (s.id === id) return s;
    }
    return undefined;
  };

  for (const skill of skills) {
    const key = `${skill.id}:t${skill.tier}`;

    for (const effect of skill.effects) {
      if (effect.type === SkillEffectType.TRIGGER_SKILL) {
        const target = getSkill(effect.targetSkillId);
        if (!target) {
          errors.push(`[${key}] triggers non-existent skill '${effect.targetSkillId}'`);
          continue;
        }
        if (!isStrictlyLower(skill.hierarchy, target.hierarchy)) {
          errors.push(
            `[${key}] (${skill.hierarchy}) cannot trigger '${effect.targetSkillId}' (${target.hierarchy})`
          );
        }
        if (effect.targetSkillId === skill.id) {
          errors.push(`[${key}] self-reference: triggers itself`);
        }
      }

      if (effect.type === SkillEffectType.INJECT_EFFECT) {
        const target = getSkill(effect.targetSkillId);
        if (!target) {
          errors.push(`[${key}] injects into non-existent skill '${effect.targetSkillId}'`);
          continue;
        }

        if (effect.targetSkillId === skill.id) {
          errors.push(`[${key}] self-reference: injects into itself`);
        }

        validateInjectedEffects(
          key,
          target,
          effect.injectedEffects,
          getSkill,
          errors,
        );
      }
    }

    if (skill.hierarchy === SkillHierarchy.LOWEST) {
      const hasTrigger = skill.effects.some(
        e => e.type === SkillEffectType.TRIGGER_SKILL
      );
      if (hasTrigger) {
        errors.push(`[${key}] LOWEST skill cannot have TRIGGER_SKILL effects`);
      }
    }
  }

  return errors;
}

function validateInjectedEffects(
  sourceKey: string,
  targetSkill: ActiveSkill,
  injectedEffects: ActiveSkillEffect[],
  getSkill: (id: string) => ActiveSkill | undefined,
  errors: string[],
): void {
  for (const injected of injectedEffects) {
    if (injected.type === SkillEffectType.TRIGGER_SKILL) {
      const subTarget = getSkill(injected.targetSkillId);
      if (!subTarget) {
        errors.push(
          `[${sourceKey}] injection: triggers non-existent '${injected.targetSkillId}'`
        );
        continue;
      }
      if (!isStrictlyLower(targetSkill.hierarchy, subTarget.hierarchy)) {
        errors.push(
          `[${sourceKey}] injection into '${targetSkill.id}' (${targetSkill.hierarchy}) illegally triggers '${injected.targetSkillId}' (${subTarget.hierarchy})`
        );
      }
    }
  }
}

export const MAX_SKILL_CHAIN_DEPTH = 3;
