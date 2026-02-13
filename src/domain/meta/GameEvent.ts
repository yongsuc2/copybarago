import { ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';

export enum EventType {
  COLLECTION = 'COLLECTION',
  MISSION = 'MISSION',
  LIMITED_GACHA = 'LIMITED_GACHA',
}

export interface EventMission {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: Reward;
}

export class GameEvent {
  id: string;
  name: string;
  type: EventType;
  startTime: number;
  endTime: number;
  missions: EventMission[];

  constructor(
    id: string,
    name: string,
    type: EventType,
    startTime: number,
    endTime: number,
    missions: EventMission[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.startTime = startTime;
    this.endTime = endTime;
    this.missions = missions;
  }

  isActive(now: number = Date.now()): boolean {
    return now >= this.startTime && now <= this.endTime;
  }

  updateMissionProgress(missionId: string, amount: number): boolean {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;
    mission.current = Math.min(mission.current + amount, mission.target);
    return true;
  }

  isMissionCompleted(missionId: string): boolean {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;
    return mission.current >= mission.target;
  }

  claimMissionReward(missionId: string): Reward | null {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || mission.current < mission.target) return null;
    return mission.reward;
  }

  getProgress(): number {
    if (this.missions.length === 0) return 0;
    const completed = this.missions.filter(m => m.current >= m.target).length;
    return completed / this.missions.length;
  }

  getCompletedMissionCount(): number {
    return this.missions.filter(m => m.current >= m.target).length;
  }
}

export class EventManager {
  events: GameEvent[];

  constructor() {
    this.events = [];
  }

  addEvent(event: GameEvent): void {
    this.events.push(event);
  }

  removeEvent(id: string): void {
    this.events = this.events.filter(e => e.id !== id);
  }

  getActiveEvents(now: number = Date.now()): GameEvent[] {
    return this.events.filter(e => e.isActive(now));
  }

  getEvent(id: string): GameEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  cleanupExpired(now: number = Date.now()): void {
    this.events = this.events.filter(e => now <= e.endTime);
  }

  createDailyQuests(): GameEvent {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const event = new GameEvent(
      `daily_${now}`,
      'Daily Quests',
      EventType.MISSION,
      now,
      endOfDay.getTime(),
      [
        {
          id: 'daily_chapter', description: 'Clear 3 chapters', target: 3, current: 0,
          reward: Reward.fromResources({ type: ResourceType.GEMS, amount: 30 }),
        },
        {
          id: 'daily_dungeon', description: 'Complete 3 dungeons', target: 3, current: 0,
          reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 500 }),
        },
        {
          id: 'daily_tower', description: 'Challenge tower 2 times', target: 2, current: 0,
          reward: Reward.fromResources({ type: ResourceType.EQUIPMENT_STONE, amount: 3 }),
        },
        {
          id: 'daily_arena', description: 'Fight in arena 1 time', target: 1, current: 0,
          reward: Reward.fromResources({ type: ResourceType.GEMS, amount: 20 }),
        },
        {
          id: 'daily_travel', description: 'Travel 5 times', target: 5, current: 0,
          reward: Reward.fromResources({ type: ResourceType.GOLD, amount: 300 }),
        },
      ],
    );

    this.addEvent(event);
    return event;
  }
}
