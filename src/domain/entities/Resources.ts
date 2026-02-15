import { ResourceType } from '../enums';
import { Result } from '../value-objects/Result';

const STAMINA_MAX = 100;
const STAMINA_REGEN_PER_MINUTE = 1;

export class Resources {
  private amounts: Map<ResourceType, number> = new Map();
  private staminaMax: number;
  private staminaRegenPerMinute: number;

  constructor() {
    this.staminaMax = STAMINA_MAX;
    this.staminaRegenPerMinute = STAMINA_REGEN_PER_MINUTE;
    this.initDefaults();
  }

  private initDefaults(): void {
    for (const type of Object.values(ResourceType)) {
      this.amounts.set(type, 0);
    }
    this.amounts.set(ResourceType.STAMINA, this.staminaMax);
  }

  get(type: ResourceType): number {
    return this.amounts.get(type) ?? 0;
  }

  get gold(): number { return this.get(ResourceType.GOLD); }
  get gems(): number { return this.get(ResourceType.GEMS); }
  get stamina(): number { return this.get(ResourceType.STAMINA); }
  get challengeTokens(): number { return this.get(ResourceType.CHALLENGE_TOKEN); }
  get arenaTickets(): number { return this.get(ResourceType.ARENA_TICKET); }
  get pickaxes(): number { return this.get(ResourceType.PICKAXE); }
  get equipmentStones(): number { return this.get(ResourceType.EQUIPMENT_STONE); }
  get powerStones(): number { return this.get(ResourceType.POWER_STONE); }

  add(type: ResourceType, amount: number): void {
    const current = this.get(type);
    let newAmount = current + amount;

    if (type === ResourceType.STAMINA) {
      newAmount = Math.min(newAmount, this.staminaMax);
    }

    this.amounts.set(type, newAmount);
  }

  spend(type: ResourceType, amount: number): Result {
    if (!this.canAfford(type, amount)) {
      return Result.fail(`Not enough ${type}`);
    }
    this.amounts.set(type, this.get(type) - amount);
    return Result.ok();
  }

  canAfford(type: ResourceType, amount: number): boolean {
    return this.get(type) >= amount;
  }

  canAffordMultiple(entries: { type: ResourceType; amount: number }[]): boolean {
    return entries.every(e => this.canAfford(e.type, e.amount));
  }

  spendMultiple(entries: { type: ResourceType; amount: number }[]): Result {
    if (!this.canAffordMultiple(entries)) {
      return Result.fail('Not enough resources');
    }
    for (const entry of entries) {
      this.amounts.set(entry.type, this.get(entry.type) - entry.amount);
    }
    return Result.ok();
  }

  tick(deltaMs: number): void {
    const currentStamina = this.get(ResourceType.STAMINA);
    if (currentStamina >= this.staminaMax) return;

    const regenAmount = (deltaMs / 60000) * this.staminaRegenPerMinute;
    const newStamina = Math.min(currentStamina + regenAmount, this.staminaMax);
    this.amounts.set(ResourceType.STAMINA, newStamina);
  }

  getStaminaMax(): number {
    return this.staminaMax;
  }

  dailyReset(): void {
    this.amounts.set(ResourceType.CHALLENGE_TOKEN, 5);
    this.amounts.set(ResourceType.ARENA_TICKET, 5);
    this.amounts.set(ResourceType.PICKAXE, 10);
  }

  setAmount(type: ResourceType, amount: number): void {
    this.amounts.set(type, amount);
  }

  toJSON(): Record<string, number> {
    const obj: Record<string, number> = {};
    for (const [key, val] of this.amounts.entries()) {
      obj[key] = val;
    }
    return obj;
  }

  static fromJSON(data: Record<string, number>): Resources {
    const res = new Resources();
    for (const [key, val] of Object.entries(data)) {
      res.setAmount(key as ResourceType, val);
    }
    return res;
  }
}
