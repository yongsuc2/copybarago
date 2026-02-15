import { BattleState, EffectType, TriggerCondition } from '../enums';
import { BattleUnit } from './BattleUnit';
import { BattleLog, type BattleLogEntry, BattleLogType } from './BattleLog';
import { StatusEffect } from './StatusEffect';
import { SeededRandom } from '../../infrastructure/SeededRandom';

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

  constructor(player: BattleUnit, enemies: BattleUnit | BattleUnit[], seed: number = Date.now()) {
    this.player = player;
    this.enemies = Array.isArray(enemies) ? enemies : [enemies];
    this.turnCount = 0;
    this.state = BattleState.IN_PROGRESS;
    this.log = new BattleLog();
    this.rng = new SeededRandom(seed);
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

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      this.processTurnStartSkills(this.player, enemy);
      if (this.checkDeath()) return this.buildTurnResult();
      this.processTurnStartSkills(enemy, this.player);
      if (this.checkDeath()) return this.buildTurnResult();
    }

    const target = this.getFirstAliveEnemy();
    if (target && this.player.isAlive()) {
      this.processAttack(this.player, target);
      if (this.checkDeath()) return this.buildTurnResult();
    }

    for (const enemy of this.enemies) {
      if (!enemy.isAlive() || !this.player.isAlive()) continue;
      this.processAttack(enemy, this.player);
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

  private processAttack(attacker: BattleUnit, defender: BattleUnit): void {
    this.processSingleHit(attacker, defender);

    if (defender.isAlive() && attacker.multiHitChance > 0 && this.rng.chance(attacker.multiHitChance)) {
      this.processSingleHit(attacker, defender);
    }

    this.processOnAttackDebuffs(attacker, defender);

    if (defender.isAlive() && attacker.ragePerAttack > 0) {
      attacker.rage += attacker.ragePerAttack + attacker.bonusRagePerAttack;
      if (attacker.rage >= attacker.maxRage) {
        attacker.rage = 0;
        this.processRageAttack(attacker, defender);
      }
    }
  }

  private processSingleHit(attacker: BattleUnit, defender: BattleUnit): void {
    if (!defender.isAlive()) return;

    const baseDamage = this.calculateDamage(attacker, defender);
    const isCrit = this.rng.chance(attacker.getEffectiveCrit());
    const finalDamage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;

    const dealt = defender.takeDamage(finalDamage);

    if (isCrit) {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.CRIT,
        source: attacker.name, target: defender.name, value: dealt,
        message: `${attacker.name} CRIT ${defender.name} for ${dealt}`,
      });
    } else {
      this.log.add({
        turn: this.turnCount, type: BattleLogType.ATTACK,
        source: attacker.name, target: defender.name, value: dealt,
        message: `${attacker.name} attacks ${defender.name} for ${dealt}`,
      });
    }

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

    this.processOnAttackSkills(attacker, defender);

    if (defender.isAlive() && defender.counterRate > 0 && this.rng.chance(0.5)) {
      this.processCounter(defender, attacker);
    }
  }

  private processOnAttackSkills(attacker: BattleUnit, defender: BattleUnit): void {
    const skills = attacker.getSkillsByTrigger(TriggerCondition.ON_ATTACK);
    for (const skill of skills) {
      if (!defender.isAlive()) break;

      if (skill.effect.type === EffectType.DAMAGE) {
        const skillDamage = Math.floor(skill.effect.value + attacker.getEffectiveAtk() * 0.3);
        const dealt = defender.takeDamage(skillDamage);
        this.log.add({
          turn: this.turnCount, type: BattleLogType.SKILL_DAMAGE,
          source: attacker.name, target: defender.name, value: dealt,
          skillName: skill.name, skillIcon: skill.icon,
          message: `${attacker.name}'s ${skill.name} deals ${dealt}`,
        });
      }
    }
  }

  private processRageAttack(attacker: BattleUnit, defender: BattleUnit): void {
    if (!defender.isAlive()) return;

    const rageDamage = Math.floor(attacker.getEffectiveAtk() * 2.0 * attacker.rageDamageMultiplier);
    const dealt = defender.takeDamage(rageDamage);
    this.log.add({
      turn: this.turnCount, type: BattleLogType.RAGE_ATTACK,
      source: attacker.name, target: defender.name, value: dealt,
      skillName: '분노 공격', skillIcon: '💢',
      message: `${attacker.name} RAGE ATTACK ${defender.name} for ${dealt}`,
    });

    this.processOnRageSkills(attacker, defender);
  }

  private processOnRageSkills(attacker: BattleUnit, defender: BattleUnit): void {
    const skills = attacker.getSkillsByTrigger(TriggerCondition.ON_RAGE);
    for (const skill of skills) {
      if (!defender.isAlive()) break;

      if (skill.effect.type === EffectType.DAMAGE) {
        const skillDamage = Math.floor(skill.effect.value + attacker.getEffectiveAtk() * 0.3);
        const dealt = defender.takeDamage(skillDamage);
        this.log.add({
          turn: this.turnCount, type: BattleLogType.SKILL_DAMAGE,
          source: attacker.name, target: defender.name, value: dealt,
          skillName: skill.name, skillIcon: skill.icon,
          message: `${attacker.name}'s ${skill.name} deals ${dealt}`,
        });
      }
    }
  }

  private processOnAttackDebuffs(attacker: BattleUnit, defender: BattleUnit): void {
    const skills = attacker.getSkillsByTrigger(TriggerCondition.ON_ATTACK);
    for (const skill of skills) {
      if (skill.effect.type === EffectType.DOT && skill.effect.statusEffectType) {
        defender.addStatusEffect(new StatusEffect(
          skill.effect.statusEffectType,
          skill.effect.duration,
          skill.effect.value,
        ));
        this.log.add({
          turn: this.turnCount, type: BattleLogType.DEBUFF_APPLIED,
          source: attacker.name, target: defender.name, value: skill.effect.value,
          skillName: skill.name, skillIcon: skill.icon,
          message: `${attacker.name} applies ${skill.name} to ${defender.name}`,
        });
      }
    }
  }

  private processTurnStartSkills(unit: BattleUnit, opponent: BattleUnit): void {
    const skills = unit.getSkillsByTrigger(TriggerCondition.TURN_START);
    for (const skill of skills) {
      if (!opponent.isAlive()) break;

      if (skill.effect.type === EffectType.DAMAGE) {
        const skillDamage = Math.floor(skill.effect.value + unit.getEffectiveAtk() * 0.2);
        const dealt = opponent.takeDamage(skillDamage);
        this.log.add({
          turn: this.turnCount, type: BattleLogType.SKILL_DAMAGE,
          source: unit.name, target: opponent.name, value: dealt,
          skillName: skill.name, skillIcon: skill.icon,
          message: `${unit.name}'s ${skill.name} deals ${dealt}`,
        });
      }

      if (skill.effect.type === EffectType.DEBUFF && skill.effect.statusEffectType) {
        opponent.addStatusEffect(new StatusEffect(
          skill.effect.statusEffectType,
          skill.effect.duration,
          skill.effect.value,
        ));
        this.log.add({
          turn: this.turnCount, type: BattleLogType.DEBUFF_APPLIED,
          source: unit.name, target: opponent.name, value: skill.effect.value,
          skillName: skill.name, skillIcon: skill.icon,
          message: `${unit.name}'s ${skill.name} debuffs ${opponent.name}`,
        });
      }
    }
  }

  private processCounter(defender: BattleUnit, attacker: BattleUnit): void {
    const counterDamage = Math.floor(this.calculateDamage(defender, attacker) * defender.counterRate);
    const dealt = attacker.takeDamage(counterDamage);
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

  private calculateDamage(attacker: BattleUnit, defender: BattleUnit): number {
    const atk = attacker.getEffectiveAtk();
    const def = defender.getEffectiveDef();
    const raw = Math.max(1, atk - Math.floor(def * 0.5));
    const variance = this.rng.nextFloat(0.9, 1.1);
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

  runToCompletion(maxTurns: number = 100): TurnResult {
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
