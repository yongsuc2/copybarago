import { GameManager } from './GameManager';
import { Equipment } from '../domain/entities/Equipment';
import type { UniqueEffect } from '../domain/entities/Equipment';
import { Pet } from '../domain/entities/Pet';
import { Resources } from '../domain/entities/Resources';
import { Stats } from '../domain/value-objects/Stats';
import { Reward } from '../domain/value-objects/Reward';
import { GameEvent, EventType } from '../domain/meta/GameEvent';
import type { EventMission } from '../domain/meta/GameEvent';
import {
  SlotType, EquipmentGrade, PetTier, PetGrade,
  ArenaTier, DungeonType, HeritageRoute, ResourceType, WeaponSubType,
} from '../domain/enums/index';

interface EquipmentData {
  id: string;
  name: string;
  slot: SlotType;
  grade: EquipmentGrade;
  isS: boolean;
  level: number;
  upgradeCount?: number;
  promoteCount: number;
  uniqueEffect: { description: string; statBonus: { hp: number; maxHp: number; atk: number; def: number; crit: number } } | null;
  weaponSubType?: WeaponSubType | null;
  mergeLevel?: number;
  subStats?: { stat: string; value: number }[];
}

interface PetData {
  id: string;
  name: string;
  tier: PetTier;
  grade: PetGrade;
  level: number;
  basePassiveBonus: { hp: number; maxHp: number; atk: number; def: number; crit: number };
  exp: number;
}

interface RewardData {
  resources: { type: ResourceType; amount: number }[];
  equipmentIds: string[];
  skillIds: string[];
  petIds: string[];
}

interface MissionData {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: RewardData;
  claimed: boolean;
}

interface EventData {
  id: string;
  name: string;
  type: EventType;
  startTime: number;
  endTime: number;
  missions: MissionData[];
}

export interface SaveState {
  player: {
    talent: { atkLevel: number; hpLevel: number; defLevel: number };
    heritage: { route: HeritageRoute; level: number };
    resources: Record<string, number>;
    equipmentSlots: Record<string, (EquipmentData | null)[]>;
    slotLevels?: Record<string, number[]>;
    slotPromoteCounts?: Record<string, number[]>;
    inventory: EquipmentData[];
    activePetId: string | null;
    ownedPets: PetData[];
    clearedChapterMax: number;
    bestSurvivalDays: Record<string, number>;
    claimedMilestones: string[];
  };
  tower: { currentFloor: number; currentStage: number };
  catacomb: { highestFloor: number };
  dungeons: { todayCount: number; clearedStages: Record<string, number> } | Record<string, number>;
  arena: { tier: ArenaTier; points: number; todayEntries: number };
  travel: { maxClearedChapter: number; multiplier: number };
  goblinMiner: { oreCount: number };
  equipmentChest: { pityCount: number };
  collection: string[];
  dailyReset: { lastResetDate: string };
  events: EventData[];
  attendance?: {
    checkedDays: boolean[];
    cycleStartDate: string;
    lastCheckDate: string;
  };
}

function serializeEquipment(eq: Equipment): EquipmentData {
  return {
    id: eq.id,
    name: eq.name,
    slot: eq.slot,
    grade: eq.grade,
    isS: eq.isS,
    level: eq.level,
    promoteCount: eq.promoteCount,
    uniqueEffect: eq.uniqueEffect ? {
      description: eq.uniqueEffect.description,
      statBonus: {
        hp: eq.uniqueEffect.statBonus.hp,
        maxHp: eq.uniqueEffect.statBonus.maxHp,
        atk: eq.uniqueEffect.statBonus.atk,
        def: eq.uniqueEffect.statBonus.def,
        crit: eq.uniqueEffect.statBonus.crit,
      },
    } : null,
    weaponSubType: eq.weaponSubType,
    mergeLevel: eq.mergeLevel,
    subStats: eq.subStats,
  };
}

function migrateWeaponSubType(data: EquipmentData): WeaponSubType | null {
  if (data.slot !== SlotType.WEAPON) return null;
  if (data.weaponSubType) return data.weaponSubType;
  const WEAPON_SUB_TYPES = [WeaponSubType.SWORD, WeaponSubType.STAFF, WeaponSubType.BOW];
  let hash = 0;
  for (let i = 0; i < data.id.length; i++) {
    hash = ((hash << 5) - hash + data.id.charCodeAt(i)) | 0;
  }
  return WEAPON_SUB_TYPES[Math.abs(hash) % 3];
}

function deserializeEquipment(data: EquipmentData): Equipment {
  let uniqueEffect: UniqueEffect | null = null;
  if (data.uniqueEffect) {
    uniqueEffect = {
      description: data.uniqueEffect.description,
      statBonus: Stats.create(data.uniqueEffect.statBonus),
    };
  }
  const weaponSubType = migrateWeaponSubType(data);
  return new Equipment(
    data.id, data.name, data.slot, data.grade, data.isS,
    data.level, data.promoteCount, uniqueEffect,
    weaponSubType, data.mergeLevel ?? 0,
    data.subStats ?? [],
  );
}

