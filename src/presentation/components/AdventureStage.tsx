import { EncounterType, SkillGrade } from '../../domain/enums';
import type { BattleUnit } from '../../domain/battle/BattleUnit';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import type { Skill } from '../../domain/entities/Skill';
import { BattleArena, type AttackPhase } from './BattleArena';
import { CharacterSprite } from './CharacterSprite';

const SKILL_GRADE_COLORS: Record<SkillGrade, string> = {
  [SkillGrade.NORMAL]: '#aaa',
  [SkillGrade.LEGENDARY]: '#ff9800',
  [SkillGrade.MYTHIC]: '#e94560',
  [SkillGrade.IMMORTAL]: '#ffd700',
};

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
  skills?: Skill[];
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
  skills = [],
}: AdventureStageProps) {
  const skillIcons = skills.length > 0 ? (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 3,
      padding: '3px 0',
    }}>
      {skills.map((skill, i) => (
        <span
          key={i}
          title={`${skill.name}: ${skill.description}`}
          style={{
            fontSize: 12,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a2e',
            borderRadius: 3,
            border: `1px solid ${SKILL_GRADE_COLORS[skill.grade]}`,
          }}
        >
          {skill.icon}
        </span>
      ))}
    </div>
  ) : null;
  if (isBattling && playerUnit && enemyUnits && enemyUnits.length > 0) {
    return (
      <div className="adventure-stage">
        {skillIcons}
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
      {skillIcons}
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
