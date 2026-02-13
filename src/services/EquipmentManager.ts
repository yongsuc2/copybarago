import { Equipment } from '../domain/entities/Equipment';
import { Player } from '../domain/entities/Player';
import { SlotType } from '../domain/enums';

export class EquipmentManager {
  compareEquipment(a: Equipment, b: Equipment): number {
    if (a.getGradeIndex() !== b.getGradeIndex()) {
      return a.getGradeIndex() - b.getGradeIndex();
    }
    if (a.isS !== b.isS) {
      return a.isS ? 1 : -1;
    }
    const statsA = a.getStats();
    const statsB = b.getStats();
    return (statsA.atk + statsA.maxHp) - (statsB.atk + statsB.maxHp);
  }

  autoEquipBest(player: Player, inventory: Equipment[]): Equipment[] {
    const replaced: Equipment[] = [];

    for (const slotType of [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.ACCESSORY]) {
      const slot = player.getEquipmentSlot(slotType);
      const candidates = inventory.filter(e => e.slot === slotType);

      candidates.sort((a, b) => this.compareEquipment(b, a));

      for (let i = 0; i < slot.maxCount && i < candidates.length; i++) {
        const candidate = candidates[i];
        const current = slot.equipped[i];

        if (!current || candidate.isBetterThan(current)) {
          const result = slot.equip(candidate, i);
          if (result.isOk() && result.data?.replaced) {
            replaced.push(result.data.replaced);
          }
        }
      }
    }

    return replaced;
  }

  getUpgradePriority(player: Player): { slot: SlotType; index: number } | null {
    const priorities: { slot: SlotType; index: number; score: number }[] = [];

    for (const slotType of [SlotType.WEAPON, SlotType.RING, SlotType.ARMOR, SlotType.ACCESSORY]) {
      const slot = player.getEquipmentSlot(slotType);
      for (let i = 0; i < slot.maxCount; i++) {
        const eq = slot.equipped[i];
        if (eq && !eq.needsPromote()) {
          const baseScore = slotType === SlotType.WEAPON ? 4
            : slotType === SlotType.RING ? 3
            : slotType === SlotType.ARMOR ? 2
            : 1;
          const gradeBonus = eq.isS ? 2 : 0;
          priorities.push({ slot: slotType, index: i, score: baseScore + gradeBonus - eq.level * 0.01 });
        }
      }
    }

    priorities.sort((a, b) => b.score - a.score);
    return priorities.length > 0 ? { slot: priorities[0].slot, index: priorities[0].index } : null;
  }
}
