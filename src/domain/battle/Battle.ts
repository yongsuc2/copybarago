import { BattleState, SkillHierarchy } from '../enums';
import { BattleUnit } from './BattleUnit';
import { BattleLog, type BattleLogEntry, BattleLogType } from './BattleLog';
import { SkillExecutionEngine, type SkillDamageResult } from './SkillExecutionEngine';
import type { ActiveSkill } from '../entities/ActiveSkill';
import { SeededRandom } from '../../infrastructure/SeededRandom';
import { BattleDataTable } from '../data/BattleDataTable';

export interface TurnResult {
  turnNumber: number;
  state: BattleState;
  playerHp: number;
  enemyHp: number;
  enemyHps: number[];
  entries: BattleLogEntry[];
}

export class Battle {
  player: BattleUnit;
  enemies: BattleUnit[];
  turnCount: number;
  state: BattleState;
  log: BattleLog;
  private rng: SeededRandom;
  private engine: SkillExecutionEngine;

  constructor(player: BattleUnit, enemies: BattleUnit | BattleUnit[], seed: number = Date.now()) {
    this.player = player;
    this.enemies = Array.isArray(enemies) ? enemies : [enemies];
    this.turnCount = 0;
    this.state = BattleState.IN_PROGRESS;
    this.log = new BattleLog();
    this.rng = new SeededRandom(seed);
    this.engine = new SkillExecutionEngine(this.rng);

    this.engine.resolveInjections(this.player.activeSkills);
  }

  get enemy(): BattleUnit {
    return this.enemies[0];
  }

  private getFirstAliveEnemy(): BattleUnit | null {
    return this.enemies.find(e => e.isAlive()) ?? null;
  }

