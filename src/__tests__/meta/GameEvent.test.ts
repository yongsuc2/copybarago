import { describe, it, expect } from 'vitest';
import { GameEvent, EventManager, EventType } from '../../domain/meta/GameEvent';
import { Reward } from '../../domain/value-objects/Reward';
import { ResourceType } from '../../domain/enums';

describe('GameEvent', () => {
  it('is active within time range', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now - 1000, now + 10000);
    expect(event.isActive(now)).toBe(true);
  });

  it('is not active outside time range', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now + 1000, now + 10000);
    expect(event.isActive(now)).toBe(false);
  });

  it('tracks mission progress', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'Do something', target: 5, current: 0, reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 100 }), claimed: false },
    ]);

    event.updateMissionProgress('m1', 3);
    expect(event.isMissionCompleted('m1')).toBe(false);

    event.updateMissionProgress('m1', 3);
    expect(event.isMissionCompleted('m1')).toBe(true);
  });

  it('claims mission reward only when completed', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'Do something', target: 3, current: 0, reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 100 }), claimed: false },
    ]);

    expect(event.claimMissionReward('m1')).toBeNull();

    event.updateMissionProgress('m1', 5);
    const reward = event.claimMissionReward('m1');
    expect(reward).not.toBeNull();
    expect(reward!.resources.length).toBeGreaterThan(0);
  });

  it('reports progress correctly', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'A', target: 1, current: 1, reward: Reward.empty(), claimed: false },
      { id: 'm2', description: 'B', target: 1, current: 0, reward: Reward.empty(), claimed: false },
    ]);

    expect(event.getProgress()).toBeCloseTo(0.5);
  });

  it('does not exceed target when overshoot', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'Test', target: 3, current: 0, reward: Reward.empty(), claimed: false },
    ]);

    event.updateMissionProgress('m1', 100);
    expect(event.missions[0].current).toBe(3);
  });

  it('cannot claim reward twice', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'Test', target: 1, current: 0, reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 50 }), claimed: false },
    ]);

    event.updateMissionProgress('m1', 1);
    expect(event.claimMissionReward('m1')).not.toBeNull();
    expect(event.claimMissionReward('m1')).toBeNull();
  });

  it('returns false when updating non-existent mission', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, []);
    expect(event.updateMissionProgress('nonexistent', 1)).toBe(false);
  });
});

describe('EventManager', () => {
  it('manages active events', () => {
    const manager = new EventManager();
    const now = Date.now();

    manager.addEvent(new GameEvent('active', 'Active', EventType.MISSION, now - 1000, now + 10000));
    manager.addEvent(new GameEvent('expired', 'Expired', EventType.MISSION, now - 10000, now - 1000));

    expect(manager.getActiveEvents(now).length).toBe(1);
  });

  it('creates daily quests', () => {
    const manager = new EventManager();
    const event = manager.createDailyQuests();

    expect(event.missions.length).toBe(5);
    expect(event.isActive()).toBe(true);
  });

  it('creates weekly quests', () => {
    const manager = new EventManager();
    const event = manager.createWeeklyQuests();

    expect(event.missions.length).toBe(4);
    expect(event.isActive()).toBe(true);
  });

  it('cleans up expired events', () => {
    const manager = new EventManager();
    const now = Date.now();

    manager.addEvent(new GameEvent('old', 'Old', EventType.MISSION, now - 10000, now - 1000));
    manager.addEvent(new GameEvent('active', 'Active', EventType.MISSION, now, now + 10000));

    manager.cleanupExpired(now);
    expect(manager.events.length).toBe(1);
  });
});

const DAILY_MISSION_IDS = [
  'daily_chapter',
  'daily_dungeon',
  'daily_tower',
  'daily_arena',
  'daily_travel',
];

const WEEKLY_MISSION_IDS = [
  'weekly_chapter',
  'weekly_gacha',
  'weekly_sell',
  'weekly_tower',
];

