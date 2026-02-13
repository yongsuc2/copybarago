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
  side: 'player' | 'enemy';
}

let popupIdCounter = 0;

export type AttackPhase = 'idle' | 'player-approach' | 'player-hit' | 'player-retreat' | 'enemy-approach' | 'enemy-hit' | 'enemy-retreat';

interface BattleArenaProps {
  playerUnit: BattleUnit;
  enemyUnit: BattleUnit;
  attackPhase: AttackPhase;
  damageEntries: BattleLogEntry[];
  turnCount: number;
  maxTurns: number;
  isBoss: boolean;
}

export function BattleArena({ playerUnit, enemyUnit, attackPhase, damageEntries, turnCount, maxTurns, isBoss }: BattleArenaProps) {
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
        || entry.type === BattleLogType.DOT_DAMAGE;

      if (!isDamageType && !isHealType) continue;
      if (entry.value === 0) continue;

      const targetIsPlayer = entry.target === playerUnit.name;
      newPopups.push({
        id: ++popupIdCounter,
        value: entry.value,
        isHeal: isHealType,
        isCrit: entry.type === BattleLogType.CRIT,
        side: targetIsPlayer ? 'player' : 'enemy',
      });
    }

    setPopups(newPopups);
    const timer = setTimeout(() => setPopups([]), 600);
    return () => clearTimeout(timer);
  }, [damageEntries, playerUnit.name]);

  const playerHpPct = playerUnit.maxHp > 0 ? (playerUnit.currentHp / playerUnit.maxHp) * 100 : 0;
  const enemyHpPct = enemyUnit.maxHp > 0 ? (enemyUnit.currentHp / enemyUnit.maxHp) * 100 : 0;

  const playerType = getCharacterType(playerUnit.name);
  const enemyType = getCharacterType(enemyUnit.name);

  const playerPopups = popups.filter(p => p.side === 'player');
  const enemyPopups = popups.filter(p => p.side === 'enemy');

  const isPlayerApproach = attackPhase === 'player-approach' || attackPhase === 'player-hit';
  const isEnemyApproach = attackPhase === 'enemy-approach' || attackPhase === 'enemy-hit';
  const isPlayerHit = attackPhase === 'enemy-hit';
  const isEnemyHit = attackPhase === 'player-hit';

  return (
    <div className="battle-arena">
      <div className="ba-turn-counter">
        {isBoss && <span className="ba-boss-badge">BOSS</span>}
        <span>턴 {turnCount}/{maxTurns}</span>
      </div>

      <div className="ba-field">
        <div className={`ba-character ${isPlayerApproach ? 'ba-move-right' : ''} ${isPlayerHit ? 'ba-hit' : ''}`}>
          <div className="ba-popup-area">
            {playerPopups.map(p => (
              <span
                key={p.id}
                className={`ba-damage-popup ${p.isHeal ? 'heal' : 'damage'} ${p.isCrit ? 'crit' : ''}`}
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
        </div>

        <div className="ba-vs">VS</div>

        <div className={`ba-character ${isEnemyApproach ? 'ba-move-left' : ''} ${isEnemyHit ? 'ba-hit' : ''}`}>
          <div className="ba-popup-area">
            {enemyPopups.map(p => (
              <span
                key={p.id}
                className={`ba-damage-popup ${p.isHeal ? 'heal' : 'damage'} ${p.isCrit ? 'crit' : ''}`}
              >
                {p.isHeal ? '+' : '-'}{formatNumber(p.value)}
              </span>
            ))}
          </div>
          <CharacterSprite type={enemyType} size={72} isBoss={isBoss} />
          <div className="ba-hp-bar-wrap">
            <div className="ba-hp-bar">
              <div className="ba-hp-fill enemy" style={{ width: `${enemyHpPct}%` }} />
            </div>
            <span className="ba-power">{formatNumber(enemyUnit.maxHp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
