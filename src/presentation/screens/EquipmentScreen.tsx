import { useGame } from '../GameContext';
import { SlotType, ResourceType } from '../../domain/enums';

const SLOT_LABELS: Record<SlotType, string> = {
  [SlotType.WEAPON]: '무기',
  [SlotType.ARMOR]: '방어구',
  [SlotType.RING]: '반지',
  [SlotType.ACCESSORY]: '장신구',
};

export function EquipmentScreen() {
  const { game, refresh } = useGame();
  const slots = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.ACCESSORY];

  function upgradeEquipment(slotType: SlotType, index: number) {
    const slot = game.player.getEquipmentSlot(slotType);
    const eq = slot.equipped[index];
    if (!eq) return;
    if (!game.player.resources.canAfford(ResourceType.EQUIPMENT_STONE, 1)) return;

    const result = eq.upgrade(game.player.resources.equipmentStones);
    if (result.isOk()) {
      game.player.resources.spend(ResourceType.EQUIPMENT_STONE, 1);
    }
    refresh();
  }

  return (
    <div className="screen">
      <h2>장비</h2>

      <div className="card">
        <div className="stat-row">
          <span>장비 강화석</span>
          <span>{game.player.resources.equipmentStones}</span>
        </div>
        <div className="stat-row">
          <span>파워 스톤</span>
          <span>{game.player.resources.powerStones}</span>
        </div>
      </div>

      {slots.map(slotType => {
        const slot = game.player.getEquipmentSlot(slotType);
        return (
          <div key={slotType}>
            <h3>{SLOT_LABELS[slotType]} ({slot.getEquipped().length}/{slot.maxCount})</h3>
            {slot.equipped.map((eq, i) => (
              <div className="equip-slot" key={i}>
                {eq ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className={`grade-${eq.grade.toLowerCase()}`}>
                          {eq.isS && <span className="grade-s">[S] </span>}
                          {eq.name}
                        </span>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {eq.grade} Lv.{eq.level} | ATK +{eq.getStats().atk} HP +{eq.getStats().maxHp}
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => upgradeEquipment(slotType, i)}
                        disabled={game.player.resources.equipmentStones < 1}
                      >
                        +1
                      </button>
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#555' }}>빈 슬롯</span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
