import { Stats } from '../value-objects/Stats';
import { Skill } from '../entities/Skill';
import { BattleUnit } from '../battle/BattleUnit';
import { EnemyTable, type EnemyTemplateData } from '../data/EnemyTable';
import { SkillTable } from '../data/SkillTable';

export class EnemyTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseStats: Stats,
    public readonly skills: Skill[],
    public readonly isBoss: boolean,
    public readonly ragePerAttack: number,
  ) {}

  static fromData(data: EnemyTemplateData): EnemyTemplate {
    const skills = data.skillIds
      .map(id => SkillTable.getSkillById(id))
      .filter((s): s is Skill => s !== undefined);

    return new EnemyTemplate(data.id, data.name, data.baseStats, skills, data.isBoss, data.ragePerAttack ?? 0);
  }

  static fromId(id: string): EnemyTemplate | null {
    const data = EnemyTable.getTemplate(id);
    if (!data) return null;
    return EnemyTemplate.fromData(data);
  }

  createInstance(chapterLevel: number, statMultiplier: number = 1.0): BattleUnit {
    let scaledStats = EnemyTable.getScaledStats(this.baseStats, chapterLevel);
    if (statMultiplier !== 1.0) {
      scaledStats = scaledStats.multiply(statMultiplier);
    }
    const unit = new BattleUnit(
      this.name,
      scaledStats,
      [...this.skills],
      false,
    );
    if (this.ragePerAttack > 0) {
      unit.ragePerAttack = this.ragePerAttack;
    }
    return unit;
  }

  createTowerInstance(floor: number): BattleUnit {
    const scaledStats = EnemyTable.getTowerScaledStats(this.baseStats, floor);
    const unit = new BattleUnit(
      this.name,
      scaledStats,
      [...this.skills],
      false,
    );
    if (this.ragePerAttack > 0) {
      unit.ragePerAttack = this.ragePerAttack;
    }
    return unit;
  }
}
