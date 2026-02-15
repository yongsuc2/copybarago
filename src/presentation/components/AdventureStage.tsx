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
  enemyUnit?: BattleUnit | null;
  attackPhase?: AttackPhase;
  damageEntries?: BattleLogEntry[];
  turnCount?: number;
  maxTurns?: number;
  isBoss?: boolean;
  encounterType?: EncounterType | null;
  encounterOptionLabel?: string;
}

export function AdventureStage({
  isBattling,
  playerUnit,
  enemyUnit,
  attackPhase = 'idle',
  damageEntries = [],
  turnCount = 0,
  maxTurns = 15,
  isBoss = false,
  encounterType,
  encounterOptionLabel,
}: AdventureStageProps) {
  if (isBattling && playerUnit && enemyUnit) {
    return (
      <div className="adventure-stage">
        <BattleArena
          playerUnit={playerUnit}
          enemyUnit={enemyUnit}
          attackPhase={attackPhase}
          damageEntries={damageEntries}
          turnCount={turnCount}
          maxTurns={maxTurns}
          isBoss={isBoss}
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
