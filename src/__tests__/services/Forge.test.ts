import { describe, it, expect } from 'vitest';
import { Forge } from '../../services/Forge';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentGrade, SlotType } from '../../domain/enums';

function makeEquipment(
  slot: SlotType,
  grade: EquipmentGrade,
  overrides: { isS?: boolean; level?: number; promoteCount?: number; mergeLevel?: number } = {},
): Equipment {
  return new Equipment(
    `eq_${Math.random().toString(36).slice(2)}`,
    `${grade} ${slot}`,
    slot,
    grade,
    overrides.isS ?? false,
    overrides.level ?? 0,
    overrides.promoteCount ?? 0,
    null,
    null,
    overrides.mergeLevel ?? 0,
  );
}

function makeMany(
  count: number,
  slot: SlotType,
  grade: EquipmentGrade,
  overrides: { isS?: boolean; level?: number; mergeLevel?: number } = {},
): Equipment[] {
  return Array.from({ length: count }, () => makeEquipment(slot, grade, overrides));
}

describe('Forge', () => {
  const forge = new Forge();

  describe('canMerge', () => {
    it('returns false for empty array', () => {
      expect(forge.canMerge([])).toBe(false);
    });

    it('returns false for single item', () => {
      expect(forge.canMerge([makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON)])).toBe(false);
    });

    it('returns false for mixed grades', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.RARE),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      expect(forge.canMerge(items)).toBe(false);
    });

    it('returns false for mixed slots', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.ARMOR, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      expect(forge.canMerge(items)).toBe(false);
    });

    it('returns false for insufficient COMMON count (2/3)', () => {
      expect(forge.canMerge(makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON))).toBe(false);
    });

    it('returns true for 3 COMMON same slot', () => {
      expect(forge.canMerge(makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON))).toBe(true);
    });

    it('returns true for 3 UNCOMMON same slot', () => {
      expect(forge.canMerge(makeMany(3, SlotType.RING, EquipmentGrade.UNCOMMON))).toBe(true);
    });

    it('returns true for 3 RARE same slot', () => {
      expect(forge.canMerge(makeMany(3, SlotType.ARMOR, EquipmentGrade.RARE))).toBe(true);
    });

    it('returns true for 2 EPIC same slot same mergeLevel', () => {
      expect(forge.canMerge(makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC))).toBe(true);
    });

    it('returns true for 2 LEGENDARY same slot same mergeLevel', () => {
      expect(forge.canMerge(makeMany(2, SlotType.NECKLACE, EquipmentGrade.LEGENDARY))).toBe(true);
    });

    it('returns false for EPIC with different mergeLevels', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 0 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 1 }),
      ];
      expect(forge.canMerge(items)).toBe(false);
    });

    it('returns false for MYTHIC (no merge)', () => {
      expect(forge.canMerge(makeMany(3, SlotType.WEAPON, EquipmentGrade.MYTHIC))).toBe(false);
    });

    it('returns true with excess items (4 COMMON)', () => {
      expect(forge.canMerge(makeMany(4, SlotType.WEAPON, EquipmentGrade.COMMON))).toBe(true);
    });
  });

  describe('merge - grade progression (low grades)', () => {
    it('COMMON x3 → UNCOMMON', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.UNCOMMON);
    });

    it('UNCOMMON x3 → RARE', () => {
      const items = makeMany(3, SlotType.ARMOR, EquipmentGrade.UNCOMMON);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.RARE);
    });

    it('RARE x3 → EPIC', () => {
      const items = makeMany(3, SlotType.RING, EquipmentGrade.RARE);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.mergeLevel).toBe(0);
    });
  });

  describe('merge - high grade mergeLevel progression', () => {
    it('EPIC+0 x2 → EPIC+1', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 0 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.mergeLevel).toBe(1);
    });

    it('EPIC+1 x2 → EPIC+2', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 1 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.mergeLevel).toBe(2);
    });

    it('EPIC+2 x2 → LEGENDARY+0', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 2 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.mergeLevel).toBe(0);
    });

    it('LEGENDARY+0 x2 → LEGENDARY+1', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 0 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.mergeLevel).toBe(1);
    });

    it('LEGENDARY+1 x2 → LEGENDARY+2', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 1 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.mergeLevel).toBe(2);
    });

    it('LEGENDARY+2 x2 → MYTHIC', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 2 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.MYTHIC);
      expect(result.data!.result.mergeLevel).toBe(0);
    });
  });

  describe('merge - result properties', () => {
    it('result preserves source slot', () => {
      const items = makeMany(3, SlotType.RING, EquipmentGrade.COMMON);
      const result = forge.merge(items);
      expect(result.data!.result.slot).toBe(SlotType.RING);
    });

    it('result preserves source level', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON, { level: 5 });
      const result = forge.merge(items);
      expect(result.data!.result.level).toBe(5);
    });

    it('result preserves source promoteCount', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { promoteCount: 2 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      const result = forge.merge(items);
      expect(result.data!.result.promoteCount).toBe(2);
    });

    it('result is not S-grade', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON);
      const result = forge.merge(items);
      expect(result.data!.result.isS).toBe(false);
    });

    it('result has unique id', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON);
      const result = forge.merge(items);
      expect(result.data!.result.id).toContain('merged_');
    });
  });

  describe('merge - S-grade rejection', () => {
    it('rejects when first item is S-grade', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { isS: true }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      expect(forge.merge(items).isFail()).toBe(true);
    });

    it('rejects when any item is S-grade', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { isS: true }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      expect(forge.merge(items).isFail()).toBe(true);
    });

    it('rejects S-grade EPIC merge', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { isS: true }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC),
      ];
      expect(forge.merge(items).isFail()).toBe(true);
    });
  });

  describe('merge - failure cases', () => {
    it('fails for insufficient items', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON);
      expect(forge.merge(items).isFail()).toBe(true);
    });

    it('fails for MYTHIC (already max)', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.MYTHIC);
      expect(forge.merge(items).isFail()).toBe(true);
    });

    it('fails for mixed grades', () => {
      const items = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.UNCOMMON),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      expect(forge.merge(items).isFail()).toBe(true);
    });
  });

  describe('findMergeCandidates', () => {
    it('groups COMMON by slot and grade', () => {
      const inventory = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON);
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(3);
    });

    it('returns empty for insufficient items', () => {
      const inventory = makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON);
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(0);
    });

    it('creates multiple batches from large group (6 COMMON → 2 groups)', () => {
      const inventory = makeMany(6, SlotType.WEAPON, EquipmentGrade.COMMON);
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(2);
      expect(candidates[0].length).toBe(3);
      expect(candidates[1].length).toBe(3);
    });

    it('leftover items not included (5 COMMON → 1 group of 3, 2 left over)', () => {
      const inventory = makeMany(5, SlotType.WEAPON, EquipmentGrade.COMMON);
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(3);
    });

    it('separates different slots', () => {
      const inventory = [
        ...makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(3, SlotType.ARMOR, EquipmentGrade.COMMON),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(2);
    });

    it('separates different grades', () => {
      const inventory = [
        ...makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(3, SlotType.WEAPON, EquipmentGrade.UNCOMMON),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(2);
    });

    it('skips S-grade equipment', () => {
      const inventory = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { isS: true }),
        ...makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(0);
    });

    it('excludes MYTHIC from candidates', () => {
      const inventory = makeMany(3, SlotType.WEAPON, EquipmentGrade.MYTHIC);
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(0);
    });

    it('EPIC groups by slot, grade, and mergeLevel', () => {
      const inventory = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 0 });
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(2);
    });

    it('EPIC separates different mergeLevels', () => {
      const inventory = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 0 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 1 }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(0);
    });

    it('LEGENDARY groups by mergeLevel', () => {
      const inventory = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 1 });
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(2);
    });

    it('mixed scenario: multiple slots and grades', () => {
      const inventory = [
        ...makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(3, SlotType.ARMOR, EquipmentGrade.RARE),
        ...makeMany(2, SlotType.RING, EquipmentGrade.EPIC),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.MYTHIC),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { isS: true }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(3);
    });
  });

  describe('getMergeRequirement', () => {
    it('COMMON requires 3', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.COMMON)).toBe(3);
    });

    it('UNCOMMON requires 3', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.UNCOMMON)).toBe(3);
    });

    it('RARE requires 3', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.RARE)).toBe(3);
    });

    it('EPIC requires 2', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.EPIC)).toBe(2);
    });

    it('LEGENDARY requires 2', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.LEGENDARY)).toBe(2);
    });

    it('MYTHIC requires 0 (cannot merge)', () => {
      expect(forge.getMergeRequirement(EquipmentGrade.MYTHIC)).toBe(0);
    });
  });

  describe('full synthesis chain', () => {
    it('COMMON → UNCOMMON → RARE → EPIC → EPIC+1 → EPIC+2 → LEGENDARY → LEGENDARY+1 → LEGENDARY+2 → MYTHIC', () => {
      const commons = makeMany(9, SlotType.WEAPON, EquipmentGrade.COMMON);

      const uncommons: Equipment[] = [];
      for (let i = 0; i < 9; i += 3) {
        const result = forge.merge(commons.slice(i, i + 3));
        expect(result.isOk()).toBe(true);
        uncommons.push(result.data!.result);
      }
      expect(uncommons.length).toBe(3);
      expect(uncommons.every(e => e.grade === EquipmentGrade.UNCOMMON)).toBe(true);

      const rareResult = forge.merge(uncommons);
      expect(rareResult.isOk()).toBe(true);
      expect(rareResult.data!.result.grade).toBe(EquipmentGrade.RARE);

      const rares = [
        rareResult.data!.result,
        forge.merge(makeMany(3, SlotType.WEAPON, EquipmentGrade.UNCOMMON)).data!.result,
        forge.merge(makeMany(3, SlotType.WEAPON, EquipmentGrade.UNCOMMON)).data!.result,
      ];
      const epicResult = forge.merge(rares);
      expect(epicResult.isOk()).toBe(true);
      expect(epicResult.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(epicResult.data!.result.mergeLevel).toBe(0);

      const epic1Result = forge.merge([
        epicResult.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC),
      ]);
      expect(epic1Result.isOk()).toBe(true);
      expect(epic1Result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(epic1Result.data!.result.mergeLevel).toBe(1);

      const epic2Result = forge.merge([
        epic1Result.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 1 }),
      ]);
      expect(epic2Result.isOk()).toBe(true);
      expect(epic2Result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(epic2Result.data!.result.mergeLevel).toBe(2);

      const legendaryResult = forge.merge([
        epic2Result.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { mergeLevel: 2 }),
      ]);
      expect(legendaryResult.isOk()).toBe(true);
      expect(legendaryResult.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(legendaryResult.data!.result.mergeLevel).toBe(0);

      const leg1Result = forge.merge([
        legendaryResult.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY),
      ]);
      expect(leg1Result.isOk()).toBe(true);
      expect(leg1Result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(leg1Result.data!.result.mergeLevel).toBe(1);

      const leg2Result = forge.merge([
        leg1Result.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 1 }),
      ]);
      expect(leg2Result.isOk()).toBe(true);
      expect(leg2Result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(leg2Result.data!.result.mergeLevel).toBe(2);

      const mythicResult = forge.merge([
        leg2Result.data!.result,
        makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY, { mergeLevel: 2 }),
      ]);
      expect(mythicResult.isOk()).toBe(true);
      expect(mythicResult.data!.result.grade).toBe(EquipmentGrade.MYTHIC);
      expect(mythicResult.data!.result.mergeLevel).toBe(0);
    });
  });
});
