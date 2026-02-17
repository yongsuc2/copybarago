import { useState } from 'react';
import { useGame } from '../GameContext';
import { SlotType, ResourceType, EquipmentGrade, WeaponSubType } from '../../domain/enums';
import { EquipmentTable } from '../../domain/data/EquipmentTable';
import { EquipmentDataTable } from '../../domain/data/EquipmentDataTable';
import type { Equipment } from '../../domain/entities/Equipment';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { EquipmentPassiveTable } from '../../domain/data/EquipmentPassiveTable';

const SLOT_LABELS = EquipmentDataTable.slotLabels;
const GRADE_LABELS = EquipmentDataTable.gradeLabels;
const SELL_PRICES = EquipmentDataTable.sellPrices;

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];

type Tab = SlotType | 'forge';

export function EquipmentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<Tab>(SlotType.WEAPON);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedForgeGroupIndex, setSelectedForgeGroupIndex] = useState<number | null>(null);
  const [batchResults, setBatchResults] = useState<string[] | null>(null);

  const mergeCandidates = game.forge.findMergeCandidates(game.player.inventory);

  function eqDisplayName(eq: Equipment): string {
    if (eq.mergeLevel > 0) return `${eq.name} +${eq.mergeLevel}`;
    return eq.name;
  }

  function getForgeGroups() {
    const groups = new Map<string, Equipment[]>();

    for (const eq of game.player.inventory) {
      if (eq.isS) continue;
      const required = EquipmentTable.getMergeCount(eq.grade);
      if (required <= 0) continue;
      const subKey = eq.slot === SlotType.WEAPON ? `_${eq.weaponSubType}` : '';
      const mlKey = EquipmentTable.isHighGradeMerge(eq.grade) ? `_ml${eq.mergeLevel}` : '';
      const key = `${eq.slot}${subKey}_${eq.grade}${mlKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(eq);
    }

    return [...groups.values()].sort((a, b) => {
      const gi = EquipmentTable.getGradeIndex(b[0].grade) - EquipmentTable.getGradeIndex(a[0].grade);
      if (gi !== 0) return gi;
      if (a[0].slot !== b[0].slot) return a[0].slot.localeCompare(b[0].slot);
      return (b[0].mergeLevel ?? 0) - (a[0].mergeLevel ?? 0);
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
      slot.syncLevel(index);
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
    const required = EquipmentTable.getMergeCount(group[0].grade);
    const result = game.forge.merge(group.slice(0, required));
    if (result.isFail() || !result.data) return;

    for (const eq of group.slice(0, required)) {
      game.player.removeFromInventory(eq.id);
    }
    game.player.addToInventory(result.data.result);
    game.saveGame();
    setSelectedForgeGroupIndex(null);
    refresh();
  }

  function batchMerge() {
    const forgeGroups = getForgeGroups();
    const results: string[] = [];

    for (const group of forgeGroups) {
      const required = EquipmentTable.getMergeCount(group[0].grade);
      if (group.length < required) continue;

      const mergeResult = game.forge.merge(group.slice(0, required));
      if (mergeResult.isFail() || !mergeResult.data) continue;

      for (const eq of group.slice(0, required)) {
        game.player.removeFromInventory(eq.id);
      }
      game.player.addToInventory(mergeResult.data.result);
      results.push(eqDisplayName(mergeResult.data.result));
    }

    if (results.length > 0) {
      game.saveGame();
      setBatchResults(results);
      setSelectedForgeGroupIndex(null);
      setTimeout(() => setBatchResults(null), 4000);
    }
    refresh();
  }

  function getMergeGroupForItem(eq: Equipment): Equipment[] {
    if (eq.isS) return [];
    const required = EquipmentTable.getMergeCount(eq.grade);
    if (required <= 0) return [];
    return game.player.inventory.filter(other => {
      if (other.isS) return false;
      if (other.slot !== eq.slot || other.grade !== eq.grade) return false;
      if (other.weaponSubType !== eq.weaponSubType) return false;
      if (EquipmentTable.isHighGradeMerge(eq.grade) && other.mergeLevel !== eq.mergeLevel) return false;
      return true;
    });
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

  const ALL_GRADES: EquipmentGrade[] = [
    EquipmentGrade.COMMON, EquipmentGrade.UNCOMMON, EquipmentGrade.RARE,
    EquipmentGrade.EPIC, EquipmentGrade.LEGENDARY, EquipmentGrade.MYTHIC,
  ];

  const GRADE_COLORS: Record<EquipmentGrade, string> = {
    [EquipmentGrade.COMMON]: '#aaa',
    [EquipmentGrade.UNCOMMON]: '#4caf50',
    [EquipmentGrade.RARE]: '#2196f3',
    [EquipmentGrade.EPIC]: '#9c27b0',
    [EquipmentGrade.LEGENDARY]: '#ff9800',
    [EquipmentGrade.MYTHIC]: '#e94560',
  };

  function getPassiveTypeName(eq: Equipment): string {
    if (eq.slot === SlotType.WEAPON) {
      if (eq.weaponSubType === WeaponSubType.SWORD) return '검 패시브 - 공격력 강화';
      if (eq.weaponSubType === WeaponSubType.STAFF) return '지팡이 패시브 - 범위 공격';
      if (eq.weaponSubType === WeaponSubType.BOW) return '활 패시브 - 분노 충전';
    }
    if (eq.slot === SlotType.ARMOR) return '방어구 패시브 - 방어막';
    if (eq.slot === SlotType.RING) return '반지 패시브 - 치명타';
    if (eq.slot === SlotType.NECKLACE) return '목걸이 패시브 - 공격력';
    if (eq.slot === SlotType.SHOES) return '신발 패시브 - 재생';
    if (eq.slot === SlotType.GLOVES) return '장갑 패시브 - 연타';
    if (eq.slot === SlotType.HAT) return '모자 패시브 - 방어력';
    return '패시브 능력';
  }

  function renderPassiveInfo(eq: Equipment) {
    const currentGradeIndex = EquipmentTable.getGradeIndex(eq.grade);
    const currentPassive = eq.getPassive();
    if (!currentPassive) return null;

    return (
      <div style={{ background: '#0f1923', borderRadius: 6, padding: 12, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <EquipmentIcon slot={eq.slot} grade={eq.grade} size={36} weaponSubType={eq.weaponSubType} />
          <div>
            <div className={`grade-${eq.grade.toLowerCase()}`} style={{ fontWeight: 'bold', fontSize: 14 }}>
              {eq.isS && <span className="grade-s">[S] </span>}
              {eq.name}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              {currentPassive.icon} {getPassiveTypeName(eq)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ALL_GRADES.map((grade, i) => {
            const passive = EquipmentPassiveTable.getPassive(eq.slot, grade, eq.weaponSubType);
            if (!passive) return null;
            const isUnlocked = i <= currentGradeIndex;
            const isCurrent = i === currentGradeIndex;
            const color = GRADE_COLORS[grade];

            return (
              <div
                key={grade}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: isCurrent ? `${color}18` : '#12182a',
                  border: isCurrent ? `1px solid ${color}` : '1px solid transparent',
                  opacity: isUnlocked ? 1 : 0.4,
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: isUnlocked ? color : '#555',
                  minWidth: 28,
                  textAlign: 'center',
                }}>
                  {GRADE_LABELS[grade]}
                </span>

                <span style={{ flex: 1, fontSize: 12, color: isUnlocked ? '#e0e0e0' : '#555' }}>
                  {passive.description}
                </span>

                <span style={{ fontSize: 12, flexShrink: 0 }}>
                  {isUnlocked ? (
                    isCurrent
                      ? <span style={{ color, fontWeight: 'bold', fontSize: 11 }}>활성</span>
                      : <span style={{ color: '#666', fontSize: 11 }}>해제</span>
                  ) : (
                    <span style={{ color: '#555', fontSize: 11 }}>🔒</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
        {slot.equipped.map((eq, i) => {
          const isExpanded = eq && selectedItemId === `equipped_${slotType}_${i}`;
          return (
            <div
              className="equip-slot"
              key={i}
              style={{
                borderColor: eq ? '#e94560' : undefined,
                cursor: eq ? 'pointer' : undefined,
                flexDirection: 'column',
              }}
              onClick={() => {
                if (!eq) return;
                const eqKey = `equipped_${slotType}_${i}`;
                setSelectedItemId(isExpanded ? null : eqKey);
              }}
            >
              {eq ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EquipmentIcon slot={slotType} grade={eq.grade} size={32} weaponSubType={eq.weaponSubType} />
                      <div>
                        <span className={`grade-${eq.grade.toLowerCase()}`}>
                          {eq.isS && <span className="grade-s">[S] </span>}
                          {eqDisplayName(eq)}
                        </span>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {GRADE_LABELS[eq.grade]} Lv.{eq.level} | ATK +{eq.getStats().atk} HP +{eq.getStats().maxHp}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
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
                  {isExpanded && (
                    <div style={{ width: '100%', marginTop: 8, borderTop: '1px solid #333', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                      {renderPassiveInfo(eq)}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ color: '#555' }}>빈 슬롯</span>
              )}
            </div>
          );
        })}

        <h3 style={{ fontSize: 14, color: '#aaa', margin: '16px 0 6px' }}>
          보관함 ({inventoryItems.length})
        </h3>
        {inventoryItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#555', padding: 16 }}>
            보관 중인 {SLOT_LABELS[slotType]}이 없습니다
          </div>
        ) : (
          inventoryItems.map(eq => {
            const isExpanded = selectedItemId === eq.id;

            return (
              <div
                className="inv-item"
                key={eq.id}
                style={{
                  flexDirection: 'column',
                  cursor: 'pointer',
                  borderColor: isExpanded ? '#e94560' : undefined,
                }}
                onClick={() => setSelectedItemId(isExpanded ? null : eq.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <EquipmentIcon slot={eq.slot} grade={eq.grade} size={28} weaponSubType={eq.weaponSubType} />
                    <div style={{ flex: 1 }}>
                      <div>
                        <span className={`grade-${eq.grade.toLowerCase()}`}>
                          {eq.isS && <span className="grade-s">[S] </span>}
                          {eqDisplayName(eq)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {GRADE_LABELS[eq.grade]} Lv.{eq.level} | ATK +{eq.getStats().atk} HP +{eq.getStats().maxHp}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
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

                {isExpanded && (
                  <div style={{ width: '100%', marginTop: 8, borderTop: '1px solid #333', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                    {renderPassiveInfo(eq)}
                  </div>
                )}
              </div>
            );
          })
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
          onClick={() => { setTab('forge'); setSelectedForgeGroupIndex(null); }}
        >
          합성 ({mergeCandidates.length})
        </button>
      </div>

      {tab !== 'forge' && renderSlotTab(tab)}

      {tab === 'forge' && (() => {
        const forgeGroups = getForgeGroups();

        function getSlotLabel(eq: Equipment): string {
          if (eq.slot === SlotType.WEAPON && eq.weaponSubType) {
            return EquipmentDataTable.getWeaponSubTypeLabel(eq.weaponSubType);
          }
          return SLOT_LABELS[eq.slot];
        }

        function isEnhanceMerge(source: Equipment): boolean {
          return EquipmentTable.isHighGradeMerge(source.grade) && source.mergeLevel < EquipmentTable.getMergeEnhanceMax();
        }

        function getMergeResultGrade(source: Equipment): EquipmentGrade | null {
          if (isEnhanceMerge(source)) return source.grade;
          return EquipmentTable.getNextGrade(source.grade);
        }

        function getMergeResultMergeLevel(source: Equipment): number {
          if (isEnhanceMerge(source)) return source.mergeLevel + 1;
          return 0;
        }

        function getMergeResultLabel(source: Equipment): string | null {
          if (isEnhanceMerge(source)) {
            return `${GRADE_LABELS[source.grade]} ${getSlotLabel(source)} +${source.mergeLevel + 1}`;
          }
          const nextGrade = EquipmentTable.getNextGrade(source.grade);
          if (!nextGrade) return null;
          return `${GRADE_LABELS[nextGrade]} ${getSlotLabel(source)}`;
        }

        const mergeableCount = forgeGroups.filter(g => g.length >= EquipmentTable.getMergeCount(g[0].grade)).length;
        const selectedGroup = selectedForgeGroupIndex !== null ? forgeGroups[selectedForgeGroupIndex] : null;
        const selectedSource = selectedGroup?.[0] ?? null;

        return (
          <>
            {batchResults && (
              <div className="card" style={{ background: '#1a3a1a', borderColor: '#4caf50' }}>
                <div style={{ fontSize: 13, color: '#4caf50', fontWeight: 'bold', marginBottom: 4 }}>
                  {batchResults.length}건 합성 완료
                </div>
                {batchResults.map((name, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#ccc', padding: '2px 0' }}>
                    {name}
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4, marginBottom: 4 }}
              disabled={mergeableCount === 0}
              onClick={batchMerge}
            >
              일괄 합성 ({mergeableCount}건)
            </button>

            <div className="forge-preview">
              {!selectedSource ? (
                <div style={{ textAlign: 'center', color: '#555', padding: 12, fontSize: 13 }}>
                  장비를 선택하면 합성 미리보기가 표시됩니다
                </div>
              ) : (() => {
                const group = selectedGroup!;
                const required = EquipmentTable.getMergeCount(selectedSource.grade);
                const canMerge = group.length >= required;
                const resultGrade = getMergeResultGrade(selectedSource);
                const resultLabel = getMergeResultLabel(selectedSource);
                const isEnhance = isEnhanceMerge(selectedSource);
                const resultStats = resultGrade ? EquipmentTable.getBaseStats(selectedSource.slot, resultGrade) : null;
                const nextPassive = (!isEnhance && resultGrade)
                  ? EquipmentPassiveTable.getPassive(selectedSource.slot, resultGrade, selectedSource.weaponSubType)
                  : null;

                return (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '4px 0', marginBottom: 8,
                    }}>
                      {Array.from({ length: required }).map((_, i) => {
                        const owned = i < group.length;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              opacity: owned ? 1 : 0.2,
                              border: owned
                                ? `2px solid ${GRADE_COLORS[selectedSource.grade]}`
                                : `2px dashed #444`,
                              borderRadius: 8,
                              padding: 3,
                              background: owned ? `${GRADE_COLORS[selectedSource.grade]}15` : 'transparent',
                              position: 'relative',
                            }}>
                              <EquipmentIcon slot={selectedSource.slot} grade={selectedSource.grade} size={32} weaponSubType={selectedSource.weaponSubType} />
                              {selectedSource.mergeLevel > 0 && (
                                <span style={{
                                  position: 'absolute', bottom: -4, right: -4,
                                  background: GRADE_COLORS[selectedSource.grade], color: '#fff',
                                  fontSize: 9, fontWeight: 'bold', borderRadius: 4, padding: '0 3px',
                                }}>+{selectedSource.mergeLevel}</span>
                              )}
                            </div>
                            {i < required - 1 && (
                              <span style={{ color: '#555', fontSize: 14, fontWeight: 'bold' }}>+</span>
                            )}
                          </div>
                        );
                      })}
                      <span style={{ color: '#aaa', fontSize: 16, fontWeight: 'bold', margin: '0 2px' }}>=</span>
                      {resultGrade && (
                        <div style={{
                          border: `2px solid ${GRADE_COLORS[resultGrade]}`,
                          borderRadius: 8,
                          padding: 3,
                          background: `${GRADE_COLORS[resultGrade]}15`,
                          position: 'relative',
                        }}>
                          <EquipmentIcon slot={selectedSource.slot} grade={resultGrade} size={32} weaponSubType={selectedSource.weaponSubType} />
                          {getMergeResultMergeLevel(selectedSource) > 0 && (
                            <span style={{
                              position: 'absolute', bottom: -4, right: -4,
                              background: GRADE_COLORS[resultGrade], color: '#fff',
                              fontSize: 9, fontWeight: 'bold', borderRadius: 4, padding: '0 3px',
                            }}>+{getMergeResultMergeLevel(selectedSource)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {resultLabel && resultGrade && (
                      <div style={{ textAlign: 'center', marginBottom: 4 }}>
                        <span className={`grade-${resultGrade.toLowerCase()}`} style={{ fontWeight: 'bold', fontSize: 14 }}>
                          {resultLabel}
                        </span>
                      </div>
                    )}

                    {resultStats && (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginBottom: 4 }}>
                        {resultStats.atk > 0 && <span style={{ marginRight: 12 }}>ATK +{resultStats.atk}</span>}
                        {resultStats.maxHp > 0 && <span>HP +{resultStats.maxHp}</span>}
                      </div>
                    )}

                    {nextPassive && (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#ccc', marginBottom: 6 }}>
                        {nextPassive.icon} {nextPassive.description}
                      </div>
                    )}

                    {canMerge ? (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 4 }}
                        onClick={() => mergeEquipment(group)}
                      >
                        합성하기
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 }}>
                        {required - group.length}개 더 필요
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <h3 style={{ fontSize: 13, color: '#aaa', margin: '12px 0 4px' }}>
              보유 장비 ({forgeGroups.length}그룹)
            </h3>

            {forgeGroups.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', padding: 16, fontSize: 13 }}>
                합성 가능한 장비가 없습니다
              </div>
            ) : (
              <div className="forge-grid">
                {forgeGroups.map((group, groupIndex) => {
                  const source = group[0];
                  const required = EquipmentTable.getMergeCount(source.grade);
                  const canMerge = group.length >= required;
                  const isSelected = selectedForgeGroupIndex === groupIndex;
                  const gradeColor = GRADE_COLORS[source.grade];

                  return (
                    <div
                      key={`${source.slot}_${source.grade}_${groupIndex}`}
                      className={`forge-grid-item${isSelected ? ' selected' : ''}${canMerge && !isSelected ? ' mergeable' : ''}`}
                      onClick={() => setSelectedForgeGroupIndex(isSelected ? null : groupIndex)}
                    >
                      <EquipmentIcon slot={source.slot} grade={source.grade} size={36} weaponSubType={source.weaponSubType} />
                      {source.mergeLevel > 0 && (
                        <span style={{
                          position: 'absolute', top: 1, right: 3,
                          fontSize: 9, fontWeight: 'bold', color: gradeColor,
                        }}>+{source.mergeLevel}</span>
                      )}
                      <span style={{ fontSize: 10, color: gradeColor }}>
                        {GRADE_LABELS[source.grade]}
                      </span>
                      <span style={{ fontSize: 10, color: '#888' }}>
                        {getSlotLabel(source)}
                      </span>
                      <span className="forge-badge" style={{
                        color: canMerge ? '#4caf50' : '#888',
                        border: `1px solid ${canMerge ? '#4caf5050' : '#44444450'}`,
                      }}>
                        {group.length}/{required}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
