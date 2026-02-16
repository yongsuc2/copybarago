import { Stats } from '../value-objects/Stats';
import { ActiveSkill } from '../entities/ActiveSkill';
import { PassiveSkill } from '../entities/PassiveSkill';
import { BattleUnit } from '../battle/BattleUnit';
import { EnemyTable, type EnemyTemplateData } from '../data/EnemyTable';
import { ActiveSkillRegistry } from '../data/ActiveSkillRegistry';
import { PassiveSkillRegistry } from '../data/PassiveSkillRegistry';

export class EnemyTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseStats: Stats,
    public readonly activeSkills: ActiveSkill[],
    public readonly passiveSkills: PassiveSkill[],
    public readonly isBoss: boolean,
    public readonly ragePerAttack: number,
  ) {}

  static fromData(data: EnemyTemplateData): EnemyTemplate {
    const activeSkills: ActiveSkill[] = [];
    const passiveSkills: PassiveSkill[] = [];

    for (const id of data.skillIds) {
      const passive = PassiveSkillRegistry.getById(id, 1);
      if (passive) { passiveSkills.push(passive); continue; }
      const active = ActiveSkillRegistry.getById(id, 1);
      if (active) { activeSkills.push(active); }
    }

    return new EnemyTemplate(data.id, data.name, data.baseStats, activeSkills, passiveSkills, data.isBoss, data.ragePerAttack ?? 0);
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
    return new BattleUnit(
      this.name,
      scaledStats,
      [...this.activeSkills],
      [...this.passiveSkills],
      false,
    );
  }

  createTowerInstance(floor: number): BattleUnit {
    const scaledStats = EnemyTable.getTowerScaledStats(this.baseStats, floor);
    return new BattleUnit(
      this.name,
      scaledStats,
      [...this.activeSkills],
      [...this.passiveSkills],
      false,
    );
  }
}
