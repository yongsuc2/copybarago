import { describe, it, expect } from 'vitest';
import { Forge } from '../../services/Forge';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentGrade, SlotType } from '../../domain/enums';

function makeEquipment(
  slot: SlotType,
  grade: EquipmentGrade,
  overrides: { isS?: boolean; level?: number; upgradeCount?: number; promoteCount?: number } = {},
): Equipment {
  return new Equipment(
    `eq_${Math.random().toString(36).slice(2)}`,
    `${grade} ${slot}`,
    slot,
    grade,
    overrides.isS ?? false,
    overrides.level ?? 0,
    overrides.upgradeCount ?? 0,
    overrides.promoteCount ?? 0,
  );
}

function makeMany(
  count: number,
  slot: SlotType,
  grade: EquipmentGrade,
  overrides: { isS?: boolean; upgradeCount?: number; level?: number } = {},
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

    it('returns true for 2 EPIC same slot', () => {
      expect(forge.canMerge(makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC))).toBe(true);
    });

    it('returns true for 2 LEGENDARY same slot', () => {
      expect(forge.canMerge(makeMany(2, SlotType.NECKLACE, EquipmentGrade.LEGENDARY))).toBe(true);
    });

    it('returns false for MYTHIC (no merge)', () => {
      expect(forge.canMerge(makeMany(3, SlotType.WEAPON, EquipmentGrade.MYTHIC))).toBe(false);
    });

    it('returns true with excess items (4 COMMON)', () => {
      expect(forge.canMerge(makeMany(4, SlotType.WEAPON, EquipmentGrade.COMMON))).toBe(true);
    });
  });

  describe('merge - basic grade progression', () => {
    it('COMMON x3 → UNCOMMON', () => {
      const items = makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.UNCOMMON);
      expect(result.data!.result.upgradeCount).toBe(0);
    });

    it('UNCOMMON x3 → RARE', () => {
      const items = makeMany(3, SlotType.ARMOR, EquipmentGrade.UNCOMMON);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.RARE);
      expect(result.data!.result.upgradeCount).toBe(0);
    });

    it('RARE x3 → EPIC (upgradeCount 0)', () => {
      const items = makeMany(3, SlotType.RING, EquipmentGrade.RARE);
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.upgradeCount).toBe(0);
    });
  });

  describe('merge - EPIC+ upgradeCount system', () => {
    it('EPIC+0 x2 → EPIC+1', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 0 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.upgradeCount).toBe(1);
    });

    it('EPIC+1 x2 → EPIC+2', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 1 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.upgradeCount).toBe(2);
    });

    it('EPIC+2 x2 → EPIC+3', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 2 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.upgradeCount).toBe(3);
    });

    it('EPIC+3 x2 → LEGENDARY+0 (grade up)', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 3 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.upgradeCount).toBe(0);
    });

    it('LEGENDARY+0 x2 → LEGENDARY+1', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 0 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.upgradeCount).toBe(1);
    });

    it('LEGENDARY+1 x2 → LEGENDARY+2', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 1 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.upgradeCount).toBe(2);
    });

    it('LEGENDARY+2 x2 → LEGENDARY+3', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 2 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(result.data!.result.upgradeCount).toBe(3);
    });

    it('LEGENDARY+3 x2 → MYTHIC+0 (grade up)', () => {
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 3 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.MYTHIC);
      expect(result.data!.result.upgradeCount).toBe(0);
    });

    it('works with all slot types (NECKLACE EPIC+0 x2 → EPIC+1)', () => {
      const items = makeMany(2, SlotType.NECKLACE, EquipmentGrade.EPIC, { upgradeCount: 0 });
      const result = forge.merge(items);
      expect(result.isOk()).toBe(true);
      expect(result.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(result.data!.result.upgradeCount).toBe(1);
      expect(result.data!.result.slot).toBe(SlotType.NECKLACE);
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
      const items = makeMany(2, SlotType.WEAPON, EquipmentGrade.MYTHIC);
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

    it('EPIC+ groups by upgradeCount separately', () => {
      const inventory = [
        ...makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 0 }),
        ...makeMany(2, SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 1 }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(2);
      candidates.forEach(group => {
        const uc = group[0].upgradeCount;
        expect(group.every(eq => eq.upgradeCount === uc)).toBe(true);
      });
    });

    it('EPIC+ with insufficient per upgradeCount returns empty', () => {
      const inventory = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 0 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 1 }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(0);
    });

    it('LEGENDARY groups by upgradeCount', () => {
      const inventory = makeMany(2, SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 2 });
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(2);
    });

    it('below-EPIC grades ignore upgradeCount for grouping', () => {
      const inventory = [
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { upgradeCount: 0 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { upgradeCount: 1 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { upgradeCount: 0 }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      expect(candidates.length).toBe(1);
      expect(candidates[0].length).toBe(3);
    });

    it('mixed scenario: multiple slots, grades, upgradeCount', () => {
      const inventory = [
        ...makeMany(3, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(2, SlotType.WEAPON, EquipmentGrade.COMMON),
        ...makeMany(3, SlotType.ARMOR, EquipmentGrade.RARE),
        ...makeMany(2, SlotType.RING, EquipmentGrade.EPIC, { upgradeCount: 0 }),
        ...makeMany(2, SlotType.RING, EquipmentGrade.EPIC, { upgradeCount: 1 }),
        makeEquipment(SlotType.RING, EquipmentGrade.EPIC, { upgradeCount: 2 }),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.MYTHIC),
        makeEquipment(SlotType.WEAPON, EquipmentGrade.COMMON, { isS: true }),
      ];
      const candidates = forge.findMergeCandidates(inventory);
      const totalGroups = candidates.length;
      expect(totalGroups).toBe(4);
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
    it('COMMON → UNCOMMON → RARE → EPIC progression', () => {
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
      expect(epicResult.data!.result.upgradeCount).toBe(0);
    });

    it('EPIC+0 → EPIC+1 → EPIC+2 → EPIC+3 → LEGENDARY+0 full chain', () => {
      const epic0a = makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 0 });
      const epic0b = makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 0 });
      const r1 = forge.merge([epic0a, epic0b]);
      expect(r1.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(r1.data!.result.upgradeCount).toBe(1);

      const epic1a = r1.data!.result;
      const epic1b = makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 1 });
      const r2 = forge.merge([epic1a, epic1b]);
      expect(r2.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(r2.data!.result.upgradeCount).toBe(2);

      const epic2a = r2.data!.result;
      const epic2b = makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 2 });
      const r3 = forge.merge([epic2a, epic2b]);
      expect(r3.data!.result.grade).toBe(EquipmentGrade.EPIC);
      expect(r3.data!.result.upgradeCount).toBe(3);

      const epic3a = r3.data!.result;
      const epic3b = makeEquipment(SlotType.WEAPON, EquipmentGrade.EPIC, { upgradeCount: 3 });
      const r4 = forge.merge([epic3a, epic3b]);
      expect(r4.data!.result.grade).toBe(EquipmentGrade.LEGENDARY);
      expect(r4.data!.result.upgradeCount).toBe(0);
    });

    it('LEGENDARY+0 through LEGENDARY+3 → MYTHIC full chain', () => {
      let current = makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 0 });

      for (let uc = 0; uc < 3; uc++) {
        const pair = makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: uc });
        const result = forge.merge([current, pair]);
        expect(result.isOk()).toBe(true);
        current = result.data!.result;
        expect(current.grade).toBe(EquipmentGrade.LEGENDARY);
        expect(current.upgradeCount).toBe(uc + 1);
      }

      const finalPair = makeEquipment(SlotType.WEAPON, EquipmentGrade.LEGENDARY, { upgradeCount: 3 });
      const finalResult = forge.merge([current, finalPair]);
      expect(finalResult.isOk()).toBe(true);
      expect(finalResult.data!.result.grade).toBe(EquipmentGrade.MYTHIC);
      expect(finalResult.data!.result.upgradeCount).toBe(0);
    });
  });
});
