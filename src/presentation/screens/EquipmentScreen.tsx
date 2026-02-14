import { useState } from 'react';
import { useGame } from '../GameContext';
import { SlotType, ResourceType, EquipmentGrade } from '../../domain/enums';
import { EquipmentTable } from '../../domain/data/EquipmentTable';
import type { Equipment } from '../../domain/entities/Equipment';

const SLOT_LABELS: Record<SlotType, string> = {
  [SlotType.WEAPON]: '무기',
  [SlotType.ARMOR]: '방어구',
  [SlotType.RING]: '반지',
  [SlotType.ACCESSORY]: '장신구',
};

const GRADE_LABELS: Record<EquipmentGrade, string> = {
  [EquipmentGrade.COMMON]: '일반',
  [EquipmentGrade.UNCOMMON]: '우수',
  [EquipmentGrade.RARE]: '희귀',
  [EquipmentGrade.EPIC]: '에픽',
  [EquipmentGrade.LEGENDARY]: '전설',
  [EquipmentGrade.MYTHIC]: '신화',
};

const SELL_PRICES: Record<EquipmentGrade, number> = {
  [EquipmentGrade.COMMON]: 10,
  [EquipmentGrade.UNCOMMON]: 30,
  [EquipmentGrade.RARE]: 100,
  [EquipmentGrade.EPIC]: 300,
  [EquipmentGrade.LEGENDARY]: 1000,
  [EquipmentGrade.MYTHIC]: 3000,
};

type Tab = 'equipped' | 'inventory' | 'forge';
type SlotFilter = 'all' | SlotType;

