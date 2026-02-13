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
  claimed: boolean;
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
    if (!mission || mission.current < mission.target || mission.claimed) return null;
    mission.claimed = true;
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

function makeMission(id: string, description: string, target: number, type: ResourceType, amount: number): EventMission {
  return {
    id, description, target, current: 0, claimed: false,
    reward: Reward.fromResources({ type, amount }),
  };
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
      '일일 퀘스트',
      EventType.MISSION,
      now,
      endOfDay.getTime(),
      [
        makeMission('daily_chapter', '챕터 3회 클리어', 3, ResourceType.GEMS, 30),
        makeMission('daily_dungeon', '던전 3회 완료', 3, ResourceType.GOLD, 500),
        makeMission('daily_tower', '탑 2회 도전', 2, ResourceType.EQUIPMENT_STONE, 3),
        makeMission('daily_arena', '아레나 1회 전투', 1, ResourceType.GEMS, 20),
        makeMission('daily_travel', '여행 5회', 5, ResourceType.GOLD, 300),
      ],
    );

    this.addEvent(event);
    return event;
  }

  createWeeklyQuests(): GameEvent {
    const now = Date.now();
    const endOfWeek = new Date();
    const daysUntilSunday = 7 - endOfWeek.getDay();
    endOfWeek.setDate(endOfWeek.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    endOfWeek.setHours(23, 59, 59, 999);

    const event = new GameEvent(
      `weekly_${now}`,
      '주간 퀘스트',
      EventType.MISSION,
      now,
      endOfWeek.getTime(),
      [
        makeMission('weekly_chapter', '챕터 15회 클리어', 15, ResourceType.GEMS, 150),
        makeMission('weekly_gacha', '장비 뽑기 20회', 20, ResourceType.EQUIPMENT_STONE, 10),
        makeMission('weekly_sell', '장비 판매 10회', 10, ResourceType.GOLD, 2000),
        makeMission('weekly_tower', '탑 10회 도전', 10, ResourceType.POWER_STONE, 3),
      ],
    );

    this.addEvent(event);
    return event;
  }

  hasActiveWeeklyQuest(): boolean {
    return this.events.some(e => e.id.startsWith('weekly_') && e.isActive());
  }
}
