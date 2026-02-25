import { useState } from 'react';
import { useGame } from '../GameContext';
import { ResourceType, PetGrade } from '../../domain/enums';
import { PetIcon } from '../components/PetIcon';
import { PetTable } from '../../domain/data/PetTable';
import type { Pet } from '../../domain/entities/Pet';

const GRADE_COLORS: Record<PetGrade, string> = {
  [PetGrade.COMMON]: '#888',
  [PetGrade.RARE]: '#2196f3',
  [PetGrade.EPIC]: '#9c27b0',
  [PetGrade.LEGENDARY]: '#ff9800',
  [PetGrade.IMMORTAL]: '#e94560',
};

const STAT_PER_LEVEL = 2;

export function PetScreen() {
  const { game, refresh } = useGame();
  const pets = game.player.ownedPets;
  const activePet = game.player.activePet;
  const [selectedIdx, setSelectedIdx] = useState<number>(
    activePet ? pets.indexOf(activePet) : 0,
  );

  const selected = pets[selectedIdx] ?? null;

  function getTemplateId(petName: string): string {
    const template = PetTable.getAllTemplates().find(t => t.name === petName);
    return template?.id ?? '';
  }

  function hatchEgg() {
    if (!game.player.resources.canAfford(ResourceType.PET_EGG, 1)) return;
    game.player.resources.spend(ResourceType.PET_EGG, 1);
    const pet = game.petManager.hatchEgg(game.rng);
    game.player.addPet(pet);
    if (!game.player.activePet) {
      game.player.setActivePet(pet);
    }
    setSelectedIdx(game.player.ownedPets.length - 1);
    game.saveGame();
    refresh();
  }

  function feedPet() {
    if (!selected) return;
    if (!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)) return;
    game.player.resources.spend(ResourceType.PET_FOOD, 1);
    selected.feed(1);
    game.saveGame();
    refresh();
  }

  function calcFeedInfo(pet: Pet): { targetLevel: number; foodNeeded: number } {
    const expForLevel = (lv: number) => 100 + (lv - 1) * 20;
    const totalFood = game.player.resources.get(ResourceType.PET_FOOD);
    let simLevel = pet.level;
    let simExp = pet.exp + totalFood * 10;
    while (simExp >= expForLevel(simLevel)) {
      simExp -= expForLevel(simLevel);
      simLevel += 1;
    }
    let expNeeded = -pet.exp;
    for (let lv = pet.level; lv < simLevel; lv++) {
      expNeeded += expForLevel(lv);
    }
    return { targetLevel: simLevel, foodNeeded: Math.ceil(expNeeded / 10) };
  }

  function feedToMaxLevel() {
    if (!selected) return;
    const { foodNeeded } = calcFeedInfo(selected);
    if (foodNeeded <= 0) return;
    game.player.resources.spend(ResourceType.PET_FOOD, foodNeeded);
    selected.feed(foodNeeded);
    game.saveGame();
    refresh();
  }

  function setActive() {
    if (!selected || selected === activePet) return;
    game.player.setActivePet(selected);
    game.saveGame();
    refresh();
  }

  function renderSelectedPet() {
    if (!selected) return null;

    const templateId = getTemplateId(selected.name);
    const abilityDesc = templateId ? PetTable.getAbilityDescription(templateId, selected.grade) : '';
    const bonus = selected.getGlobalBonus();
    const nextLevelBonus = {
      atk: (selected.level + 1) * STAT_PER_LEVEL,
      maxHp: (selected.level + 1) * STAT_PER_LEVEL * 2,
    };
    const feedInfo = calcFeedInfo(selected);
    const expProgress = selected.exp / selected.getExpToNextLevel();

    return (
      <>
        <div className="pet-showcase">
          <div className="pet-showcase-icon">
            <PetIcon petId={templateId} tier={selected.tier} size={96} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selected.name}</div>
          <div style={{ fontSize: 12, color: GRADE_COLORS[selected.grade] }}>
            [{selected.tier}] {selected.grade}
          </div>
          {selected === activePet && (
            <span className="pet-active-badge">출전 중</span>
          )}
        </div>

        <div className="card" style={{ marginTop: 8 }}>
          <div className="stat-row">
            <span style={{ fontWeight: 'bold', fontSize: 15 }}>Lv.{selected.level}</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>
              EXP {selected.exp} / {selected.getExpToNextLevel()}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 5, marginTop: 4 }}>
            <div className="progress-fill" style={{ width: `${expProgress * 100}%` }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'center' }}>
            <div className="pet-stat-box">
              <span className="pet-stat-label">ATK</span>
              <span className="pet-stat-value">+{bonus.atk}</span>
            </div>
            <div className="pet-stat-box">
              <span className="pet-stat-label">HP</span>
              <span className="pet-stat-value">+{bonus.maxHp}</span>
            </div>
            <div className="pet-stat-box">
              <span className="pet-stat-label">DEF</span>
              <span className="pet-stat-value">+{bonus.def}</span>
            </div>
          </div>

          <div className="pet-levelup-preview">
            <span style={{ color: '#aaa', fontSize: 11 }}>Lv.{selected.level + 1} 효과</span>
            <span style={{ color: '#4caf50', fontSize: 11 }}>
              ATK +{nextLevelBonus.atk} / HP +{nextLevelBonus.maxHp}
            </span>
          </div>

          {abilityDesc && (
            <div className="pet-ability" style={{ marginTop: 8 }}>
              <span className="pet-ability-label">특수능력</span>
              <span>{abilityDesc}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {selected !== activePet && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={setActive}>출전</button>
          )}
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={feedPet}
            disabled={!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)}
          >
            먹이주기 ({Math.ceil((selected.getExpToNextLevel() - selected.exp) / 10)}개→Lv Up)
          </button>
          {feedInfo.targetLevel > selected.level && (
            <button
              className="btn btn-secondary"
              onClick={feedToMaxLevel}
              style={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span style={{ fontSize: 14 }}>&#x2B06;</span>
              Lv.{feedInfo.targetLevel}
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="screen">
      <h2>펫</h2>

      <div className="pet-resource-bar">
        <span>펫 알 {game.player.resources.get(ResourceType.PET_EGG)}</span>
        <span>먹이 {game.player.resources.get(ResourceType.PET_FOOD)}</span>
        <button
          className="btn btn-primary"
          disabled={!game.player.resources.canAfford(ResourceType.PET_EGG, 1)}
          onClick={hatchEgg}
          style={{ padding: '3px 10px', fontSize: 12 }}
        >
          부화
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#888', padding: 24 }}>
          보유한 펫이 없습니다
        </div>
      ) : (
        <>
          {renderSelectedPet()}

          <div className="pet-icon-grid">
            {pets.map((pet, i) => {
              const templateId = getTemplateId(pet.name);
              const isSelected = i === selectedIdx;
              const isActive = pet === activePet;

              return (
                <div
                  key={pet.id}
                  className={`pet-icon-box${isSelected ? ' selected' : ''}`}
                  style={{ background: GRADE_COLORS[pet.grade] + '30', borderColor: isSelected ? '#fff' : GRADE_COLORS[pet.grade] }}
                  onClick={() => setSelectedIdx(i)}
                >
                  <PetIcon petId={templateId} tier={pet.tier} size={36} />
                  {isActive && <span className="pet-icon-active-dot" />}
                  <span className="pet-icon-level">Lv.{pet.level}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