  executeTurn(): TurnResult {
    if (this.state !== BattleState.IN_PROGRESS) {
      return this.buildTurnResult();
    }

    this.turnCount += 1;

    this.log.add({
      turn: this.turnCount, type: BattleLogType.TURN_START,
      source: '', target: '', value: this.turnCount,
      message: `Turn ${this.turnCount}`,
    });

    const target = this.getFirstAliveEnemy();
    if (target && this.player.isAlive()) {
      this.processPlayerTurn(this.player, target);
      if (this.checkDeath()) return this.buildTurnResult();
    }

    for (const enemy of this.enemies) {
      if (!enemy.isAlive() || !this.player.isAlive()) continue;
      this.processEnemyTurn(enemy, this.player);
      if (this.checkDeath()) return this.buildTurnResult();
    }

    this.processStatusEffects(this.player);
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        this.processStatusEffects(enemy);
      }
    }
    this.checkDeath();

    return this.buildTurnResult();
  }

  private processPlayerTurn(player: BattleUnit, target: BattleUnit): void {
    const builtins = player.getBuiltinSkills();
    const ilban = builtins.find(s => s.id === 'ilban_attack');
    const bunno = builtins.find(s => s.id === 'bunno_attack');

    let mainSkill: ActiveSkill | undefined;
    let isBunno = false;

    if (bunno && this.engine.evaluateTrigger(bunno.trigger, this.turnCount, player)) {
      mainSkill = bunno;
      isBunno = true;
    } else {
      mainSkill = ilban;
    }

    if (!target.isAlive()) return;

    if (!mainSkill) {
      this.processBasicAttack(player, target);
      return;
    }

    const allSkills = player.getAllSkillsForEngine();
    const allTargets = this.enemies;
    const mainResults = this.engine.executeSkillEffects(mainSkill, player, target, allSkills, 0, allTargets);

    if (isBunno) {
      for (const r of mainResults) {
        if (r.damage > 0) {
          r.damage = Math.floor(r.damage * player.ragePowerMultiplier);
        }
      }
    }

    this.logSkillResults(mainResults, player, target, isBunno);
    this.applyLifesteal(player, mainResults);

    this.executeUpperSkills(player, target, allSkills, mainSkill.id);

    if (!isBunno && target.isAlive() && player.multiHitChance > 0 && this.rng.chance(player.multiHitChance)) {
      const multiResults = this.engine.executeSkillEffects(mainSkill, player, target, allSkills, 0, allTargets);
      this.logSkillResults(multiResults, player, target, false);
      this.applyLifesteal(player, multiResults);

      this.executeUpperSkills(player, target, allSkills, mainSkill.id);
    }

    if (!isBunno && bunno && target.isAlive() && player.rage >= player.maxRage) {
      const bunnoResults = this.engine.executeSkillEffects(bunno, player, target, allSkills, 0, allTargets);
      for (const r of bunnoResults) {
        if (r.damage > 0) {
          r.damage = Math.floor(r.damage * player.ragePowerMultiplier);
        }
      }
      this.logSkillResults(bunnoResults, player, target, true);
      this.applyLifesteal(player, bunnoResults);

      this.executeUpperSkills(player, target, allSkills, bunno.id);
    }

    if (target.isAlive() && target.counterTriggerChance > 0 && this.rng.chance(target.counterTriggerChance)) {
      this.processCounter(target, player);
    }
  }

  private executeUpperSkills(
    player: BattleUnit, target: BattleUnit,
    allSkills: ActiveSkill[], triggerSkillId: string,
  ): void {
    const anyAlive = this.enemies.some(e => e.isAlive());
    if (!anyAlive) return;
    for (const skill of player.activeSkills) {
      if (!this.enemies.some(e => e.isAlive())) break;
      if (skill.hierarchy === SkillHierarchy.BUILTIN) continue;
      if (skill.hierarchy !== SkillHierarchy.UPPER) continue;
      if (this.engine.evaluateTrigger(skill.trigger, this.turnCount, player, triggerSkillId)) {
        const results = this.engine.executeSkillEffects(skill, player, target, allSkills, 0, this.enemies);
        this.logSkillResults(results, player, target, false);
        this.applyLifesteal(player, results);
      }
    }
  }

  private processBasicAttack(attacker: BattleUnit, target: BattleUnit): void {
    const baseDamage = this.calculateBaseDamage(attacker, target);
    const isCrit = this.rng.chance(attacker.getEffectiveCrit());
    const finalDamage = isCrit ? Math.floor(baseDamage * BattleDataTable.damage.critMultiplier) : baseDamage;

    const dealt = target.takeDamage(finalDamage);

    this.log.add({
      turn: this.turnCount,
      type: isCrit ? BattleLogType.CRIT : BattleLogType.ATTACK,
      source: attacker.name, target: target.name, value: dealt,
      message: `${attacker.name} ${isCrit ? 'CRIT' : 'attacks'} ${target.name} for ${dealt}`,
    });

    if (attacker.lifestealRate > 0 && dealt > 0) {
      const healAmount = Math.floor(dealt * attacker.lifestealRate);
      const healed = attacker.heal(healAmount);
      if (healed > 0) {
        this.log.add({
          turn: this.turnCount, type: BattleLogType.LIFESTEAL,
          source: attacker.name, target: attacker.name, value: healed,
          message: `${attacker.name} heals ${healed} from lifesteal`,
        });
      }
    }

    if (attacker.multiHitChance > 0 && target.isAlive() && this.rng.chance(attacker.multiHitChance)) {
      const extraDamage = this.calculateBaseDamage(attacker, target);
      const extraDealt = target.takeDamage(extraDamage);
      this.log.add({
        turn: this.turnCount, type: BattleLogType.ATTACK,
        source: attacker.name, target: target.name, value: extraDealt,
        message: `${attacker.name} multi-hit ${target.name} for ${extraDealt}`,
      });
    }
  }

  private processEnemyTurn(enemy: BattleUnit, target: BattleUnit): void {
    if (!target.isAlive()) return;

    const stunEffect = enemy.statusEffects.find(e => e.isStun());
    if (stunEffect) {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.STUN,
        source: enemy.name, target: enemy.name, value: 0,
        message: `${enemy.name} is stunned`,
      });
      return;
    }

    const baseDamage = this.calculateBaseDamage(enemy, target);
    const isCrit = this.rng.chance(enemy.getEffectiveCrit());
    const finalDamage = isCrit ? Math.floor(baseDamage * BattleDataTable.damage.critMultiplier) : baseDamage;

    const dealt = target.takeDamage(finalDamage);

    this.log.add({
      turn: this.turnCount,
      type: isCrit ? BattleLogType.CRIT : BattleLogType.ATTACK,
      source: enemy.name, target: target.name, value: dealt,
      message: `${enemy.name} ${isCrit ? 'CRIT' : 'attacks'} ${target.name} for ${dealt}`,
    });

    if (enemy.lifestealRate > 0 && dealt > 0) {
      const healAmount = Math.floor(dealt * enemy.lifestealRate);
      const healed = enemy.heal(healAmount);
      if (healed > 0) {
        this.log.add({
          turn: this.turnCount, type: BattleLogType.LIFESTEAL,
          source: enemy.name, target: enemy.name, value: healed,
          message: `${enemy.name} heals ${healed} from lifesteal`,
        });
      }
    }

    if (!target.isAlive()) return;

    if (enemy.multiHitChance > 0 && this.rng.chance(enemy.multiHitChance)) {
      const extraDamage = this.calculateBaseDamage(enemy, target);
      const extraDealt = target.takeDamage(extraDamage);
      this.log.add({
        turn: this.turnCount, type: BattleLogType.ATTACK,
        source: enemy.name, target: target.name, value: extraDealt,
        message: `${enemy.name} multi-hit ${target.name} for ${extraDealt}`,
      });
      if (!target.isAlive()) return;
    }

    for (const skill of enemy.activeSkills) {
      if (!target.isAlive()) break;
      if (this.engine.evaluateTrigger(skill.trigger, this.turnCount, enemy)) {
        const results = this.engine.executeSkillEffects(skill, enemy, target, enemy.activeSkills);
        this.logSkillResults(results, enemy, target, false);
      }
    }

    if (!target.isAlive()) return;
    if (enemy.isPlayer) return;

    if (enemy.rage < enemy.maxRage) {
      enemy.rage = Math.min(enemy.rage + BattleDataTable.rage.playerRagePerAttack, enemy.maxRage);
      if (enemy.rage >= enemy.maxRage) {
        enemy.rage = 0;
        const rageDamage = Math.floor(enemy.getEffectiveAtk() * BattleDataTable.rage.attackMultiplier);
        const rageDealt = target.takeDamage(rageDamage);
        this.log.add({
          turn: this.turnCount, type: BattleLogType.RAGE_ATTACK,
          source: enemy.name, target: target.name, value: rageDealt,
          skillName: '분노 공격', skillIcon: '💢',
          message: `${enemy.name} RAGE ATTACK ${target.name} for ${rageDealt}`,
        });
      }
    }

    if (target.isAlive() && target.counterTriggerChance > 0 && this.rng.chance(target.counterTriggerChance)) {
      this.processCounter(target, enemy);
    }
  }

  private logSkillResults(results: SkillDamageResult[], source: BattleUnit, target: BattleUnit, isRage: boolean): void {
    for (const r of results) {
      const tName = r.targetName ?? target.name;
      if (r.damage > 0) {
        if (isRage && r.skillName === '분노 공격') {
          this.log.add({
            turn: this.turnCount, type: BattleLogType.RAGE_ATTACK,
            source: source.name, target: tName, value: r.damage,
            skillName: r.skillName, skillIcon: r.skillIcon,
            message: `${source.name} RAGE ATTACK ${tName} for ${r.damage}`,
          });
        } else if (r.isCrit) {
          this.log.add({
            turn: this.turnCount, type: BattleLogType.CRIT,
            source: source.name, target: tName, value: r.damage,
            skillName: r.skillName, skillIcon: r.skillIcon,
            message: `${source.name}'s ${r.skillName} CRIT ${tName} for ${r.damage}`,
          });
        } else {
          this.log.add({
            turn: this.turnCount,
            type: r.skillName === '일반 공격' ? BattleLogType.ATTACK : BattleLogType.SKILL_DAMAGE,
            source: source.name, target: tName, value: r.damage,
            skillName: r.skillName, skillIcon: r.skillIcon,
            message: `${source.name}'s ${r.skillName} deals ${r.damage} to ${tName}`,
          });
        }
      }
      if (r.healAmount > 0) {
        this.log.add({
          turn: this.turnCount, type: BattleLogType.HEAL,
          source: source.name, target: source.name, value: r.healAmount,
          skillName: r.skillName, skillIcon: r.skillIcon,
          message: `${source.name} heals ${r.healAmount}`,
        });
      }
      if (r.debuffApplied) {
        this.log.add({
          turn: this.turnCount, type: BattleLogType.DEBUFF_APPLIED,
          source: source.name, target: target.name, value: 0,
          skillName: r.skillName, skillIcon: r.skillIcon,
          message: `${source.name}'s ${r.skillName} debuffs ${target.name}`,
        });
      }
    }
  }

  private applyLifesteal(unit: BattleUnit, results: SkillDamageResult[]): void {
    if (unit.lifestealRate <= 0) return;
    const totalDamage = results.reduce((sum, r) => sum + r.damage, 0);
    if (totalDamage <= 0) return;

    const healAmount = Math.floor(totalDamage * unit.lifestealRate);
    const healed = unit.heal(healAmount);
    if (healed > 0) {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.LIFESTEAL,
        source: unit.name, target: unit.name, value: healed,
        message: `${unit.name} heals ${healed} from lifesteal`,
      });
    }
  }

  private processCounter(defender: BattleUnit, attacker: BattleUnit): void {
    const baseDamage = this.calculateBaseDamage(defender, attacker);
    const isCrit = this.rng.chance(defender.getEffectiveCrit());
    const finalDamage = isCrit ? Math.floor(baseDamage * BattleDataTable.damage.critMultiplier) : baseDamage;
    const dealt = attacker.takeDamage(finalDamage);
    this.log.add({
      turn: this.turnCount, type: BattleLogType.COUNTER,
      source: defender.name, target: attacker.name, value: dealt,
      message: `${defender.name} counters ${attacker.name} for ${dealt}`,
    });
  }

  private processStatusEffects(unit: BattleUnit): void {
    const result = unit.tickStatusEffects();
    if (result.damage > 0) {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.DOT_DAMAGE,
        source: 'Status', target: unit.name, value: result.damage,
        message: `${unit.name} takes ${result.damage} from DoT`,
      });
    }
    if (result.heal > 0) {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.HOT_HEAL,
        source: 'Status', target: unit.name, value: result.heal,
        message: `${unit.name} heals ${result.heal} from regen`,
      });
    }
  }

  private calculateBaseDamage(attacker: BattleUnit, defender: BattleUnit): number {
    const atk = attacker.getEffectiveAtk() + attacker.getHpBonusDamage();
    const def = defender.getEffectiveDef();
    const k = BattleDataTable.damage.defenseConstant;
    const raw = Math.max(1, Math.floor(atk * (k / (k + def))));
    const variance = this.rng.nextFloat(BattleDataTable.damage.varianceMin, BattleDataTable.damage.varianceMax);
    return Math.max(1, Math.floor(raw * variance));
  }

  private checkDeath(): boolean {
    const allEnemiesDead = this.enemies.every(e => !e.isAlive());
    if (allEnemiesDead) {
      this.state = BattleState.VICTORY;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) {
          const alreadyLogged = this.log.entries.some(
            e => e.type === BattleLogType.DEATH && e.target === enemy.name
          );
          if (!alreadyLogged) {
            this.log.add({
              turn: this.turnCount, type: BattleLogType.DEATH,
              source: '', target: enemy.name, value: 0,
              message: `${enemy.name} defeated`,
            });
          }
        }
      }
      return true;
    }

    if (!this.player.isAlive()) {
      if (this.player.canRevive()) {
        this.player.tryRevive();
        this.log.add({
          turn: this.turnCount, type: BattleLogType.REVIVE,
          source: this.player.name, target: this.player.name,
          value: this.player.currentHp,
          message: `${this.player.name} revives with ${this.player.currentHp} HP`,
        });
        return false;
      }

      this.state = BattleState.DEFEAT;
      this.log.add({
        turn: this.turnCount, type: BattleLogType.DEATH,
        source: '', target: this.player.name, value: 0,
        message: `${this.player.name} defeated`,
      });
      return true;
    }

    return false;
  }

  private buildTurnResult(): TurnResult {
    return {
      turnNumber: this.turnCount,
      state: this.state,
      playerHp: this.player.currentHp,
      enemyHp: this.enemies[0].currentHp,
      enemyHps: this.enemies.map(e => e.currentHp),
      entries: this.log.getEntriesForTurn(this.turnCount),
    };
  }

  runToCompletion(maxTurns: number = BattleDataTable.maxTurns): TurnResult {
    while (this.state === BattleState.IN_PROGRESS && this.turnCount < maxTurns) {
      this.executeTurn();
    }

    if (this.state === BattleState.IN_PROGRESS) {
      this.state = BattleState.DEFEAT;
    }

    return this.buildTurnResult();
  }

  isFinished(): boolean {
    return this.state !== BattleState.IN_PROGRESS;
  }
}
