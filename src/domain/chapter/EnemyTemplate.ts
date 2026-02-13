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
  ) {}

  static fromData(data: EnemyTemplateData): EnemyTemplate {
    const skills = data.skillIds
      .map(id => SkillTable.getSkillById(id))
      .filter((s): s is Skill => s !== undefined);

    return new EnemyTemplate(data.id, data.name, data.baseStats, skills, data.isBoss);
  }

  static fromId(id: string): EnemyTemplate | null {
    const data = EnemyTable.getTemplate(id);
    if (!data) return null;
    return EnemyTemplate.fromData(data);
  }

  createInstance(chapterLevel: number): BattleUnit {
    const scaledStats = EnemyTable.getScaledStats(this.baseStats, chapterLevel);
    return new BattleUnit(
      this.name,
      scaledStats,
      [...this.skills],
      false,
    );
  }

  createTowerInstance(floor: number): BattleUnit {
    const scaledStats = EnemyTable.getTowerScaledStats(this.baseStats, floor);
    return new BattleUnit(
      this.name,
      scaledStats,
      [...this.skills],
      false,
    );
  }
}