describe('퀘스트 미션 ID 일관성', () => {
  it('일일 퀘스트에 필수 미션 ID가 모두 존재한다', () => {
    const manager = new EventManager();
    const event = manager.createDailyQuests();
    const missionIds = event.missions.map(m => m.id);

    for (const id of DAILY_MISSION_IDS) {
      expect(missionIds).toContain(id);
    }
  });

  it('주간 퀘스트에 필수 미션 ID가 모두 존재한다', () => {
    const manager = new EventManager();
    const event = manager.createWeeklyQuests();
    const missionIds = event.missions.map(m => m.id);

    for (const id of WEEKLY_MISSION_IDS) {
      expect(missionIds).toContain(id);
    }
  });

  it('일일 퀘스트의 모든 미션이 target > 0 이고 보상이 있다', () => {
    const manager = new EventManager();
    const event = manager.createDailyQuests();

    for (const mission of event.missions) {
      expect(mission.target).toBeGreaterThan(0);
      expect(mission.reward.resources.length).toBeGreaterThan(0);
      expect(mission.current).toBe(0);
      expect(mission.claimed).toBe(false);
    }
  });

  it('주간 퀘스트의 모든 미션이 target > 0 이고 보상이 있다', () => {
    const manager = new EventManager();
    const event = manager.createWeeklyQuests();

    for (const mission of event.missions) {
      expect(mission.target).toBeGreaterThan(0);
      expect(mission.reward.resources.length).toBeGreaterThan(0);
      expect(mission.current).toBe(0);
      expect(mission.claimed).toBe(false);
    }
  });
});

describe('퀘스트 진행도 통합 테스트', () => {
  it('일일 챕터 퀘스트: 3회 클리어 시 완료된다', () => {
    const manager = new EventManager();
    const event = manager.createDailyQuests();

    for (const active of manager.getActiveEvents()) {
      active.updateMissionProgress('daily_chapter', 1);
    }
    expect(event.isMissionCompleted('daily_chapter')).toBe(false);

    for (const active of manager.getActiveEvents()) {
      active.updateMissionProgress('daily_chapter', 1);
    }
    for (const active of manager.getActiveEvents()) {
      active.updateMissionProgress('daily_chapter', 1);
    }

    expect(event.isMissionCompleted('daily_chapter')).toBe(true);
  });

  it('주간 챕터 퀘스트: 15회 클리어 시 완료된다', () => {
    const manager = new EventManager();
    const event = manager.createWeeklyQuests();

    for (let i = 0; i < 15; i++) {
      for (const active of manager.getActiveEvents()) {
        active.updateMissionProgress('weekly_chapter', 1);
      }
    }

    expect(event.isMissionCompleted('weekly_chapter')).toBe(true);
  });

  it('일일+주간 퀘스트가 동시에 존재할 때 양쪽 모두 진행된다', () => {
    const manager = new EventManager();
    const daily = manager.createDailyQuests();
    const weekly = manager.createWeeklyQuests();

    for (const active of manager.getActiveEvents()) {
      active.updateMissionProgress('daily_chapter', 1);
      active.updateMissionProgress('weekly_chapter', 1);
    }

    expect(daily.missions.find(m => m.id === 'daily_chapter')!.current).toBe(1);
    expect(weekly.missions.find(m => m.id === 'weekly_chapter')!.current).toBe(1);
  });

  it('챕터 클리어 시 daily_chapter와 weekly_chapter가 동시에 진행된다', () => {
    const manager = new EventManager();
    const daily = manager.createDailyQuests();
    const weekly = manager.createWeeklyQuests();

    for (const active of manager.getActiveEvents()) {
      active.updateMissionProgress('daily_chapter', 1);
      active.updateMissionProgress('weekly_chapter', 1);
    }

    const dailyMission = daily.missions.find(m => m.id === 'daily_chapter')!;
    const weeklyMission = weekly.missions.find(m => m.id === 'weekly_chapter')!;

    expect(dailyMission.current).toBe(1);
    expect(weeklyMission.current).toBe(1);
  });

  it('전체 미션 완료 후 모든 보상을 수령할 수 있다', () => {
    const manager = new EventManager();
    const event = manager.createDailyQuests();

    for (const mission of event.missions) {
      event.updateMissionProgress(mission.id, mission.target);
    }

    for (const mission of event.missions) {
      expect(event.isMissionCompleted(mission.id)).toBe(true);
      const reward = event.claimMissionReward(mission.id);
      expect(reward).not.toBeNull();
    }

    expect(event.getProgress()).toBe(1);
    expect(event.getCompletedMissionCount()).toBe(event.missions.length);
  });
});
