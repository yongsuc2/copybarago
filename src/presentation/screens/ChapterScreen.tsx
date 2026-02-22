import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../GameContext';
import { ChapterType, EncounterType, BattleState, SkillGrade, ResourceType, PassiveType, StatType } from '../../domain/enums';
import type { Encounter } from '../../domain/chapter/Encounter';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Battle } from '../../domain/battle/Battle';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleLogType } from '../../domain/battle/BattleLog';
import type { AttackPhase } from '../components/BattleArena';
import { AdventureStage } from '../components/AdventureStage';
import { PlayerStatsBar, formatNumber } from '../components/PlayerStatsBar';
import { DamageGraph, type DamageSource } from '../components/DamageGraph';
import { EncounterDataTable } from '../../domain/data/EncounterDataTable';
import { ActiveSkillRegistry } from '../../domain/data/ActiveSkillRegistry';
import { PassiveSkillRegistry } from '../../domain/data/PassiveSkillRegistry';
import type { SessionSkill } from '../../domain/battle/BattleUnit';
import { Package, Home, Swords, Zap, Star, BarChart3, FastForward, Coins, Settings } from 'lucide-react';
import { BattleDataTable } from '../../domain/data/BattleDataTable';
import { Stats } from '../../domain/value-objects/Stats';

const MAX_BATTLE_TURNS = BattleDataTable.maxTurns;

const SKILL_GRADE_COLORS: Record<SkillGrade, string> = {
  [SkillGrade.NORMAL]: '#aaa',
  [SkillGrade.LEGENDARY]: '#ff9800',
  [SkillGrade.MYTHIC]: '#e94560',
  [SkillGrade.IMMORTAL]: '#ffd700',
};

const PHASE_DURATION = {
  approach: 350,
  hit: 300,
  retreat: 350,
  pause: 200,
};

const CONSECUTIVE_SKILL_BOOST = 1.45;

