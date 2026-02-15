import { EncounterType } from '../../domain/enums';
import type { BattleUnit } from '../../domain/battle/BattleUnit';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleArena, type AttackPhase } from './BattleArena';
import { CharacterSprite } from './CharacterSprite';

const ENCOUNTER_EMOJI: Record<EncounterType, string> = {
  [EncounterType.COMBAT]: '⚔️',
  [EncounterType.ANGEL]: '😇',
  [EncounterType.DEMON]: '😈',
  [EncounterType.CHANCE]: '🎁',
  [EncounterType.JUNGBAK_ROULETTE]: '🎲',
  [EncounterType.DAEBAK_ROULETTE]: '⭐',
};

function getChanceEmoji(optionLabel?: string): string {
  if (!optionLabel) return '🎁';
  if (optionLabel.includes('샘')) return '💧';
  if (optionLabel.includes('축복')) return '✨';
  return '🎁';
}

interface AdventureStageProps {
  isBattling: boolean;
  playerUnit?: BattleUnit | null;
  enemyUnits?: BattleUnit[];
  attackPhase?: AttackPhase;
  damageEntries?: BattleLogEntry[];
  turnCount?: number;
  maxTurns?: number;
  isBoss?: boolean;
  battleLabel?: string;
  activeEnemyIndex?: number;
  encounterType?: EncounterType | null;
  encounterOptionLabel?: string;
  speedMultiplier?: number;
}

export function AdventureStage({
  isBattling,
  playerUnit,
  enemyUnits,
  attackPhase = 'idle',
  damageEntries = [],
  turnCount = 0,
  maxTurns = 15,
  isBoss = false,
  battleLabel,
  activeEnemyIndex = 0,
  encounterType,
  encounterOptionLabel,
  speedMultiplier = 1,
}: AdventureStageProps) {
  if (isBattling && playerUnit && enemyUnits && enemyUnits.length > 0) {
    return (
      <div className="adventure-stage">
        <BattleArena
          playerUnit={playerUnit}
          enemyUnits={enemyUnits}
          attackPhase={attackPhase}
          damageEntries={damageEntries}
          turnCount={turnCount}
          maxTurns={maxTurns}
          isBoss={isBoss}
          battleLabel={battleLabel}
          activeEnemyIndex={activeEnemyIndex}
          speedMultiplier={speedMultiplier}
        />
      </div>
    );
  }

  const emoji = encounterType
    ? encounterType === EncounterType.CHANCE
      ? getChanceEmoji(encounterOptionLabel)
      : ENCOUNTER_EMOJI[encounterType]
    : null;

  return (
    <div className="adventure-stage">
      <div className="ba-field">
        <div className="ba-character">
          <CharacterSprite type="capybara" size={72} />
        </div>

        {emoji && (
          <div className="stage-encounter-visual">
            <span className="stage-encounter-emoji">{emoji}</span>
          </div>
        )}
      </div>
    </div>
  );
}
