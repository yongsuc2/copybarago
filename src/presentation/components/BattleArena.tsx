import { useState, useEffect } from 'react';
import type { BattleUnit } from '../../domain/battle/BattleUnit';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleLogType } from '../../domain/battle/BattleLog';
import { CharacterSprite, getCharacterType } from './CharacterSprite';
import { formatNumber } from './PlayerStatsBar';

interface DamagePopup {
  id: number;
  value: number;
  isHeal: boolean;
  isCrit: boolean;
  isRage: boolean;
  side: 'player' | 'enemy';
  enemyIndex: number;
}

let popupIdCounter = 0;

export type AttackPhase = 'idle' | 'player-approach' | 'player-hit' | 'player-retreat' | 'enemy-approach' | 'enemy-hit' | 'enemy-retreat';

interface BattleArenaProps {
  playerUnit: BattleUnit;
  enemyUnits: BattleUnit[];
  attackPhase: AttackPhase;
  damageEntries: BattleLogEntry[];
  turnCount: number;
  maxTurns: number;
  isBoss: boolean;
  battleLabel?: string;
  activeEnemyIndex?: number;
  speedMultiplier?: number;
}

export function BattleArena({ playerUnit, enemyUnits, attackPhase, damageEntries, turnCount, maxTurns, isBoss, battleLabel, activeEnemyIndex = 0, speedMultiplier = 1 }: BattleArenaProps) {
  const [popups, setPopups] = useState<DamagePopup[]>([]);

  useEffect(() => {
    if (damageEntries.length === 0) return;

    const newPopups: DamagePopup[] = [];
    for (const entry of damageEntries) {
      const isHealType = entry.type === BattleLogType.LIFESTEAL
        || entry.type === BattleLogType.HOT_HEAL
        || entry.type === BattleLogType.REVIVE;
      const isDamageType = entry.type === BattleLogType.ATTACK
        || entry.type === BattleLogType.SKILL_DAMAGE
        || entry.type === BattleLogType.COUNTER
        || entry.type === BattleLogType.CRIT
        || entry.type === BattleLogType.DOT_DAMAGE
        || entry.type === BattleLogType.RAGE_ATTACK;

      if (!isDamageType && !isHealType) continue;
      if (entry.value === 0) continue;

      const targetIsPlayer = entry.target === playerUnit.name;
      let eIdx = -1;
      if (!targetIsPlayer) {
        eIdx = enemyUnits.findIndex(e => e.name === entry.target);
        if (eIdx < 0) eIdx = 0;
      }

      newPopups.push({
        id: ++popupIdCounter,
        value: entry.value,
        isHeal: isHealType,
        isCrit: entry.type === BattleLogType.CRIT,
        isRage: entry.type === BattleLogType.RAGE_ATTACK,
        side: targetIsPlayer ? 'player' : 'enemy',
        enemyIndex: eIdx,
      });
    }

    setPopups(newPopups);
    const timer = setTimeout(() => setPopups([]), 600 / speedMultiplier);
    return () => clearTimeout(timer);
  }, [damageEntries, playerUnit.name, enemyUnits, speedMultiplier]);

  const playerHpPct = playerUnit.maxHp > 0 ? (playerUnit.currentHp / playerUnit.maxHp) * 100 : 0;
  const playerType = getCharacterType(playerUnit.name);
  const playerPopups = popups.filter(p => p.side === 'player');

  const isPlayerApproach = attackPhase === 'player-approach' || attackPhase === 'player-hit';
  const isEnemyApproach = attackPhase === 'enemy-approach' || attackPhase === 'enemy-hit';
  const isPlayerHit = attackPhase === 'enemy-hit';
  const isEnemyHit = attackPhase === 'player-hit';

  const skillEntry = damageEntries.find(e => e.type === BattleLogType.SKILL_DAMAGE && e.skillName);
  const attackerIsPlayer = attackPhase.startsWith('player-');
  const attackerIsEnemy = attackPhase.startsWith('enemy-');

  const spriteSize = enemyUnits.length > 1 ? 56 : 72;

  return (
    <div className="battle-arena" style={{ '--battle-speed': speedMultiplier } as React.CSSProperties}>
      <div className="ba-turn-counter">
        {battleLabel && <span className="ba-boss-badge">{battleLabel}</span>}
        <span>턴 {turnCount}/{maxTurns}</span>
      </div>

      <div className="ba-field">
        <div className={`ba-character ${isPlayerApproach ? 'ba-move-right' : ''} ${isPlayerHit ? 'ba-hit' : ''}`}>
          {skillEntry && attackerIsPlayer && (
            <div className="ba-skill-indicator">
              {skillEntry.skillIcon && <span>{skillEntry.skillIcon}</span>}
              <span>{skillEntry.skillName}</span>
            </div>
          )}
          <div className="ba-popup-area">
            {playerPopups.map(p => (
              <span
                key={p.id}
                className={`ba-damage-popup ${p.isHeal ? 'heal' : 'damage'} ${p.isCrit ? 'crit' : ''} ${p.isRage ? 'rage' : ''}`}
              >
                {p.isHeal ? '+' : '-'}{formatNumber(p.value)}
              </span>
            ))}
          </div>
          <CharacterSprite type={playerType} size={72} />
          <div className="ba-hp-bar-wrap">
            <div className="ba-hp-bar">
              <div className="ba-hp-fill player" style={{ width: `${playerHpPct}%` }} />
            </div>
            <span className="ba-power">{formatNumber(playerUnit.maxHp)}</span>
          </div>
          {playerUnit.ragePerAttack > 0 && (
            <div className="ba-rage-bar-wrap">
              <div className="ba-rage-bar">
                <div className="ba-rage-fill" style={{ width: `${(playerUnit.rage / playerUnit.maxRage) * 100}%` }} />
              </div>
              <span className="ba-rage-label">💢 {playerUnit.rage}/{playerUnit.maxRage}</span>
            </div>
          )}
        </div>

        <div className="ba-vs">대</div>

        <div className="ba-enemies">
          {enemyUnits.map((eu, i) => {
            const eHpPct = eu.maxHp > 0 ? (eu.currentHp / eu.maxHp) * 100 : 0;
            const eType = getCharacterType(eu.name);
            const ePopups = popups.filter(p => p.side === 'enemy' && p.enemyIndex === i);
            const isActive = i === activeEnemyIndex;
            const thisApproach = isEnemyApproach && isActive;
            const thisHit = isEnemyHit && isActive;
            const isDead = eu.currentHp <= 0;

            return (
              <div key={i} className={`ba-character ${thisApproach ? 'ba-move-left' : ''} ${thisHit ? 'ba-hit' : ''} ${isDead ? 'ba-dead' : ''}`}>
                {skillEntry && attackerIsEnemy && isActive && (
                  <div className="ba-skill-indicator">
                    {skillEntry.skillIcon && <span>{skillEntry.skillIcon}</span>}
                    <span>{skillEntry.skillName}</span>
                  </div>
                )}
                <div className="ba-popup-area">
                  {ePopups.map(p => (
                    <span
                      key={p.id}
                      className={`ba-damage-popup ${p.isHeal ? 'heal' : 'damage'} ${p.isCrit ? 'crit' : ''} ${p.isRage ? 'rage' : ''}`}
                    >
                      {p.isHeal ? '+' : '-'}{formatNumber(p.value)}
                    </span>
                  ))}
                </div>
                <CharacterSprite type={eType} size={spriteSize} isBoss={isBoss && enemyUnits.length === 1} />
                {eu.shield > 0 && (
                  <div className="ba-shield-bar-wrap">
                    <div className="ba-shield-bar">
                      <div className="ba-shield-fill" style={{ width: `${Math.min(100, (eu.shield / eu.maxHp) * 100)}%` }} />
                    </div>
                    <span className="ba-shield-label">🔰 {formatNumber(eu.shield)}</span>
                  </div>
                )}
                <div className="ba-hp-bar-wrap">
                  <div className="ba-hp-bar">
                    <div className="ba-hp-fill enemy" style={{ width: `${eHpPct}%` }} />
                  </div>
                  <span className="ba-power">{formatNumber(eu.maxHp)}</span>
                </div>
                {eu.ragePerAttack > 0 && (
                  <div className="ba-rage-bar-wrap">
                    <div className="ba-rage-bar">
                      <div className="ba-rage-fill" style={{ width: `${(eu.rage / eu.maxRage) * 100}%` }} />
                    </div>
                    <span className="ba-rage-label">💢 {eu.rage}/{eu.maxRage}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
