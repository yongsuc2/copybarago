import { HeritageRoute, TalentGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';
import { HeritageTable } from '../data/HeritageTable';
import type { Skill } from './Skill';

export class Heritage {
  route: HeritageRoute;
  level: number;

  constructor(route: HeritageRoute = HeritageRoute.SKULL, level: number = 0) {
    this.route = route;
    this.level = level;
  }

  static isUnlocked(talentGrade: TalentGrade): boolean {
    return talentGrade === TalentGrade.HERO;
  }

  getUpgradeCost(): number {
    return HeritageTable.getUpgradeCost(this.level);
  }

  getRequiredBookType() {
    return HeritageTable.getBookType(this.route);
  }

  upgrade(availableBooks: number): Result<{ cost: number; newLevel: number }> {
    const cost = this.getUpgradeCost();
    if (availableBooks < cost) {
      return Result.fail('Not enough books');
    }

    this.level += 1;
    return Result.ok({ cost, newLevel: this.level });
  }

  getSkillMultiplier(skill: Skill): number {
    const isSynergy = skill.heritageSynergy.includes(this.route);
    return HeritageTable.getSkillMultiplier(this.route, this.level, isSynergy);
  }

  getPassiveBonus(): Stats {
    const perLevel = HeritageTable.getPassivePerLevel(this.route);
    return perLevel.multiply(this.level);
  }

  changeRoute(newRoute: HeritageRoute): void {
    this.route = newRoute;
    this.level = 0;
  }
}
