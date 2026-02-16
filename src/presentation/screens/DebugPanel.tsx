import { useState } from 'react';
import { useGame } from '../GameContext';
import { EquipmentGrade, ResourceType, SlotType, WeaponSubType } from '../../domain/enums';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentDataTable } from '../../domain/data/EquipmentDataTable';

const GRADES = [
  EquipmentGrade.COMMON,
  EquipmentGrade.UNCOMMON,
  EquipmentGrade.RARE,
  EquipmentGrade.EPIC,
  EquipmentGrade.LEGENDARY,
  EquipmentGrade.MYTHIC,
];

const GRADE_LABELS = EquipmentDataTable.gradeLabels;

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];

export function DebugPanel() {
  const { game, refresh } = useGame();
  const [selectedGrade, setSelectedGrade] = useState<EquipmentGrade>(EquipmentGrade.EPIC);
  const [chapterInput, setChapterInput] = useState('');

  function addResource(type: ResourceType, amount: number) {
    game.player.resources.add(type, amount);
    game.saveGame();
    refresh();
  }

  function fillStamina() {
    game.player.resources.setAmount(ResourceType.STAMINA, 100);
    game.saveGame();
    refresh();
  }

  function fillDailyTokens() {
    game.player.resources.setAmount(ResourceType.CHALLENGE_TOKEN, 5);
    game.player.resources.setAmount(ResourceType.ARENA_TICKET, 5);
    game.player.resources.setAmount(ResourceType.PICKAXE, 10);
    game.saveGame();
    refresh();
  }

  function createEquipment() {
    const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const weaponSubTypes = [WeaponSubType.SWORD, WeaponSubType.STAFF, WeaponSubType.BOW];
    const subType = slot === SlotType.WEAPON ? weaponSubTypes[Math.floor(Math.random() * 3)] : null;
    const slotLabel = slot === SlotType.WEAPON && subType
      ? EquipmentDataTable.getWeaponSubTypeLabel(subType)
      : EquipmentDataTable.getSlotLabel(slot);
    const eq = new Equipment(
      `debug_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      `${GRADE_LABELS[selectedGrade]} ${slotLabel}`,
      slot,
      selectedGrade,
      false,
      0, 0, null,
      subType,
    );
    game.player.addToInventory(eq);
    game.saveGame();
    refresh();
  }

  function setChapter() {
    const val = parseInt(chapterInput, 10);
    if (!isNaN(val) && val >= 0) {
      game.player.clearedChapterMax = val;
      game.travel.maxClearedChapter = Math.max(1, val);
      game.saveGame();
      refresh();
    }
  }

  function resetSave() {
    localStorage.clear();
    window.location.reload();
  }

  function completeAllQuests() {
    for (const event of game.eventManager.getActiveEvents()) {
      for (const mission of event.missions) {
        mission.current = mission.target;
      }
    }
    game.saveGame();
    refresh();
  }

  return (
    <div className="debug-panel">
      <h3 style={{ margin: '0 0 12px', color: '#f5a623' }}>디버그 패널</h3>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>재화 추가</div>
        <div className="debug-row">
          <button className="debug-btn" onClick={() => addResource(ResourceType.GOLD, 10000)}>
            골드 +10000
          </button>
          <button className="debug-btn" onClick={() => addResource(ResourceType.GEMS, 1000)}>
            보석 +1000
          </button>
          <button className="debug-btn" onClick={() => addResource(ResourceType.EQUIPMENT_STONE, 50)}>
            장비석 +50
          </button>
          <button className="debug-btn" onClick={() => addResource(ResourceType.POWER_STONE, 10)}>
            파워스톤 +10
          </button>
        </div>
      </div>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>충전</div>
        <div className="debug-row">
          <button className="debug-btn" onClick={fillStamina}>스태미나 충전</button>
          <button className="debug-btn" onClick={fillDailyTokens}>일일 토큰 충전</button>
        </div>
      </div>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>장비 생성</div>
        <div className="debug-row">
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value as EquipmentGrade)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          >
            {GRADES.map(g => (
              <option key={g} value={g}>{GRADE_LABELS[g]}</option>
            ))}
          </select>
          <button className="debug-btn" onClick={createEquipment}>생성</button>
        </div>
      </div>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>챕터 진행</div>
        <div className="debug-row">
          <input
            type="number"
            value={chapterInput}
            onChange={e => setChapterInput(e.target.value)}
            placeholder="챕터 번호"
            style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
          />
          <button className="debug-btn" onClick={setChapter}>설정</button>
        </div>
      </div>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>퀘스트</div>
        <div className="debug-row">
          <button className="debug-btn" onClick={completeAllQuests}>모든 퀘스트 완료</button>
        </div>
      </div>

      <div className="debug-section">
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>초기화</div>
        <div className="debug-row">
          <button className="debug-btn" style={{ color: '#ff5252' }} onClick={resetSave}>세이브 초기화</button>
        </div>
      </div>
    </div>
  );
}