function serializePet(pet: Pet): PetData {
  return {
    id: pet.id,
    name: pet.name,
    tier: pet.tier,
    grade: pet.grade,
    level: pet.level,
    basePassiveBonus: {
      hp: pet.basePassiveBonus.hp,
      maxHp: pet.basePassiveBonus.maxHp,
      atk: pet.basePassiveBonus.atk,
      def: pet.basePassiveBonus.def,
      crit: pet.basePassiveBonus.crit,
    },
    exp: pet.exp,
  };
}

function deserializePet(data: PetData): Pet {
  return new Pet(
    data.id, data.name, data.tier, data.grade, data.level,
    Stats.create(data.basePassiveBonus), data.exp,
  );
}

function serializeReward(reward: Reward): RewardData {
  return {
    resources: reward.resources.map(r => ({ type: r.type, amount: r.amount })),
    equipmentIds: reward.equipmentIds,
    skillIds: reward.skillIds,
    petIds: reward.petIds,
  };
}

function deserializeReward(data: RewardData): Reward {
  return new Reward(data.resources, data.equipmentIds, data.skillIds, data.petIds);
}

function migrateAccessoryToNecklace(
  slots: Record<string, (EquipmentData | null)[]>,
): Record<string, (EquipmentData | null)[]> {
  if (!slots['ACCESSORY']) return slots;
  const result = { ...slots };
  const accessoryItems = result['ACCESSORY'];
  delete result['ACCESSORY'];
  if (!result['NECKLACE']) {
    result['NECKLACE'] = accessoryItems.map(eq => {
      if (eq) eq.slot = SlotType.NECKLACE;
      return eq;
    });
  }
  return result;
}

export class SaveSerializer {
  static serialize(game: GameManager): SaveState {
    const player = game.player;

    const equipmentSlots: Record<string, (EquipmentData | null)[]> = {};
    const slotLevels: Record<string, number[]> = {};
    const slotPromoteCounts: Record<string, number[]> = {};
    for (const [slotType, slot] of player.equipmentSlots.entries()) {
      equipmentSlots[slotType] = slot.equipped.map(eq => eq ? serializeEquipment(eq) : null);
      slotLevels[slotType] = [...slot.slotLevels];
      slotPromoteCounts[slotType] = [...slot.slotPromoteCounts];
    }

    const clearedStages: Record<string, number> = {};
    for (const [type, dungeon] of game.dungeonManager.dungeons.entries()) {
      clearedStages[type] = dungeon.clearedStage;
    }
    const dungeons = { todayCount: game.dungeonManager.todayCount, clearedStages };

    const collectionIds: string[] = [];
    for (const entry of game.collection.entries.values()) {
      if (entry.acquired) collectionIds.push(entry.id);
    }

    const events: EventData[] = game.eventManager.events.map(event => ({
      id: event.id,
      name: event.name,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      missions: event.missions.map(m => ({
        id: m.id,
        description: m.description,
        target: m.target,
        current: m.current,
        reward: serializeReward(m.reward),
        claimed: m.claimed,
      })),
    }));

    return {
      player: {
        talent: {
          atkLevel: player.talent.atkLevel,
          hpLevel: player.talent.hpLevel,
          defLevel: player.talent.defLevel,
        },
        heritage: {
          route: player.heritage.route,
          level: player.heritage.level,
        },
        resources: player.resources.toJSON(),
        equipmentSlots,
        slotLevels,
        slotPromoteCounts,
        inventory: player.inventory.map(serializeEquipment),
        activePetId: player.activePet?.id ?? null,
        ownedPets: player.ownedPets.map(serializePet),
        clearedChapterMax: player.clearedChapterMax,
        bestSurvivalDays: Object.fromEntries(player.bestSurvivalDays),
        claimedMilestones: [...player.claimedMilestones],
      },
      tower: {
        currentFloor: game.tower.currentFloor,
        currentStage: game.tower.currentStage,
      },
      catacomb: { highestFloor: game.catacomb.highestFloor },
      dungeons,
      arena: {
        tier: game.arena.tier,
        points: game.arena.points,
        todayEntries: game.arena.todayEntries,
      },
      travel: {
        maxClearedChapter: game.travel.maxClearedChapter,
        multiplier: game.travel.multiplier,
      },
      goblinMiner: { oreCount: game.goblinMiner.oreCount },
      equipmentChest: { pityCount: game.equipmentChest.pityCount },
      collection: collectionIds,
      dailyReset: { lastResetDate: game.dailyReset.getLastResetDate() },
      events,
      attendance: {
        checkedDays: [...game.attendance.checkedDays],
        cycleStartDate: game.attendance.cycleStartDate,
        lastCheckDate: game.attendance.lastCheckDate,
      },
    };
  }

