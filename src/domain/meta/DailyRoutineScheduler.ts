import { ResourceType } from '../enums';

export enum RoutineAction {
  DAILY_DUNGEON_DRAGON = 'DAILY_DUNGEON_DRAGON',
  DAILY_DUNGEON_CELESTIAL = 'DAILY_DUNGEON_CELESTIAL',
  DAILY_DUNGEON_SKY = 'DAILY_DUNGEON_SKY',
  TOWER_CHALLENGE = 'TOWER_CHALLENGE',
  CATACOMB_RUN = 'CATACOMB_RUN',
  ARENA_FIGHT = 'ARENA_FIGHT',
  CHAPTER_PROGRESS = 'CHAPTER_PROGRESS',
  TRAVEL = 'TRAVEL',
  GOBLIN_MINE = 'GOBLIN_MINE',
}

export interface RoutineStep {
  action: RoutineAction;
  priority: number;
  description: string;
  requiredResource: ResourceType | null;
}

const DAILY_ROUTINE: RoutineStep[] = [
  { action: RoutineAction.DAILY_DUNGEON_DRAGON, priority: 1, description: 'Dragon Nest dungeon', requiredResource: null },
  { action: RoutineAction.DAILY_DUNGEON_CELESTIAL, priority: 2, description: 'Celestial Tree dungeon', requiredResource: null },
  { action: RoutineAction.DAILY_DUNGEON_SKY, priority: 3, description: 'Sky Island dungeon', requiredResource: null },
  { action: RoutineAction.TOWER_CHALLENGE, priority: 4, description: 'Tower challenge', requiredResource: ResourceType.CHALLENGE_TOKEN },
  { action: RoutineAction.CATACOMB_RUN, priority: 5, description: 'Catacomb dungeon run', requiredResource: null },
  { action: RoutineAction.ARENA_FIGHT, priority: 6, description: 'Arena PvP', requiredResource: ResourceType.ARENA_TICKET },
  { action: RoutineAction.CHAPTER_PROGRESS, priority: 7, description: 'Chapter progress', requiredResource: ResourceType.STAMINA },
  { action: RoutineAction.TRAVEL, priority: 8, description: 'Travel farming', requiredResource: ResourceType.STAMINA },
  { action: RoutineAction.GOBLIN_MINE, priority: 9, description: 'Goblin mining', requiredResource: ResourceType.PICKAXE },
];

export interface RoutineStatus {
  action: RoutineAction;
  available: boolean;
  reason: string;
}

export class DailyRoutineScheduler {
  getFullRoutine(): RoutineStep[] {
    return [...DAILY_ROUTINE];
  }

  getAvailableActions(context: {
    dungeonDragonRemaining: number;
    dungeonCelestialRemaining: number;
    dungeonSkyRemaining: number;
    challengeTokens: number;
    arenaTickets: number;
    stamina: number;
    pickaxes: number;
  }): RoutineStatus[] {
    return DAILY_ROUTINE.map(step => {
      let available = true;
      let reason = 'Ready';

      switch (step.action) {
        case RoutineAction.DAILY_DUNGEON_DRAGON:
          available = context.dungeonDragonRemaining > 0;
          reason = available ? 'Ready' : 'Daily limit reached';
          break;
        case RoutineAction.DAILY_DUNGEON_CELESTIAL:
          available = context.dungeonCelestialRemaining > 0;
          reason = available ? 'Ready' : 'Daily limit reached';
          break;
        case RoutineAction.DAILY_DUNGEON_SKY:
          available = context.dungeonSkyRemaining > 0;
          reason = available ? 'Ready' : 'Daily limit reached';
          break;
        case RoutineAction.TOWER_CHALLENGE:
          available = context.challengeTokens > 0;
          reason = available ? 'Ready' : 'No challenge tokens';
          break;
        case RoutineAction.ARENA_FIGHT:
          available = context.arenaTickets > 0;
          reason = available ? 'Ready' : 'No arena tickets';
          break;
        case RoutineAction.CHAPTER_PROGRESS:
          available = context.stamina >= 5;
          reason = available ? 'Ready' : 'Not enough stamina';
          break;
        case RoutineAction.TRAVEL:
          available = context.stamina > 0;
          reason = available ? 'Ready' : 'No stamina';
          break;
        case RoutineAction.GOBLIN_MINE:
          available = context.pickaxes > 0;
          reason = available ? 'Ready' : 'No pickaxes';
          break;
        case RoutineAction.CATACOMB_RUN:
          available = true;
          break;
      }

      return { action: step.action, available, reason };
    });
  }

  getNextAction(context: Parameters<typeof DailyRoutineScheduler.prototype.getAvailableActions>[0]): RoutineAction | null {
    const statuses = this.getAvailableActions(context);
    const available = statuses.find(s => s.available);
    return available?.action ?? null;
  }
}
