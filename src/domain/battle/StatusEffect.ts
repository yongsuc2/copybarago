import { StatusEffectType } from '../enums';

export class StatusEffect {
  constructor(
    public readonly type: StatusEffectType,
    public remainingTurns: number,
    public readonly value: number,
    public readonly sourceSkillId?: string,
  ) {}

  tick(): void {
    if (this.remainingTurns > 0) {
      this.remainingTurns -= 1;
    }
  }

  isExpired(): boolean {
    return this.remainingTurns <= 0;
  }

  isStatBuff(): boolean {
    return (
      this.type === StatusEffectType.ATK_UP ||
      this.type === StatusEffectType.DEF_UP ||
      this.type === StatusEffectType.CRIT_UP
    );
  }

  isStatDebuff(): boolean {
    return (
      this.type === StatusEffectType.ATK_DOWN ||
      this.type === StatusEffectType.DEF_DOWN
    );
  }

  isStun(): boolean {
    return this.type === StatusEffectType.STUN;
  }

  isDot(): boolean {
    return (
      this.type === StatusEffectType.POISON ||
      this.type === StatusEffectType.BURN
    );
  }

  isHot(): boolean {
    return this.type === StatusEffectType.REGEN;
  }

  getDamagePerTurn(): number {
    if (this.isDot()) return this.value;
    return 0;
  }

  getHealPerTurn(): number {
    if (this.isHot()) return this.value;
    return 0;
  }
}
