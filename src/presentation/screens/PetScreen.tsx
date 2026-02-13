import { useGame } from '../GameContext';
import { ResourceType } from '../../domain/enums';

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
    refresh();
  }

  function feedPet(petIndex: number) {
    const pet = pets[petIndex];
    if (!pet) return;
    if (!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)) return;
    game.player.resources.spend(ResourceType.PET_FOOD, 1);
    pet.feed(1);
    refresh();
  }

  function setActive(petIndex: number) {
    game.player.setActivePet(pets[petIndex]);
    refresh();
  }

  return (
    <div className="screen">
      <h2>Pets</h2>

      <div className="card">
        <div className="stat-row">
          <span>Pet Eggs</span>
          <span>{game.player.resources.get(ResourceType.PET_EGG)}</span>
        </div>
        <div className="stat-row">
          <span>Pet Food</span>
          <span>{game.player.resources.get(ResourceType.PET_FOOD)}</span>
        </div>
        <button
          className="btn btn-primary"
          disabled={!game.player.resources.canAfford(ResourceType.PET_EGG, 1)}
          onClick={hatchEgg}
          style={{ marginTop: 8 }}
        >
          Hatch Egg
        </button>
      </div>

      {pets.length === 0 && (
        <div className="card"><span style={{ color: '#888' }}>No pets yet</span></div>
      )}

      {pets.map((pet, i) => (
        <div className="card" key={pet.id} style={{ borderColor: pet === activePet ? '#e94560' : '#333' }}>
          <div className="card-header">
            <div>
              <span style={{ fontWeight: 'bold' }}>{pet.name}</span>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                [{pet.tier}] {pet.grade}
              </span>
            </div>
            <span style={{ fontSize: 12 }}>Lv.{pet.level}</span>
          </div>
          <div className="stat-row">
            <span>ATK +{pet.getGlobalBonus().atk}</span>
            <span>HP +{pet.getGlobalBonus().maxHp}</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
            {pet !== activePet && (
              <button className="btn btn-primary" onClick={() => setActive(i)}>Set Active</button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => feedPet(i)}
              disabled={!game.player.resources.canAfford(ResourceType.PET_FOOD, 1)}
            >
              Feed
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
