import { useState } from 'react';
import { useGame } from '../GameContext';
import { SlotType, ResourceType, EquipmentGrade } from '../../domain/enums';
import { EquipmentTable } from '../../domain/data/EquipmentTable';
import { EquipmentDataTable } from '../../domain/data/EquipmentDataTable';
import type { Equipment } from '../../domain/entities/Equipment';
import { EquipmentIcon } from '../components/EquipmentIcon';

const SLOT_LABELS = EquipmentDataTable.slotLabels;
const GRADE_LABELS = EquipmentDataTable.gradeLabels;
const SELL_PRICES = EquipmentDataTable.sellPrices;

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];

type Tab = SlotType | 'forge';

export function EquipmentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<Tab>(SlotType.WEAPON);
  const [selectedMergeIndex, setSelectedMergeIndex] = useState<number | null>(null);

  const mergeCandidates = game.forge.findMergeCandidates(game.player.inventory);

  function getForgeGroups() {
    const epicIndex = EquipmentTable.getGradeIndex(EquipmentGrade.EPIC);
    const groups = new Map<string, Equipment[]>();

    for (const eq of game.player.inventory) {
      if (eq.isS) continue;
      const required = EquipmentTable.getMergeCount(eq.grade);
      if (required <= 0) continue;
      const isEpicPlus = EquipmentTable.getGradeIndex(eq.grade) >= epicIndex;
      const key = isEpicPlus
        ? `${eq.slot}_${eq.grade}_${eq.upgradeCount}`
        : `${eq.slot}_${eq.grade}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(eq);
    }

    return [...groups.values()].sort((a, b) => {
      const gi = EquipmentTable.getGradeIndex(b[0].grade) - EquipmentTable.getGradeIndex(a[0].grade);
      if (gi !== 0) return gi;
      return a[0].slot.localeCompare(b[0].slot);
    });
  }

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

  function getInventoryForSlot(slotType: SlotType): Equipment[] {
    const items = game.player.inventory.filter(e => e.slot === slotType);
    items.sort((a, b) => {
      const gradeA = EquipmentTable.getGradeIndex(a.grade);
      const gradeB = EquipmentTable.getGradeIndex(b.grade);
      if (gradeA !== gradeB) return gradeB - gradeA;
      if (a.isS !== b.isS) return a.isS ? -1 : 1;
      return b.level - a.level;
    });
    return items;
  }

  function renderSlotTab(slotType: SlotType) {
    const slot = game.player.getEquipmentSlot(slotType);
    const inventoryItems = getInventoryForSlot(slotType);

    return (
      <>
        <div className="card">
          <div className="stat-row">
            <span style={{ fontSize: 12, color: '#888' }}>강화석</span>
            <span style={{ fontSize: 12 }}>{game.player.resources.equipmentStones}</span>
          </div>
        </div>

        <h3 style={{ fontSize: 14, color: '#e94560', margin: '12px 0 6px' }}>
          장착 중 ({slot.getEquipped().length}/{slot.maxCount})
        </h3>
        {slot.equipped.map((eq, i) => (
          <div className="equip-slot" key={i} style={{ borderColor: eq ? '#e94560' : undefined }}>
            {eq ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EquipmentIcon slot={slotType} grade={eq.grade} size={32} />
                  <div>
                    <span className={`grade-${eq.grade.toLowerCase()}`}>
                      {eq.isS && <span className="grade-s">[S] </span>}
                      {eq.name}
                    </span>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {GRADE_LABELS[eq.grade]} Lv.{eq.level} | ATK +{eq.getStats().atk} HP +{eq.getStats().maxHp}
                    </div>
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

        <h3 style={{ fontSize: 14, color: '#aaa', margin: '16px 0 6px' }}>
          보관함 ({inventoryItems.length})
        </h3>
        {inventoryItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#555', padding: 16 }}>
            보관 중인 {SLOT_LABELS[slotType]}이 없습니다
          </div>
        ) : (
          inventoryItems.map(eq => (
            <div className="inv-item" key={eq.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <EquipmentIcon slot={eq.slot} grade={eq.grade} size={28} />
                <div style={{ flex: 1 }}>
                  <div>
                    <span className={`grade-${eq.grade.toLowerCase()}`}>
                      {eq.isS && <span className="grade-s">[S] </span>}
                      {eq.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {GRADE_LABELS[eq.grade]} Lv.{eq.level} | ATK +{eq.getStats().atk} HP +{eq.getStats().maxHp}
                  </div>
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
                    {SELL_PRICES[eq.grade]}G
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </>
    );
  }

  return (
    <div className="screen">
      <h2>장비</h2>

      <div className="inv-filter-bar" style={{ flexWrap: 'wrap' }}>
        {SLOTS.map(s => (
          <button
            key={s}
            className={`inv-filter-btn ${tab === s ? 'active' : ''}`}
            onClick={() => setTab(s)}
            style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '4px 8px', fontSize: 12 }}
          >
            <EquipmentIcon slot={s} size={16} />
            {SLOT_LABELS[s]}
          </button>
        ))}
        <button
          className={`inv-filter-btn ${tab === 'forge' ? 'active' : ''}`}
          onClick={() => { setTab('forge'); setSelectedMergeIndex(null); }}
        >
          합성 ({mergeCandidates.length})
        </button>
      </div>

      {tab !== 'forge' && renderSlotTab(tab)}

      {tab === 'forge' && (() => {
        const forgeGroups = getForgeGroups();
        return (
          <>
            {forgeGroups.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#555', padding: 24 }}>
                보관함에 합성 가능한 장비가 없습니다
              </div>
            ) : (
              forgeGroups.map((group, groupIndex) => {
                const source = group[0];
                const required = EquipmentTable.getMergeCount(source.grade);
                const nextGrade = EquipmentTable.getNextGrade(source.grade);
                const epicIndex = EquipmentTable.getGradeIndex(EquipmentGrade.EPIC);
                const isEpicPlus = EquipmentTable.getGradeIndex(source.grade) >= epicIndex;
                const canMerge = group.length >= required;
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
                      </div>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 'bold',
                        color: canMerge ? '#4caf50' : '#888',
                      }}>
                        {group.length} / {required}
                      </span>
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min((group.length / required) * 100, 100)}%`,
                            background: canMerge ? '#4caf50' : '#e94560',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                      {canMerge ? (
                        <span style={{ color: '#4caf50' }}>합성 가능!</span>
                      ) : (
                        <span style={{ color: '#888' }}>{required - group.length}개 더 필요</span>
                      )}
                      <span style={{ color: '#aaa' }}>
                        {isEpicPlus && source.upgradeCount < 3 && nextGrade ? (
                          <>
                            →{' '}
                            <span className={`grade-${source.grade.toLowerCase()}`}>
                              {GRADE_LABELS[source.grade]}+{source.upgradeCount + 1}
                            </span>
                          </>
                        ) : isEpicPlus && source.upgradeCount >= 3 && nextGrade ? (
                          <>
                            →{' '}
                            <span className={`grade-${nextGrade.toLowerCase()}`}>
                              {GRADE_LABELS[nextGrade]}
                            </span>
                          </>
                        ) : nextGrade ? (
                          <>
                            →{' '}
                            <span className={`grade-${nextGrade.toLowerCase()}`}>
                              {GRADE_LABELS[nextGrade]}
                            </span>
                          </>
                        ) : null}
                      </span>
                    </div>

                    {isEpicPlus && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#666', textAlign: 'center' }}>
                        승급 진행: {source.upgradeCount} / 4
                      </div>
                    )}

                    {isSelected && (
                      <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 8 }}>
                        <div style={{
                          background: '#0f1923',
                          borderRadius: 6,
                          padding: 10,
                          marginBottom: 8,
                          fontSize: 13,
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#ddd' }}>합성 조건</div>
                          <div className="stat-row">
                            <span style={{ color: '#aaa' }}>필요 수량</span>
                            <span>
                              동일 장비{' '}
                              <span style={{ color: canMerge ? '#4caf50' : '#ff5252', fontWeight: 'bold' }}>
                                {group.length}
                              </span>
                              {' / '}
                              <span style={{ fontWeight: 'bold' }}>{required}</span>개
                            </span>
                          </div>
                          <div className="stat-row">
                            <span style={{ color: '#aaa' }}>합성 결과</span>
                            <span>
                              {isEpicPlus && source.upgradeCount < 3 && nextGrade ? (
                                <span className={`grade-${source.grade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                                  {GRADE_LABELS[source.grade]} {SLOT_LABELS[source.slot]} +{source.upgradeCount + 1}
                                </span>
                              ) : isEpicPlus && source.upgradeCount >= 3 && nextGrade ? (
                                <span className={`grade-${nextGrade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                                  {GRADE_LABELS[nextGrade]} {SLOT_LABELS[source.slot]}
                                </span>
                              ) : nextGrade ? (
                                <span className={`grade-${nextGrade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                                  {GRADE_LABELS[nextGrade]} {SLOT_LABELS[source.slot]}
                                </span>
                              ) : (
                                <span style={{ color: '#888' }}>-</span>
                              )}
                            </span>
                          </div>
                          {isEpicPlus && (
                            <div className="stat-row">
                              <span style={{ color: '#aaa' }}>승급 진행</span>
                              <span>
                                {source.upgradeCount} / 4{' '}
                                {source.upgradeCount >= 3 && (
                                  <span style={{ color: '#ffd700', fontSize: 11 }}>(다음 합성 시 등급 UP)</span>
                                )}
                              </span>
                            </div>
                          )}
                          {!canMerge && (
                            <div style={{ marginTop: 6, padding: '6px 0', color: '#ff5252', fontSize: 12 }}>
                              같은 등급/슬롯{isEpicPlus ? '/합성단계' : ''} 장비가 {required - group.length}개 더 필요합니다
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
                          보유 장비 ({group.length}개)
                        </div>
                        {group.map(eq => (
                          <div key={eq.id} style={{
                            fontSize: 12,
                            color: '#ccc',
                            padding: '4px 8px',
                            background: '#1a1a2e',
                            borderRadius: 4,
                            marginBottom: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}>
                            <span className={`grade-${eq.grade.toLowerCase()}`}>{eq.name}</span>
                            <span style={{ color: '#666' }}>Lv.{eq.level}</span>
                          </div>
                        ))}
                        {canMerge ? (
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: 8, width: '100%' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              mergeEquipment(group.slice(0, required));
                            }}
                          >
                            합성하기
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ marginTop: 8, width: '100%' }}
                            disabled
                          >
                            재료 부족
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        );
      })()}
    </div>
  );
}
