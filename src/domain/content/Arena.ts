import { ArenaTier, BattleState, ResourceType } from '../enums';
import { BattleUnit } from '../battle/BattleUnit';
import { Battle } from '../battle/Battle';
import { Stats } from '../value-objects/Stats';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';
import { SeededRandom } from '../../infrastructure/SeededRandom';

const TIER_ORDER: ArenaTier[] = [
  ArenaTier.BRONZE, ArenaTier.SILVER, ArenaTier.GOLD,
  ArenaTier.PLATINUM, ArenaTier.DIAMOND, ArenaTier.MASTER,
];

const TIER_STAT_RANGE: Record<ArenaTier, { minAtk: number; maxAtk: number; minHp: number; maxHp: number; def: number }> = {
  [ArenaTier.BRONZE]: { minAtk: 10, maxAtk: 20, minHp: 80, maxHp: 150, def: 3 },
  [ArenaTier.SILVER]: { minAtk: 20, maxAtk: 40, minHp: 150, maxHp: 300, def: 6 },
  [ArenaTier.GOLD]: { minAtk: 40, maxAtk: 70, minHp: 300, maxHp: 500, def: 10 },
  [ArenaTier.PLATINUM]: { minAtk: 70, maxAtk: 120, minHp: 500, maxHp: 800, def: 15 },
  [ArenaTier.DIAMOND]: { minAtk: 120, maxAtk: 200, minHp: 800, maxHp: 1500, def: 22 },
  [ArenaTier.MASTER]: { minAtk: 200, maxAtk: 350, minHp: 1500, maxHp: 3000, def: 30 },
};

const POINTS_TO_PROMOTE = 100;
const DAILY_ENTRIES = 5;

export class Arena {
  tier: ArenaTier;
  points: number;
  todayEntries: number;

  constructor(tier: ArenaTier = ArenaTier.BRONZE, points: number = 0) {
    this.tier = tier;
    this.points = points;
    this.todayEntries = 0;
  }

  isAvailable(): boolean {
    return this.todayEntries < DAILY_ENTRIES;
  }

  getRemainingEntries(): number {
    return Math.max(0, DAILY_ENTRIES - this.todayEntries);
  }

  matchOpponents(rng: SeededRandom): BattleUnit[] {
    const range = TIER_STAT_RANGE[this.tier];
    const opponents: BattleUnit[] = [];

    for (let i = 0; i < 4; i++) {
      const atk = rng.nextInt(range.minAtk, range.maxAtk);
      const hp = rng.nextInt(range.minHp, range.maxHp);
      const stats = Stats.create({ hp, maxHp: hp, atk, def: range.def, crit: 0.05 });
      opponents.push(new BattleUnit(`Opponent ${i + 1}`, stats, [], [], false));
    }

    return opponents;
  }

  fight(playerUnit: BattleUnit, ticketCount: number, rng: SeededRandom): Result<{ battles: Battle[]; results: BattleState[] }> {
    if (ticketCount < 1) {
      return Result.fail('No arena tickets');
    }
    if (!this.isAvailable()) {
      return Result.fail('No entries remaining today');
    }

    this.todayEntries += 1;
    const opponents = this.matchOpponents(rng);
    const battles: Battle[] = [];
    const results: BattleState[] = [];

    for (const opponent of opponents) {
      const playerClone = new BattleUnit(
        playerUnit.name,
        Stats.create({
          hp: playerUnit.maxHp, maxHp: playerUnit.maxHp,
          atk: playerUnit.baseAtk, def: playerUnit.baseDef, crit: playerUnit.baseCrit,
        }),
        [],
        [],
        true,
      );
      const battle = new Battle(playerClone, opponent, rng.nextInt(0, 999999));
      battle.runToCompletion(50);
      battles.push(battle);
      results.push(battle.state);
    }

    const wins = results.filter(r => r === BattleState.VICTORY).length;
    this.updatePoints(wins);

    return Result.ok({ battles, results });
  }

  private updatePoints(wins: number): void {
    const pointsGained = wins * 30 - (4 - wins) * 10;
    this.points = Math.max(0, this.points + pointsGained);

    if (this.points >= POINTS_TO_PROMOTE) {
      this.tryPromote();
    }
  }

  private tryPromote(): void {
    const idx = TIER_ORDER.indexOf(this.tier);
    if (idx < TIER_ORDER.length - 1) {
      this.tier = TIER_ORDER[idx + 1];
      this.points = 0;
    }
  }

  getReward(): Reward {
    const tierIdx = TIER_ORDER.indexOf(this.tier);
    const gemReward = 20 + tierIdx * 15;
    const goldReward = 100 + tierIdx * 50;

    return Reward.fromResources(
      { type: ResourceType.GEMS, amount: gemReward },
      { type: ResourceType.GOLD, amount: goldReward },
    );
  }

  getTierIndex(): number {
    return TIER_ORDER.indexOf(this.tier);
  }

  dailyReset(): void {
    this.todayEntries = 0;
  }
}
