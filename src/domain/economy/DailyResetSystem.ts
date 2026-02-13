import { Resources } from '../entities/Resources';
import { DailyDungeonManager } from '../content/DailyDungeon';
import { Arena } from '../content/Arena';

export class DailyResetSystem {
  private lastResetDate: string;

  constructor() {
    this.lastResetDate = this.getTodayString();
  }

  needsReset(): boolean {
    return this.getTodayString() !== this.lastResetDate;
  }

  performReset(
    resources: Resources,
    dungeonManager: DailyDungeonManager,
    arena: Arena,
  ): void {
    resources.dailyReset();
    dungeonManager.dailyResetAll();
    arena.dailyReset();
    this.lastResetDate = this.getTodayString();
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }

  getLastResetDate(): string {
    return this.lastResetDate;
  }

  setLastResetDate(date: string): void {
    this.lastResetDate = date;
  }
}