function getGroupSkillKey(group: BattleLogEntry[]): string | null {
  const primary = group[0];
  if (!primary) return null;
  if (primary.type === BattleLogType.SKILL_DAMAGE || primary.type === BattleLogType.CRIT) {
    return primary.skillName ?? null;
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cloneUnit(unit: BattleUnit): BattleUnit {
  return Object.assign(Object.create(Object.getPrototypeOf(unit)), unit);
}

function isDamageOrHeal(type: BattleLogType): boolean {
  return type === BattleLogType.ATTACK
    || type === BattleLogType.SKILL_DAMAGE
    || type === BattleLogType.COUNTER
    || type === BattleLogType.CRIT
    || type === BattleLogType.DOT_DAMAGE
    || type === BattleLogType.RAGE_ATTACK
    || type === BattleLogType.LIFESTEAL
    || type === BattleLogType.HOT_HEAL
    || type === BattleLogType.REVIVE;
}

function reorderBySkillType(entries: BattleLogEntry[]): BattleLogEntry[] {
  const reordered: BattleLogEntry[] = [];
  let skillBuffer: BattleLogEntry[] = [];
  let lifestealBuffer: BattleLogEntry[] = [];

  function flushBuffers() {
    if (skillBuffer.length > 0) {
      const byName = new Map<string, BattleLogEntry[]>();
      const order: string[] = [];
      for (const e of skillBuffer) {
        const key = e.skillName ?? '';
        if (!byName.has(key)) {
          byName.set(key, []);
          order.push(key);
        }
        byName.get(key)!.push(e);
      }
      for (const name of order) {
        reordered.push(...byName.get(name)!);
      }
      skillBuffer = [];
    }
    reordered.push(...lifestealBuffer);
    lifestealBuffer = [];
  }

  for (const entry of entries) {
    const isBoundary = entry.type === BattleLogType.ATTACK
      || entry.type === BattleLogType.RAGE_ATTACK
      || (entry.type === BattleLogType.CRIT && entry.skillName === '일반 공격');
    if (isBoundary) {
      flushBuffers();
      reordered.push(entry);
    } else if (entry.type === BattleLogType.LIFESTEAL) {
      lifestealBuffer.push(entry);
    } else {
      skillBuffer.push(entry);
    }
  }
  flushBuffers();

  return reordered;
}

function splitToAnimationGroups(entries: BattleLogEntry[]): BattleLogEntry[][] {
  const reordered = reorderBySkillType(entries);
  const groups: BattleLogEntry[][] = [];

  for (const entry of reordered) {
    if (entry.type === BattleLogType.LIFESTEAL) {
      if (groups.length > 0) {
        groups[groups.length - 1].push(entry);
      } else {
        groups.push([entry]);
      }
    } else {
      groups.push([entry]);
    }
  }
  return groups;
}

interface RunningHps {
  playerHp: number;
  enemyHps: number[];
}

export function ChapterScreen() {
  const { game, refresh, setScreen } = useGame();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [, setBattleResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const [, setBattle] = useState<Battle | null>(null);
  const [playerUnit, setPlayerUnit] = useState<BattleUnit | null>(null);
  const [enemyUnits, setEnemyUnits] = useState<BattleUnit[]>([]);
  const [attackPhase, setAttackPhase] = useState<AttackPhase>('idle');
  const [damageEntries, setDamageEntries] = useState<BattleLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isBattling, setIsBattling] = useState(false);
  const [isBossFight, setIsBossFight] = useState(false);
  const [battleType, setBattleType] = useState<'normal' | 'elite' | 'midBoss' | 'boss'>('normal');
  const [eliteReward, setEliteReward] = useState<SessionSkill[] | null>(null);
  const [chapterResult, setChapterResult] = useState<{ type: 'victory' | 'defeat'; chapterId: number; gold: number; gems?: number } | null>(null);
  const [activeEnemyIndex, setActiveEnemyIndex] = useState(0);

  const [showDamageGraph, setShowDamageGraph] = useState(() => localStorage.getItem('showDamageGraph') === 'true');
  const [damageSourcesSnapshot, setDamageSourcesSnapshot] = useState<DamageSource[]>([]);
  const damageMapRef = useRef<Map<string, DamageSource>>(new Map());
  const [healSourcesSnapshot, setHealSourcesSnapshot] = useState<DamageSource[]>([]);
  const healMapRef = useRef<Map<string, DamageSource>>(new Map());

  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(() => (localStorage.getItem('battleSpeed') === '2' ? 2 : 1));
  const battleSpeedRef = useRef<1 | 2>(localStorage.getItem('battleSpeed') === '2' ? 2 : 1);
  const [animSpeed, setAnimSpeed] = useState<number>(() => (localStorage.getItem('battleSpeed') === '2' ? 2 : 1));

  const [showSettings, setShowSettings] = useState(false);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(null);
  const [showResultGraph, setShowResultGraph] = useState(false);

  const cancelledRef = useRef(false);
  const battleRef = useRef<Battle | null>(null);

  const chapter = game.currentChapter;

  function accumulateDamage(entries: BattleLogEntry[], playerName: string) {
    const map = damageMapRef.current;
    for (const entry of entries) {
      const isDmgType = entry.type === BattleLogType.ATTACK
        || entry.type === BattleLogType.CRIT
        || entry.type === BattleLogType.SKILL_DAMAGE
        || entry.type === BattleLogType.COUNTER
        || entry.type === BattleLogType.RAGE_ATTACK;
      const isDot = entry.type === BattleLogType.DOT_DAMAGE;

      if (isDmgType && entry.source === playerName && entry.target !== playerName) {
        let key: string;
        let icon: string;
        if (entry.type === BattleLogType.RAGE_ATTACK) {
          key = '분노 공격';
          icon = '💢';
        } else if (entry.type === BattleLogType.SKILL_DAMAGE && entry.skillName) {
          key = entry.skillName;
          icon = entry.skillIcon ?? '✨';
        } else if (entry.type === BattleLogType.COUNTER) {
          key = '반격';
          icon = '🛡️';
        } else {
          key = '일반 공격';
          icon = '⚔️';
        }
        const existing = map.get(key);
        if (existing) {
          existing.total += entry.value;
        } else {
          map.set(key, { label: key, icon, total: entry.value });
        }
      } else if (isDot && entry.target !== playerName) {
        const key = '독 피해';
        const icon = '☠️';
        const existing = map.get(key);
        if (existing) {
          existing.total += entry.value;
        } else {
          map.set(key, { label: key, icon, total: entry.value });
        }
      }
    }
    setDamageSourcesSnapshot([...map.values()]);

    const hMap = healMapRef.current;
    for (const entry of entries) {
      const isHealType = entry.type === BattleLogType.LIFESTEAL
        || entry.type === BattleLogType.HOT_HEAL
        || entry.type === BattleLogType.REVIVE;
      if (!isHealType || entry.target !== playerName) continue;

      let key: string;
      let icon: string;
      if (entry.type === BattleLogType.LIFESTEAL) {
        key = '흡혈';
        icon = '🩸';
      } else if (entry.type === BattleLogType.HOT_HEAL) {
        key = '재생';
        icon = '💚';
      } else {
        key = '부활';
        icon = '✨';
      }
      const existing = hMap.get(key);
      if (existing) {
        existing.total += entry.value;
      } else {
        hMap.set(key, { label: key, icon, total: entry.value });
      }
    }
    setHealSourcesSnapshot([...hMap.values()]);
  }

  const clearBattleState = useCallback(() => {
    setIsBattling(false);
    setBattle(null);
    setPlayerUnit(null);
    setEnemyUnits([]);
    setAttackPhase('idle');
    setDamageEntries([]);
    setTurnCount(0);
    setActiveEnemyIndex(0);
    battleRef.current = null;
  }, []);

  const finishBattle = useCallback((b: Battle, boss: boolean) => {
    if (boss) {
      const chId = game.currentChapter?.id ?? 0;
      if (b.state === BattleState.VICTORY) {
        game.currentChapter?.onBossDefeated();
        if (game.currentChapter) {
          game.player.clearedChapterMax = Math.max(game.player.clearedChapterMax, game.currentChapter.id);
          game.travel.maxClearedChapter = game.player.clearedChapterMax;
          const clearGold = EncounterDataTable.getChapterClearGold(game.currentChapter.id);
          const clearGems = EncounterDataTable.getChapterClearGems(game.currentChapter.id);
          game.player.resources.add(ResourceType.GOLD, clearGold);
          game.player.resources.add(ResourceType.GEMS, clearGems);
        }
        game.updateQuestProgress('daily_chapter');
        game.updateQuestProgress('weekly_chapter');
      } else {
        game.currentChapter?.onBattleEnd(b.state);
      }
      if (game.currentChapter) {
        game.player.updateBestSurvivalDay(
          game.currentChapter.id,
          game.currentChapter.currentDay,
          game.currentChapter.isCompleted(),
        );
      }
      game.currentChapter = null;

      setTimeout(() => {
        clearBattleState();
        game.saveGame();
        setChapterResult({
          type: b.state === BattleState.VICTORY ? 'victory' : 'defeat',
          chapterId: chId,
          gold: b.state === BattleState.VICTORY ? EncounterDataTable.getChapterClearGold(chId) : 0,
          gems: b.state === BattleState.VICTORY ? EncounterDataTable.getChapterClearGems(chId) : 0,
        });
        refresh();
      }, 1500);
    } else {
      if (game.currentChapter && b.state === BattleState.VICTORY) {
        game.currentChapter.updateSessionHpAfterBattle(b.player.currentHp);
      }
      const goldEarned = game.currentChapter?.onBattleEnd(b.state) ?? 0;
      if (goldEarned > 0) {
        game.player.resources.add(ResourceType.GOLD, goldEarned);
      }
      setLog(prev => [
        ...prev,
        `  전투: ${b.state} (${b.turnCount}턴)${goldEarned > 0 ? ` +${goldEarned}G` : ''}`,
      ]);
      setBattleResult(b.state);

      if (b.state === BattleState.DEFEAT) {
        const chId = game.currentChapter?.id ?? 0;
        if (game.currentChapter) {
          game.player.updateBestSurvivalDay(
            game.currentChapter.id,
            game.currentChapter.currentDay,
            false,
          );
        }
        game.currentChapter = null;

        setTimeout(() => {
          clearBattleState();
          game.saveGame();
          setChapterResult({
            type: 'defeat',
            chapterId: chId,
            gold: 0,
          });
          refresh();
        }, 1500);
      } else if (battleType === 'elite' || battleType === 'midBoss') {
        const ownedSkills = game.currentChapter?.sessionSkills ?? [];
        const ownedMap = new Map(ownedSkills.map(s => [s.id, s.tier]));
        const tier3Pool: SessionSkill[] = [
          ...ActiveSkillRegistry.getAll().filter(s => s.tier === 3 && !ActiveSkillRegistry.isSpecialSkill(s.id)),
          ...PassiveSkillRegistry.getAll().filter(s => s.tier === 3 && !PassiveSkillRegistry.isSpecialSkill(s.id)),
        ].filter(s => {
          const owned = ownedMap.get(s.id);
          return !owned || owned < s.tier;
        });
        const shuffled = [...tier3Pool].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);

        setTimeout(() => {
          clearBattleState();
          setEliteReward(choices);
          refresh();
        }, 1500);
      } else {
        setTimeout(() => {
          clearBattleState();
          setEncounter(null);
          setTimeout(() => advanceDay(), 400);
          refresh();
        }, 1500);
      }
    }
  }, [game, refresh, clearBattleState]);

  const advanceDay = useCallback(() => {
    if (!game.currentChapter) return;

    if (game.currentChapter.isBossDay()) {
      startSpecialBattle('boss');
      return;
    }

    const enc = game.currentChapter.advanceDay();

    if (!enc && game.currentChapter.isEliteDay()) {
      startSpecialBattle('elite');
      return;
    }

    if (!enc && game.currentChapter.isMidBossDay()) {
      startSpecialBattle('midBoss');
      return;
    }

    if (!enc && game.currentChapter.isOptionalEliteDay()) {
      startSpecialBattle('elite');
      return;
    }

    if (!enc && game.currentChapter.isBossDay()) {
      startSpecialBattle('boss');
      return;
    }

    setLog(prev => [...prev, `${game.currentChapter!.currentDay}일차: ${enc?.type ?? '???'}`]);

    if (enc?.type === EncounterType.COMBAT) {
      const stats = game.player.computeStats();
      const ch = game.currentChapter;
      const battleStats = Stats.create({ maxHp: ch.sessionMaxHp, hp: ch.sessionCurrentHp, atk: stats.atk, def: stats.def, crit: stats.crit });
      const equipPassives = game.battleManager.getEquipmentPassiveSkills(game.player);
      const petAbility = game.battleManager.getPetAbilitySkill(game.player);
      const allPassives = [...ch.getBattlePassiveSkills(), ...equipPassives];
      if (petAbility) allPassives.push(petAbility);
      const pu = new BattleUnit('Capybara', battleStats, ch.getSessionActiveSkills(), allPassives, true);
      const b = game.currentChapter.createCombatBattle(pu);
      if (b) {
        setBattleType('normal');
        startBattle(b, false);
      }
      refresh();
      return;
    }

    if (enc && enc.options.length === 1) {
      const ch = game.currentChapter;
      const result = ch.resolveEncounter(0, ch.sessionCurrentHp, ch.sessionMaxHp);
      if (result) {
        if (result.skillsGained.length > 0) {
          setLog(prev => [...prev, `  획득: ${result.skillsGained.map(s => `${s.icon} ${s.name}`).join(', ')}`]);
        }
        if (result.hpChange !== 0) {
          setLog(prev => [...prev, `  체력 변화: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
        }
        for (const r of result.reward.resources) {
          game.player.resources.add(r.type, r.amount);
          setLog(prev => [...prev, `  보상: +${r.amount} ${r.type}`]);
        }
      }
      refresh();
      setTimeout(() => advanceDay(), 300);
      return;
    }

    setEncounter(enc);
    refresh();
  }, [game, refresh]);

  function computeMidTurnHp(
    hpsBefore: RunningHps,
    entries: BattleLogEntry[],
    playerName: string,
    playerMaxHp: number,
    enemyMaxHps: number[],
    enemyNames: string[],
  ): RunningHps {
    let playerHp = hpsBefore.playerHp;
    const enemyHps = [...hpsBefore.enemyHps];

    for (const entry of entries) {
      const isHeal = entry.type === BattleLogType.LIFESTEAL
        || entry.type === BattleLogType.HOT_HEAL
        || entry.type === BattleLogType.REVIVE;
      if (isHeal) {
        if (entry.target === playerName) playerHp += entry.value;
        else {
          const idx = enemyNames.indexOf(entry.target);
          if (idx >= 0) enemyHps[idx] += entry.value;
        }
      } else {
        if (entry.target === playerName) playerHp -= entry.value;
        else {
          const idx = enemyNames.indexOf(entry.target);
          if (idx >= 0) enemyHps[idx] -= entry.value;
        }
      }
    }

    return {
      playerHp: Math.max(0, Math.min(playerHp, playerMaxHp)),
      enemyHps: enemyHps.map((hp, i) => Math.max(0, Math.min(hp, enemyMaxHps[i]))),
    };
  }

  async function animateHitGroup(
    hitGroup: BattleLogEntry[],
    side: 'player' | 'enemy',
    runningHps: RunningHps,
    b: Battle,
    playerName: string,
    enemyNames: string[],
    prevPlayerUnit: BattleUnit,
    prevEnemyUnits: BattleUnit[],
    consecutiveBoost: number = 1,
  ): Promise<{ hps: RunningHps; player: BattleUnit; enemies: BattleUnit[] }> {
    const newHps = computeMidTurnHp(
      runningHps, hitGroup, playerName,
      b.player.maxHp,
      b.enemies.map(e => e.maxHp),
      enemyNames,
    );

    const speed = battleSpeedRef.current * consecutiveBoost;

    const hasSkillProjectile = hitGroup.some(e =>
      (e.type === BattleLogType.SKILL_DAMAGE || e.type === BattleLogType.CRIT) && e.skillIcon && e.skillName !== '일반 공격',
    );
    if (hasSkillProjectile) {
      setDamageEntries(hitGroup);
    }

    setAttackPhase(`${side}-approach`);
    await delay(PHASE_DURATION.approach / speed);
    if (cancelledRef.current) return { hps: newHps, player: prevPlayerUnit, enemies: prevEnemyUnits };

    if (!hasSkillProjectile) {
      setDamageEntries(hitGroup);
    }
    const midPlayer = cloneUnit(prevPlayerUnit);
    midPlayer.currentHp = newHps.playerHp;

    const hasRageEntry = hitGroup.some(e => e.type === BattleLogType.RAGE_ATTACK);

    const midEnemies = prevEnemyUnits.map((prev, i) => {
      const clone = cloneUnit(prev);
      clone.currentHp = newHps.enemyHps[i];
      if (side === 'enemy') {
        const eName = enemyNames[i];
        const isAttacker = hitGroup.some(e => e.source === eName);
        if (isAttacker) {
          clone.rage = b.enemies[i].rage;
          if (hasRageEntry && hitGroup.some(e => e.source === eName && e.type === BattleLogType.RAGE_ATTACK)) {
            clone.rage = 0;
          }
        }
      }
      return clone;
    });

    if (side === 'player') {
      midPlayer.rage = b.player.rage;
    }

    setPlayerUnit(midPlayer);
    setEnemyUnits(midEnemies);
    setAttackPhase(`${side}-hit`);
    await delay(PHASE_DURATION.hit / speed);
    if (cancelledRef.current) return { hps: newHps, player: midPlayer, enemies: midEnemies };

    setAttackPhase(`${side}-retreat`);
    await delay(PHASE_DURATION.retreat / speed);
    if (cancelledRef.current) return { hps: newHps, player: midPlayer, enemies: midEnemies };

    setDamageEntries([]);
    setAttackPhase('idle');
    await delay(PHASE_DURATION.pause / speed);

    return { hps: newHps, player: midPlayer, enemies: midEnemies };
  }

  async function animateTurn(b: Battle, playerName: string) {
    if (cancelledRef.current) return;

    const enemyNames = b.enemies.map(e => e.name);
    const prevPlayerRage = b.player.rage;
    const prevEnemyRages = b.enemies.map(e => e.rage);

    const result = b.executeTurn();
    setTurnCount(result.turnNumber);
    accumulateDamage(result.entries, playerName);

    const playerEntries: BattleLogEntry[] = [];
    const enemyEntriesBySource = new Map<string, BattleLogEntry[]>();
    const statusEntries: BattleLogEntry[] = [];

    for (const entry of result.entries) {
      if (!isDamageOrHeal(entry.type)) continue;
      if (entry.type === BattleLogType.DOT_DAMAGE || entry.type === BattleLogType.HOT_HEAL) {
        statusEntries.push(entry);
      } else if (entry.source === playerName) {
        playerEntries.push(entry);
      } else {
        const arr = enemyEntriesBySource.get(entry.source) || [];
        arr.push(entry);
        enemyEntriesBySource.set(entry.source, arr);
      }
    }

    let running: RunningHps = {
      playerHp: result.playerHp - computeHpDelta(result.entries, playerName, enemyNames),
      enemyHps: b.enemies.map((e, i) => {
        let hp = result.enemyHps[i];
        for (const entry of result.entries) {
          if (!isDamageOrHeal(entry.type)) continue;
          const isHeal = entry.type === BattleLogType.LIFESTEAL || entry.type === BattleLogType.HOT_HEAL || entry.type === BattleLogType.REVIVE;
          if (entry.target === e.name) {
            hp += isHeal ? -entry.value : entry.value;
          }
        }
        return Math.max(0, hp);
      }),
    };

    function computeHpDelta(entries: BattleLogEntry[], pName: string, _eNames: string[]): number {
      let delta = 0;
      for (const entry of entries) {
        if (!isDamageOrHeal(entry.type)) continue;
        const isHeal = entry.type === BattleLogType.LIFESTEAL || entry.type === BattleLogType.HOT_HEAL || entry.type === BattleLogType.REVIVE;
        if (entry.target === pName) {
          delta += isHeal ? -entry.value : entry.value;
        }
      }
      return -delta;
    }

    let curPlayer = cloneUnit(b.player);
    let curEnemies = b.enemies.map(e => cloneUnit(e));
    curPlayer.rage = prevPlayerRage;
    curEnemies.forEach((ce, i) => { ce.rage = prevEnemyRages[i]; });

    if (playerEntries.length > 0 && !cancelledRef.current) {
      const targetEnemy = playerEntries[0]?.target;
      const targetIdx = enemyNames.indexOf(targetEnemy);
      if (targetIdx >= 0) setActiveEnemyIndex(targetIdx);

      const groups = splitToAnimationGroups(playerEntries);
      let prevKey: string | null = null;
      for (const group of groups) {
        if (cancelledRef.current) break;
        const targetHpIdx = enemyNames.indexOf(group[0]?.target ?? '');
        if (targetHpIdx >= 0 && running.enemyHps[targetHpIdx] <= 0) break;
        const skillKey = getGroupSkillKey(group);
        const boost = (skillKey !== null && skillKey === prevKey) ? CONSECUTIVE_SKILL_BOOST : 1;
        setAnimSpeed(battleSpeedRef.current * boost);
        const res = await animateHitGroup(group, 'player', running, b, playerName, enemyNames, curPlayer, curEnemies, boost);
        running = res.hps;
        curPlayer = res.player;
        curEnemies = res.enemies;
        prevKey = skillKey;
      }
    }

    for (const [source, entries] of enemyEntriesBySource) {
      if (cancelledRef.current || running.playerHp <= 0) break;
      const eIdx = enemyNames.indexOf(source);
      if (eIdx >= 0) setActiveEnemyIndex(eIdx);

      const groups = splitToAnimationGroups(entries);
      let prevEKey: string | null = null;
      for (const group of groups) {
        if (cancelledRef.current || running.playerHp <= 0) break;
        const skillKey = getGroupSkillKey(group);
        const boost = (skillKey !== null && skillKey === prevEKey) ? CONSECUTIVE_SKILL_BOOST : 1;
        setAnimSpeed(battleSpeedRef.current * boost);
        const res = await animateHitGroup(group, 'enemy', running, b, playerName, enemyNames, curPlayer, curEnemies, boost);
        running = res.hps;
        curPlayer = res.player;
        curEnemies = res.enemies;
        prevEKey = skillKey;
      }
    }

    if (statusEntries.length > 0 && !cancelledRef.current) {
      const newHps = computeMidTurnHp(
        running, statusEntries, playerName,
        b.player.maxHp,
        b.enemies.map(e => e.maxHp),
        enemyNames,
      );
      running = newHps;

      const midPlayer = cloneUnit(curPlayer);
      midPlayer.currentHp = newHps.playerHp;
      const midEnemies = curEnemies.map((prev, i) => {
        const clone = cloneUnit(prev);
        clone.currentHp = newHps.enemyHps[i];
        return clone;
      });

      setDamageEntries(statusEntries);
      setPlayerUnit(midPlayer);
      setEnemyUnits(midEnemies);
      setAttackPhase('idle');
      await delay(PHASE_DURATION.hit / battleSpeedRef.current);
      setDamageEntries([]);
      await delay(PHASE_DURATION.pause / battleSpeedRef.current);

      curPlayer = midPlayer;
      curEnemies = midEnemies;
    }

    if (playerEntries.length === 0 && enemyEntriesBySource.size === 0 && statusEntries.length === 0) {
      await delay(PHASE_DURATION.pause / battleSpeedRef.current);
    }

    setPlayerUnit(cloneUnit(b.player));
    setEnemyUnits(b.enemies.map(e => cloneUnit(e)));
  }

  async function runBattleLoop(b: Battle, boss: boolean) {
    const playerName = b.player.name;

    while (!cancelledRef.current && !b.isFinished() && b.turnCount < MAX_BATTLE_TURNS) {
      await animateTurn(b, playerName);
    }

    if (cancelledRef.current) return;

    if (b.state === BattleState.IN_PROGRESS) {
      (b as any).state = BattleState.DEFEAT;
    }

    finishBattle(b, boss);
  }

  function startBattle(b: Battle, boss: boolean) {
    cancelledRef.current = false;
    battleRef.current = b;
    damageMapRef.current = new Map();
    healMapRef.current = new Map();
    setDamageSourcesSnapshot([]);
    setHealSourcesSnapshot([]);
    setBattle(b);
    setPlayerUnit(cloneUnit(b.player));
    setEnemyUnits(b.enemies.map(e => cloneUnit(e)));
    setIsBattling(true);
    setIsBossFight(boss);
    setAttackPhase('idle');
    setDamageEntries([]);
    setTurnCount(0);
    setActiveEnemyIndex(0);

    runBattleLoop(b, boss);
  }

  function startSpecialBattle(type: 'elite' | 'midBoss' | 'boss') {
    if (!game.currentChapter) return;
    const ch = game.currentChapter;

    const stats = game.player.computeStats();
    const battleStats = Stats.create({ maxHp: ch.sessionMaxHp, hp: ch.sessionCurrentHp, atk: stats.atk, def: stats.def, crit: stats.crit });
    const equipPassives = game.battleManager.getEquipmentPassiveSkills(game.player);
    const pu = new BattleUnit('Capybara', battleStats, ch.getSessionActiveSkills(), [...ch.getBattlePassiveSkills(), ...equipPassives], true);

    const b = type === 'elite' ? ch.createEliteBattle(pu)
      : type === 'midBoss' ? ch.createMidBossBattle(pu)
      : ch.createBossBattle(pu);
    if (!b) return;

    setBattleType(type);
    startBattle(b, type === 'boss');
  }

  function startChapter() {
    const nextId = game.player.clearedChapterMax + 1;
    const type = ChapterType.SIXTY_DAY;

    game.startChapter(nextId, type);
    const stats = game.player.computeStats();
    game.currentChapter!.initSessionHp(stats.maxHp);
    setBattleResult(null);
    setChapterResult(null);
    setLog([]);
    advanceDay();
  }

  function abandonChapter() {
    const chId = game.currentChapter?.id ?? 0;
    cancelledRef.current = true;
    if (game.currentChapter) {
      game.player.updateBestSurvivalDay(
        game.currentChapter.id,
        game.currentChapter.currentDay,
        false,
      );
    }
    game.currentChapter = null;
    clearBattleState();
    setEncounter(null);
    game.saveGame();
    setChapterResult({ type: 'defeat', chapterId: chId, gold: 0 });
    refresh();
  }

  function selectOption(index: number) {
    if (!game.currentChapter || !encounter) return;

    const ch = game.currentChapter;
    const result = ch.resolveEncounter(index, ch.sessionCurrentHp, ch.sessionMaxHp);
    if (result) {
      if (result.skillsRemoved.length > 0 && result.skillsGained.length > 0) {
        setLog(prev => [...prev, `  교환: ${result.skillsRemoved.map(s => `${s.icon} ${s.name}`).join(', ')} → ${result.skillsGained.map(s => `${s.icon} ${s.name}`).join(', ')}`]);
      } else if (result.skillsGained.length > 0) {
        setLog(prev => [...prev, `  획득: ${result.skillsGained.map(s => `${s.icon} ${s.name}`).join(', ')}`]);
      }
      if (result.hpChange !== 0) {
        setLog(prev => [...prev, `  체력 변화: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
      }
      for (const r of result.reward.resources) {
        game.player.resources.add(r.type, r.amount);
        setLog(prev => [...prev, `  보상: +${r.amount} ${r.type}`]);
      }
    }

    setEncounter(null);
    refresh();
    setTimeout(() => advanceDay(), 300);
  }

  useEffect(() => {
    if (game.currentChapter && !encounter && !isBattling) {
      if (game.currentChapter.sessionMaxHp === 0) {
        const stats = game.player.computeStats();
        game.currentChapter.initSessionHp(stats.maxHp);
      }
      advanceDay();
    }
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const playerStats = game.player.computeStats();

  let effectiveAtk = playerStats.atk;
  let effectiveDef = playerStats.def;
  if (chapter) {
    for (const skill of chapter.getSessionPassiveSkills()) {
      if (skill.effect.type === PassiveType.STAT_MODIFIER) {
        const { stat, value, isPercentage } = skill.effect;
        if (stat === StatType.ATK) {
          effectiveAtk = isPercentage ? Math.floor(effectiveAtk * (1 + value)) : effectiveAtk + value;
        } else if (stat === StatType.DEF) {
          effectiveDef = isPercentage ? Math.floor(effectiveDef * (1 + value)) : effectiveDef + value;
        }
      }
    }
  }

  return (
    <div className="screen">
      <h2>모험</h2>

      {!chapter && !isBattling && !chapterResult && (
        <div>
          <div className="card">
            <div className="stat-row">
              <span>다음 챕터</span>
              <span>{game.player.clearedChapterMax + 1}</span>
            </div>
            <div className="stat-row">
              <span>스태미나 소모</span>
              <span>5</span>
            </div>
          </div>
          <div className="chapter-start-row">
            <button
              className="btn btn-primary flex-1"
              disabled={game.player.resources.stamina < 5}
              onClick={startChapter}
            >
              챕터 {game.player.clearedChapterMax + 1} 시작
            </button>
            <button
              className="btn btn-secondary flex-row gap-xs"
              onClick={() => setScreen('chapter-treasure')}
            >
              <Package size={16} />
              보물상자
            </button>
          </div>
        </div>
      )}

      {(chapter || isBattling) && !chapterResult && (
        <div>
          {chapter && (
            <div className="card chapter-card-header">
              <button
                className="btn-icon chapter-settings-btn"
                onClick={() => { setShowSettings(true); setSelectedSkillIndex(null); }}
                title="설정"
              >
                <Settings size={18} />
              </button>
              <div className="stat-row">
                <span>챕터 {chapter.id}</span>
                <span>{chapter.currentDay}일 / {chapter.totalDays}일</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${chapter.getProgress() * 100}%` }} />
              </div>
              <div className="stat-row">
                <span className="chapter-gold-label"><Coins size={13} color="#ffd700" /> 획득 골드</span>
                <span className="text-gold">{formatNumber(chapter.sessionGold)}</span>
              </div>
              {!isBattling && (
                <div className="stat-row">
                  <span>스킬</span>
                  <span>{chapter.sessionSkills.length}</span>
                </div>
              )}
              <div className="counter-bars">
                <div className="counter-bar-item">
                  <span className="counter-bar-label"><Zap size={11} /> 중박 {chapter.jungbakCount}/{EncounterDataTable.counterThreshold.jungbak}</span>
                  <div className="counter-bar-track jungbak">
                    <div className="counter-bar-fill jungbak" style={{ width: `${(chapter.jungbakCount / EncounterDataTable.counterThreshold.jungbak) * 100}%` }} />
                  </div>
                </div>
                <div className="counter-bar-item">
                  <span className="counter-bar-label"><Star size={11} /> 대박 {chapter.daebakCount}/{EncounterDataTable.counterThreshold.daebak}</span>
                  <div className="counter-bar-track daebak">
                    <div className="counter-bar-fill daebak" style={{ width: `${(chapter.daebakCount / EncounterDataTable.counterThreshold.daebak) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <AdventureStage
            isBattling={isBattling}
            playerUnit={playerUnit}
            enemyUnits={enemyUnits}
            attackPhase={attackPhase}
            damageEntries={damageEntries}
            turnCount={turnCount}
            maxTurns={MAX_BATTLE_TURNS}
            isBoss={isBossFight}
            battleLabel={battleType === 'elite' ? '엘리트' : battleType === 'midBoss' ? '보스' : battleType === 'boss' ? '최종 보스' : undefined}
            activeEnemyIndex={activeEnemyIndex}
            encounterType={encounter?.type}
            encounterOptionLabel={encounter?.options[0]?.label}
            skills={chapter?.sessionSkills}
            speedMultiplier={animSpeed}
          />

          {isBattling && playerUnit ? (
            <>
              <div className="chapter-battle-controls">
                <div className="flex-1">
                  <PlayerStatsBar
                    hp={playerUnit.currentHp}
                    maxHp={playerUnit.maxHp}
                    atk={playerUnit.getEffectiveAtk()}
                    def={playerUnit.getEffectiveDef()}
                  />
                </div>
                <button
                  className={`btn-icon ${battleSpeed === 2 ? 'active' : ''}`}
                  onClick={() => {
                    const next = battleSpeed === 1 ? 2 : 1;
                    setBattleSpeed(next);
                    battleSpeedRef.current = next;
                    setAnimSpeed(next);
                    localStorage.setItem('battleSpeed', String(next));
                  }}
                  title="배속"
                >
                  {battleSpeed === 2 ? <FastForward size={16} /> : <span className="text-bold" style={{ fontSize: 12 }}>1x</span>}
                </button>
                <button
                  className={`btn-icon ${showDamageGraph ? 'active' : ''}`}
                  onClick={() => setShowDamageGraph(v => { const next = !v; localStorage.setItem('showDamageGraph', String(next)); return next; })}
                  title="딜 그래프"
                >
                  <BarChart3 size={18} />
                </button>
              </div>
              {showDamageGraph && (
                <>
                  <DamageGraph sources={damageSourcesSnapshot} />
                  <DamageGraph sources={healSourcesSnapshot} title="회복 그래프" variant="heal" />
                </>
              )}
            </>
          ) : (
            <PlayerStatsBar
              hp={chapter ? chapter.sessionCurrentHp : playerStats.hp}
              maxHp={chapter ? chapter.sessionMaxHp : playerStats.maxHp}
              atk={effectiveAtk}
              def={effectiveDef}
            />
          )}

          {encounter && !isBattling && (
            <>
              <div className="ba-day-divider">{chapter!.currentDay}일차</div>
              <h3>{EncounterDataTable.getLabel(encounter.type)}</h3>
              <div className="text-sm text-secondary" style={{ marginBottom: 8 }}>
                {EncounterDataTable.getDescription(encounter.type)}
              </div>
              <div className="encounter-options">
                {encounter.options.map((opt, i) => (
                  <div key={i} className="encounter-option" onClick={() => selectOption(i)}>
                    <div className="text-bold">{opt.label}</div>
                    <div className="text-sm text-secondary">{opt.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showSettings && chapter && (
            <div className="modal-overlay">
              <h3 className="settings-modal-title">모험 설정</h3>

              <div className="settings-skill-count">
                보유 스킬 ({chapter.sessionSkills.length})
              </div>
              <div className="settings-skill-list">
                {chapter.sessionSkills.length === 0 && (
                  <div className="settings-empty">
                    획득한 스킬이 없습니다
                  </div>
                )}
                {chapter.sessionSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="settings-skill-item"
                    style={{ borderColor: selectedSkillIndex === i ? SKILL_GRADE_COLORS[skill.grade] : undefined }}
                    onClick={() => setSelectedSkillIndex(selectedSkillIndex === i ? null : i)}
                  >
                    <span
                      className="settings-skill-icon"
                      style={{ borderColor: SKILL_GRADE_COLORS[skill.grade] }}
                    >
                      {skill.icon}
                    </span>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="settings-skill-name" style={{ color: SKILL_GRADE_COLORS[skill.grade] }}>
                        {skill.name}
                      </div>
                      {selectedSkillIndex === i && (
                        <div className="settings-skill-desc">
                          {skill.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-actions">
                <button
                  className="btn btn-primary chapter-result-btn"
                  onClick={() => setShowSettings(false)}
                >
                  계속하기
                </button>
                <button
                  className="btn btn-secondary chapter-result-btn text-danger"
                  onClick={() => { setShowSettings(false); abandonChapter(); }}
                >
                  모험 포기하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {eliteReward && !isBattling && (
        <div>
          <AdventureStage isBattling={false} />
          <div className="golden-chest-overlay">
            <div className="golden-chest-icon">📦</div>
            <div className="golden-chest-title">금상자!</div>
            <div className="golden-chest-sub">신화 스킬 1개를 선택하세요</div>
            <div className="golden-chest-options">
              {eliteReward.map((skill, i) => (
                <div
                  key={i}
                  className="golden-chest-option"
                  onClick={() => {
                    if (game.currentChapter) {
                      const existingIdx = game.currentChapter.sessionSkills.findIndex(s => s.id === skill.id);
                      if (existingIdx >= 0) {
                        game.currentChapter.sessionSkills[existingIdx] = skill;
                      } else {
                        game.currentChapter.sessionSkills.push(skill);
                      }
                      setLog(prev => [...prev, `  금상자: ${skill.icon} ${skill.name} 획득`]);
                    }
                    setEliteReward(null);
                    refresh();
                    setTimeout(() => advanceDay(), 400);
                  }}
                >
                  <span className="golden-chest-skill-icon">{skill.icon}</span>
                  <div>
                    <div className="text-bold">{skill.name}</div>
                    <div className="text-sm text-secondary">{skill.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {chapterResult && !isBattling && (
        <div>
          <AdventureStage isBattling={false} />
          <div className="chapter-result-overlay">
            <div className={`chapter-result-icon ${chapterResult.type}`}>
              {chapterResult.type === 'victory' ? '🎉' : '💀'}
            </div>
            <div className={`chapter-result-title ${chapterResult.type}`}>
              {chapterResult.type === 'victory' ? '챕터 클리어!' : '챕터 실패'}
            </div>
            <div className="chapter-result-sub">
              챕터 {chapterResult.chapterId}
            </div>
            {(chapterResult.gold > 0 || (chapterResult.gems ?? 0) > 0) && (
              <div className="chapter-result-reward">
                {chapterResult.gold > 0 && <span className="text-gold">+{chapterResult.gold} G</span>}
                {(chapterResult.gems ?? 0) > 0 && <span className="text-purple" style={{ marginLeft: 8 }}>+{chapterResult.gems} 보석</span>}
              </div>
            )}
            {(damageSourcesSnapshot.length > 0 || healSourcesSnapshot.length > 0) && (
              <div className="chapter-result-graph">
                <button
                  className={`btn-icon ${showResultGraph ? 'active' : ''}`}
                  onClick={() => setShowResultGraph(v => !v)}
                  title="딜 그래프"
                >
                  <BarChart3 size={18} />
                </button>
                {showResultGraph && (
                  <div style={{ marginTop: 8 }}>
                    <DamageGraph sources={damageSourcesSnapshot} />
                    <DamageGraph sources={healSourcesSnapshot} title="회복 그래프" variant="heal" />
                  </div>
                )}
              </div>
            )}
            <div className="chapter-result-buttons">
              <button
                className="btn btn-primary chapter-result-btn"
                onClick={() => { setChapterResult(null); setShowResultGraph(false); setScreen('main'); }}
              >
                <Home size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                메인으로
              </button>
              {chapterResult.type === 'victory' && game.player.resources.stamina >= 5 && (
                <button
                  className="btn btn-secondary chapter-result-btn"
                  onClick={() => { setChapterResult(null); setShowResultGraph(false); startChapter(); }}
                >
                  <Swords size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  다음 챕터 시작
                </button>
              )}
              <button
                className="btn btn-secondary chapter-result-btn flex-center gap-xs"
                onClick={() => { setChapterResult(null); setShowResultGraph(false); setScreen('chapter-treasure'); }}
              >
                <Package size={16} />
                보물상자 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="battle-log" style={{ marginTop: 12 }}>

          {log.slice(-15).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
