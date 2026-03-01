import { Stats } from '../value-objects/Stats';
import { ActiveSkill } from '../entities/ActiveSkill';
import { PassiveSkill } from '../entities/PassiveSkill';
import { BattleUnit } from '../battle/BattleUnit';
import { EnemyTable, type EnemyTemplateData } from '../data/EnemyTable';
import { BattleDataTable } from '../data/BattleDataTable';
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

  private buildEnemySkills(): ActiveSkill[] {
    const skills = [...this.activeSkills];
    const enemyBunno = ActiveSkillRegistry.getById('enemy_bunno_attack', 1);
    if (enemyBunno) skills.push(enemyBunno);
    return skills;
  }

  private applyEnemyFields(unit: BattleUnit): BattleUnit {
    unit.ragePerAttack = this.ragePerAttack;
    return unit;
  }

  createInstance(chapterLevel: number, statMultiplier: number = 1.0, dayProgress: number = 0): BattleUnit {
    let scaledStats = EnemyTable.getScaledStats(this.baseStats, chapterLevel);
    if (dayProgress > 0) {
      const dayBonus = 1 + dayProgress * BattleDataTable.enemy.dayProgressMaxBonus;
      scaledStats = scaledStats.multiply(dayBonus);
    }
    if (statMultiplier !== 1.0) {
      scaledStats = scaledStats.multiply(statMultiplier);
    }
    return this.applyEnemyFields(new BattleUnit(
      this.name,
      scaledStats,
      this.buildEnemySkills(),
      [...this.passiveSkills],
      false,
    ));
  }

  createTowerInstance(floor: number): BattleUnit {
    const scaledStats = EnemyTable.getTowerScaledStats(this.baseStats, floor);
    return this.applyEnemyFields(new BattleUnit(
      this.name,
      scaledStats,
      this.buildEnemySkills(),
      [...this.passiveSkills],
      false,
    ));
  }
}
