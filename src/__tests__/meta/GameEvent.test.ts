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
      { id: 'm1', description: 'Do something', target: 5, current: 0, reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 100 }) },
    ]);

    event.updateMissionProgress('m1', 3);
    expect(event.isMissionCompleted('m1')).toBe(false);

    event.updateMissionProgress('m1', 3);
    expect(event.isMissionCompleted('m1')).toBe(true);
  });

  it('claims mission reward only when completed', () => {
    const now = Date.now();
    const event = new GameEvent('e1', 'Test', EventType.MISSION, now, now + 10000, [
      { id: 'm1', description: 'Do something', target: 3, current: 0, reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 100 }) },
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
      { id: 'm1', description: 'A', target: 1, current: 1, reward: Reward.empty() },
      { id: 'm2', description: 'B', target: 1, current: 0, reward: Reward.empty() },
    ]);

    expect(event.getProgress()).toBeCloseTo(0.5);
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

  it('cleans up expired events', () => {
    const manager = new EventManager();
    const now = Date.now();

    manager.addEvent(new GameEvent('old', 'Old', EventType.MISSION, now - 10000, now - 1000));
    manager.addEvent(new GameEvent('active', 'Active', EventType.MISSION, now, now + 10000));

    manager.cleanupExpired(now);
    expect(manager.events.length).toBe(1);
  });
});