export function EquipmentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<Tab>('equipped');
  const [filter, setFilter] = useState<SlotFilter>('all');
  const [selectedMergeIndex, setSelectedMergeIndex] = useState<number | null>(null);
  const slots = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.ACCESSORY];

  const mergeCandidates = game.forge.findMergeCandidates(game.player.inventory);

  function upgradeEquipment(slotType: SlotType, index: number) {
    const slot = game.player.getEquipmentSlot(slotType);
    const eq = slot.equipped[index];
    if (!eq) return;
    if (!game.player.resources.canAfford(ResourceType.EQUIPMENT_STONE, 1)) return;

    const result = eq.upgrade(game.player.resources.equipmentStones);
    if (result.isOk()) {
      game.player.resources.spend(ResourceType.EQUIPMENT_STONE, 1);
      game.saveGame();
    }
    refresh();
  }

  function unequip(slotType: SlotType, index: number) {
    game.player.unequipToInventory(slotType, index);
    game.saveGame();
    refresh();
  }

  function equipFromInventory(id: string) {
    game.player.equipFromInventory(id);
    game.saveGame();
    refresh();
  }

  function sell(id: string) {
    const price = game.player.sellEquipment(id);
    if (price > 0) {
      game.updateQuestProgress('weekly_sell');
      game.saveGame();
    }
    refresh();
  }

  function mergeEquipment(group: Equipment[]) {
    const result = game.forge.merge(group);
    if (result.isFail() || !result.data) return;

    for (const eq of group) {
      game.player.removeFromInventory(eq.id);
    }
    game.player.addToInventory(result.data.result);
    game.saveGame();
    setSelectedMergeIndex(null);
    refresh();
  }

  function getFilteredInventory(): Equipment[] {
    let items = [...game.player.inventory];
    if (filter !== 'all') {
      items = items.filter(e => e.slot === filter);
    }
    items.sort((a, b) => {
      const gradeA = EquipmentTable.getGradeIndex(a.grade);
      const gradeB = EquipmentTable.getGradeIndex(b.grade);
      if (gradeA !== gradeB) return gradeB - gradeA;
      if (a.isS !== b.isS) return a.isS ? -1 : 1;
      return b.level - a.level;
    });
    return items;
  }

  return (
    <div className="screen">
      <h2>장비</h2>

      <div className="inv-filter-bar">
        <button
          className={`inv-filter-btn ${tab === 'equipped' ? 'active' : ''}`}
          onClick={() => setTab('equipped')}
        >
          장착
        </button>
        <button
          className={`inv-filter-btn ${tab === 'inventory' ? 'active' : ''}`}
          onClick={() => setTab('inventory')}
        >
          보관함 ({game.player.inventory.length})
        </button>
        <button
          className={`inv-filter-btn ${tab === 'forge' ? 'active' : ''}`}
          onClick={() => { setTab('forge'); setSelectedMergeIndex(null); }}
        >
          합성 ({mergeCandidates.length})
        </button>
      </div>

      {tab === 'equipped' && (
        <>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className={`grade-${eq.grade.toLowerCase()}`}>
                            {eq.isS && <span className="grade-s">[S] </span>}
                            {eq.name}
                          </span>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            {GRADE_LABELS[eq.grade]} {eq.level}레벨 | 공격력 +{eq.getStats().atk} 체력 +{eq.getStats().maxHp}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => upgradeEquipment(slotType, i)}
                            disabled={game.player.resources.equipmentStones < 1}
                          >
                            강화
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => unequip(slotType, i)}
                          >
                            해제
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#555' }}>빈 슬롯</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {tab === 'inventory' && (
        <>
          <div className="inv-filter-bar" style={{ marginTop: 8 }}>
            <button
              className={`inv-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            {slots.map(s => (
              <button
                key={s}
                className={`inv-filter-btn ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {SLOT_LABELS[s]}
              </button>
            ))}
          </div>

          {getFilteredInventory().length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#555', padding: 24 }}>
              보관함이 비어 있습니다
            </div>
          ) : (
            getFilteredInventory().map(eq => (
              <div className="inv-item" key={eq.id}>
                <div style={{ flex: 1 }}>
                  <div>
                    <span className={`grade-${eq.grade.toLowerCase()}`}>
                      {eq.isS && <span className="grade-s">[S] </span>}
                      {eq.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#666', marginLeft: 6 }}>
                      {SLOT_LABELS[eq.slot]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {GRADE_LABELS[eq.grade]} {eq.level}레벨 | 공격력 +{eq.getStats().atk} 체력 +{eq.getStats().maxHp}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-primary" onClick={() => equipFromInventory(eq.id)}>
                    장착
                  </button>
                  {eq.isS ? (
                    <button className="btn btn-secondary" disabled>판매불가</button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => sell(eq.id)}>
                      판매 {SELL_PRICES[eq.grade]}G
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'forge' && (
        <>
          {mergeCandidates.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#555', padding: 24 }}>
              합성 가능한 장비가 없습니다
            </div>
          ) : (
            mergeCandidates.map((group, groupIndex) => {
              const source = group[0];
              const nextGrade = EquipmentTable.getNextGrade(source.grade);
              const epicIndex = EquipmentTable.getGradeIndex(EquipmentGrade.EPIC);
              const isEpicPlus = EquipmentTable.getGradeIndex(source.grade) >= epicIndex;
              const isSelected = selectedMergeIndex === groupIndex;

              return (
                <div
                  className="card"
                  key={`${source.slot}_${source.grade}_${source.upgradeCount}_${groupIndex}`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#e94560' : undefined,
                  }}
                  onClick={() => setSelectedMergeIndex(isSelected ? null : groupIndex)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className={`grade-${source.grade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                        {GRADE_LABELS[source.grade]} {SLOT_LABELS[source.slot]}
                      </span>
                      {isEpicPlus && (
                        <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
                          +{source.upgradeCount}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                        {group.length}개
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      {isEpicPlus && source.upgradeCount < 3 && nextGrade ? (
                        <span style={{ color: '#aaa' }}>
                          →{' '}
                          <span className={`grade-${source.grade.toLowerCase()}`}>
                            {GRADE_LABELS[source.grade]}+{source.upgradeCount + 1}
                          </span>
                        </span>
                      ) : isEpicPlus && source.upgradeCount >= 3 && nextGrade ? (
                        <span style={{ color: '#aaa' }}>
                          →{' '}
                          <span className={`grade-${nextGrade.toLowerCase()}`}>
                            {GRADE_LABELS[nextGrade]}
                          </span>
                        </span>
                      ) : nextGrade ? (
                        <span style={{ color: '#aaa' }}>
                          {group.length}개 →{' '}
                          <span className={`grade-${nextGrade.toLowerCase()}`}>
                            {GRADE_LABELS[nextGrade]}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isEpicPlus && (
                    <div style={{ marginTop: 6 }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(source.upgradeCount / 4) * 100}%` }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
                        승급 진행: {source.upgradeCount} / 4
                      </div>
                    </div>
                  )}

                  {isSelected && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                        재료:
                      </div>
                      {group.map(eq => (
                        <div key={eq.id} style={{ fontSize: 12, color: '#ccc', padding: '2px 0' }}>
                          <span className={`grade-${eq.grade.toLowerCase()}`}>{eq.name}</span>
                          <span style={{ color: '#666', marginLeft: 6 }}>Lv.{eq.level}</span>
                        </div>
                      ))}
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 8, width: '100%' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          mergeEquipment(group);
                        }}
                      >
                        합성
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
