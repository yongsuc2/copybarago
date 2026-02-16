import { useGame } from '../GameContext';
import { ResourceType } from '../../domain/enums';
import { PetIcon } from '../components/PetIcon';
import { PetTable } from '../../domain/data/PetTable';

export function PetScreen() {
  const { game, refresh } = useGame();
  const pets = game.player.ownedPets;
  const activePet = game.player.activePet;

  function hatchEgg() {
    if (!game.player.resources.canAfford(ResourceType.PET_EGG, 1)) return;
    game.player.resources.spend(ResourceType.PET_EGG, 1);
    const pet = game.petManager.hatchEgg(game.rng);
    game.player.addPet(pet);
    if (!game.player.activePet) {
      game.player.setActivePet(pet);
    }
    game.saveGame();
    refresh();
  }

  function feedPet(petIndex: number) {
    const pet = pets[petIndex];
    if (!pet) return;
    if (!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)) return;
    game.player.resources.spend(ResourceType.PET_FOOD, 1);
    pet.feed(1);
    game.saveGame();
    refresh();
  }

  function setActive(petIndex: number) {
    game.player.setActivePet(pets[petIndex]);
    game.saveGame();
    refresh();
  }

  function getTemplateId(petName: string): string {
    const template = PetTable.getAllTemplates().find(t => t.name === petName);
    return template?.id ?? '';
  }

  return (
    <div className="screen">
      <h2>펫</h2>

      <div className="card">
        <div className="stat-row">
          <span>펫 알</span>
          <span>{game.player.resources.get(ResourceType.PET_EGG)}</span>
        </div>
        <div className="stat-row">
          <span>펫 먹이</span>
          <span>{game.player.resources.get(ResourceType.PET_FOOD)}</span>
        </div>
        <button
          className="btn btn-primary"
          disabled={!game.player.resources.canAfford(ResourceType.PET_EGG, 1)}
          onClick={hatchEgg}
          style={{ marginTop: 8 }}
        >
          알 부화
        </button>
      </div>

      {pets.length === 0 && (
        <div className="card"><span style={{ color: '#888' }}>보유한 펫이 없습니다</span></div>
      )}

      {pets.map((pet, i) => {
        const templateId = getTemplateId(pet.name);
        const abilityDesc = templateId ? PetTable.getAbilityDescription(templateId, pet.grade) : '';

        return (
          <div className="card" key={pet.id} style={{ borderColor: pet === activePet ? '#e94560' : '#333' }}>
            <div className="pet-card-header">
              <PetIcon petId={templateId} tier={pet.tier} size={44} />
              <div style={{ flex: 1 }}>
                <div className="card-header" style={{ marginBottom: 0 }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>{pet.name}</span>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                      [{pet.tier}] {pet.grade}
                    </span>
                  </div>
                  <span style={{ fontSize: 12 }}>{pet.level}레벨</span>
                </div>
                <div className="stat-row" style={{ marginTop: 4 }}>
                  <span>공격력 +{pet.getGlobalBonus().atk}</span>
                  <span>체력 +{pet.getGlobalBonus().maxHp}</span>
                </div>
              </div>
            </div>
            {abilityDesc && (
              <div className="pet-ability">
                <span className="pet-ability-label">특수능력</span>
                <span>{abilityDesc}</span>
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
              {pet !== activePet && (
                <button className="btn btn-primary" onClick={() => setActive(i)}>출전</button>
              )}
              {pet === activePet && (
                <button className="btn btn-secondary" disabled>출전 중</button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => feedPet(i)}
                disabled={!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)}
              >
                먹이주기
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
