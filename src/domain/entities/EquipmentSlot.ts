import { SlotType } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';
import { Equipment } from './Equipment';
import { EquipmentTable } from '../data/EquipmentTable';

export class EquipmentSlot {
  readonly type: SlotType;
  readonly maxCount: number;
  equipped: (Equipment | null)[];
  slotLevels: number[];
  slotPromoteCounts: number[];

  constructor(type: SlotType) {
    this.type = type;
    this.maxCount = EquipmentTable.getSlotMaxCount(type);
    this.equipped = new Array(this.maxCount).fill(null);
    this.slotLevels = new Array(this.maxCount).fill(0);
    this.slotPromoteCounts = new Array(this.maxCount).fill(0);
  }

  equip(equipment: Equipment, index: number = 0): Result<{ replaced: Equipment | null }> {
    if (equipment.slot !== this.type) {
      return Result.fail('Equipment slot type mismatch');
    }
    if (index < 0 || index >= this.maxCount) {
      return Result.fail('Invalid slot index');
    }

    const replaced = this.equipped[index];

    equipment.level = this.slotLevels[index];
    equipment.promoteCount = this.slotPromoteCounts[index];
    this.equipped[index] = equipment;
    return Result.ok({ replaced });
  }

  unequip(index: number): Result<{ equipment: Equipment }> {
    if (index < 0 || index >= this.maxCount) {
      return Result.fail('Invalid slot index');
    }
    const equipment = this.equipped[index];
    if (!equipment) {
      return Result.fail('No equipment in this slot');
    }
    this.equipped[index] = null;
    return Result.ok({ equipment });
  }

  syncLevel(index: number): void {
    const eq = this.equipped[index];
    if (eq) {
      this.slotLevels[index] = eq.level;
      this.slotPromoteCounts[index] = eq.promoteCount;
    }
  }

  initFromEquipped(): void {
    for (let i = 0; i < this.maxCount; i++) {
      const eq = this.equipped[i];
      if (eq) {
        this.slotLevels[i] = eq.level;
        this.slotPromoteCounts[i] = eq.promoteCount;
      }
    }
  }

  getTotalStats(): Stats {
    let total = Stats.ZERO;
    for (const eq of this.equipped) {
      if (eq) {
        total = total.add(eq.getStats());
      }
    }
    return total;
  }

  getEquipped(): Equipment[] {
    return this.equipped.filter((e): e is Equipment => e !== null);
  }

  hasEmptySlot(): boolean {
    return this.equipped.some(e => e === null);
  }

  getFirstEmptyIndex(): number {
    return this.equipped.findIndex(e => e === null);
  }
}
