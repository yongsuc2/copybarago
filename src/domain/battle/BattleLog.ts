export enum BattleLogType {
  ATTACK = 'ATTACK',
  SKILL_DAMAGE = 'SKILL_DAMAGE',
  COUNTER = 'COUNTER',
  HEAL = 'HEAL',
  LIFESTEAL = 'LIFESTEAL',
  DOT_DAMAGE = 'DOT_DAMAGE',
  HOT_HEAL = 'HOT_HEAL',
  BUFF_APPLIED = 'BUFF_APPLIED',
  DEBUFF_APPLIED = 'DEBUFF_APPLIED',
  REVIVE = 'REVIVE',
  CRIT = 'CRIT',
  DEATH = 'DEATH',
  TURN_START = 'TURN_START',
}

export interface BattleLogEntry {
  turn: number;
  type: BattleLogType;
  source: string;
  target: string;
  value: number;
  skillName?: string;
  skillIcon?: string;
  message: string;
}

export class BattleLog {
  entries: BattleLogEntry[] = [];

  add(entry: BattleLogEntry): void {
    this.entries.push(entry);
  }

  getEntriesForTurn(turn: number): BattleLogEntry[] {
    return this.entries.filter(e => e.turn === turn);
  }

  getLastEntries(count: number): BattleLogEntry[] {
    return this.entries.slice(-count);
  }

  clear(): void {
    this.entries = [];
  }
}
