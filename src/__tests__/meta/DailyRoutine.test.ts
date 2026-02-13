import { describe, it, expect } from 'vitest';
import { DailyRoutineScheduler, RoutineAction } from '../../domain/meta/DailyRoutineScheduler';

describe('DailyRoutineScheduler', () => {
  const scheduler = new DailyRoutineScheduler();

  it('returns full routine of 9 steps', () => {
    const routine = scheduler.getFullRoutine();
    expect(routine.length).toBe(9);
  });

  it('first action is dragon nest dungeon', () => {
    const routine = scheduler.getFullRoutine();
    expect(routine[0].action).toBe(RoutineAction.DAILY_DUNGEON_DRAGON);
  });

  it('shows available actions based on context', () => {
    const statuses = scheduler.getAvailableActions({
      dungeonDragonRemaining: 3,
      dungeonCelestialRemaining: 0,
      dungeonSkyRemaining: 3,
      challengeTokens: 5,
      arenaTickets: 3,
      stamina: 50,
      pickaxes: 10,
    });

    const dragon = statuses.find(s => s.action === RoutineAction.DAILY_DUNGEON_DRAGON);
    expect(dragon?.available).toBe(true);

    const celestial = statuses.find(s => s.action === RoutineAction.DAILY_DUNGEON_CELESTIAL);
    expect(celestial?.available).toBe(false);
  });

  it('returns next available action', () => {
    const next = scheduler.getNextAction({
      dungeonDragonRemaining: 0,
      dungeonCelestialRemaining: 0,
      dungeonSkyRemaining: 0,
      challengeTokens: 5,
      arenaTickets: 0,
      stamina: 50,
      pickaxes: 10,
    });

    expect(next).toBe(RoutineAction.TOWER_CHALLENGE);
  });

  it('returns null when nothing available', () => {
    const next = scheduler.getNextAction({
      dungeonDragonRemaining: 0,
      dungeonCelestialRemaining: 0,
      dungeonSkyRemaining: 0,
      challengeTokens: 0,
      arenaTickets: 0,
      stamina: 0,
      pickaxes: 0,
    });

    expect(next).toBe(RoutineAction.CATACOMB_RUN);
  });
});