  static deserialize(data: SaveState, game: GameManager): void {
    const player = game.player;

    player.talent.atkLevel = data.player.talent.atkLevel;
    player.talent.hpLevel = data.player.talent.hpLevel;
    player.talent.defLevel = data.player.talent.defLevel;

    player.heritage.route = data.player.heritage.route;
    player.heritage.level = data.player.heritage.level;

    player.resources = Resources.fromJSON(data.player.resources);

    const migratedSlots = migrateAccessoryToNecklace(data.player.equipmentSlots);
    for (const [slotTypeStr, equippedArr] of Object.entries(migratedSlots)) {
      const slotType = slotTypeStr as SlotType;
      const slot = player.equipmentSlots.get(slotType);
      if (!slot) continue;
      for (let i = 0; i < equippedArr.length && i < slot.maxCount; i++) {
        const eqData = equippedArr[i];
        slot.equipped[i] = eqData ? deserializeEquipment(eqData) : null;
      }
      if (data.player.slotLevels?.[slotTypeStr]) {
        const levels = data.player.slotLevels[slotTypeStr];
        for (let i = 0; i < levels.length && i < slot.maxCount; i++) {
          slot.slotLevels[i] = levels[i];
        }
      }
      if (data.player.slotPromoteCounts?.[slotTypeStr]) {
        const counts = data.player.slotPromoteCounts[slotTypeStr];
        for (let i = 0; i < counts.length && i < slot.maxCount; i++) {
          slot.slotPromoteCounts[i] = counts[i];
        }
      }
      if (!data.player.slotLevels) {
        slot.initFromEquipped();
      }
    }

    player.inventory = data.player.inventory.map(eqData => {
      if ((eqData.slot as string) === 'ACCESSORY') {
        eqData.slot = SlotType.NECKLACE;
      }
      return deserializeEquipment(eqData);
    });

    player.ownedPets = data.player.ownedPets.map(deserializePet);
    if (data.player.activePetId) {
      player.activePet = player.ownedPets.find(p => p.id === data.player.activePetId) ?? null;
    } else {
      player.activePet = null;
    }

    player.clearedChapterMax = data.player.clearedChapterMax;

    player.bestSurvivalDays = new Map(
      Object.entries(data.player.bestSurvivalDays ?? {}).map(([k, v]) => [Number(k), v]),
    );
    player.claimedMilestones = new Set(data.player.claimedMilestones ?? []);

    game.tower.currentFloor = data.tower.currentFloor;
    game.tower.currentStage = data.tower.currentStage;

    game.catacomb.highestFloor = data.catacomb.highestFloor;

    if (data.dungeons && 'todayCount' in data.dungeons) {
      const d = data.dungeons as { todayCount: number; clearedStages: Record<string, number> };
      game.dungeonManager.todayCount = d.todayCount;
      for (const [typeStr, stage] of Object.entries(d.clearedStages)) {
        const dungeon = game.dungeonManager.dungeons.get(typeStr as DungeonType);
        if (dungeon) dungeon.clearedStage = stage;
      }
    } else if (data.dungeons) {
      const old = data.dungeons as Record<string, number>;
      game.dungeonManager.todayCount = Math.min(
        Object.values(old).reduce((s, v) => s + v, 0),
        game.dungeonManager.dailyLimit,
      );
    }

    game.arena.tier = data.arena.tier;
    game.arena.points = data.arena.points;
    game.arena.todayEntries = data.arena.todayEntries;

    game.travel.maxClearedChapter = data.travel.maxClearedChapter;
    game.travel.multiplier = data.travel.multiplier;

    game.goblinMiner.oreCount = data.goblinMiner.oreCount;
    const chestData = data.equipmentChest ?? (data as any).goldChest;
    if (chestData) game.equipmentChest.pityCount = chestData.pityCount;

    for (const id of data.collection) {
      game.collection.acquire(id);
    }

    game.dailyReset.setLastResetDate(data.dailyReset.lastResetDate);

    game.eventManager.events = data.events.map(eventData => {
      const missions: EventMission[] = eventData.missions.map(m => ({
        id: m.id,
        description: m.description,
        target: m.target,
        current: m.current,
        reward: deserializeReward(m.reward),
        claimed: m.claimed,
      }));
      return new GameEvent(
        eventData.id, eventData.name, eventData.type,
        eventData.startTime, eventData.endTime, missions,
      );
    });

    if (data.attendance) {
      game.attendance.checkedDays = [...data.attendance.checkedDays];
      game.attendance.cycleStartDate = data.attendance.cycleStartDate;
      game.attendance.lastCheckDate = data.attendance.lastCheckDate;
    }
  }
}
