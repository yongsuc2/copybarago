import { useState, useRef } from 'react';
import { useGame } from '../GameContext';
import { SlotType, ResourceType, EquipmentGrade, WeaponSubType } from '../../domain/enums';
import type { Stats } from '../../domain/value-objects/Stats';
import { EquipmentTable } from '../../domain/data/EquipmentTable';
import { EquipmentDataTable } from '../../domain/data/EquipmentDataTable';
import type { Equipment } from '../../domain/entities/Equipment';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { EquipmentPassiveTable } from '../../domain/data/EquipmentPassiveTable';
import { CharacterSprite } from '../components/CharacterSprite';
import { RotateCcw, ChevronsUp } from 'lucide-react';

const SLOT_LABELS = EquipmentDataTable.slotLabels;
const GRADE_LABELS = EquipmentDataTable.gradeLabels;
const SELL_PRICES = EquipmentDataTable.sellPrices;

const SUBSTAT_LABELS: Record<string, string> = {
  ATK: 'ATK', maxHp: 'HP', DEF: 'DEF', CRIT: 'CRIT',
};

function formatSubStatValue(stat: string, value: number): string {
  if (stat === 'CRIT') return `+${(value * 100).toFixed(1)}%`;
  return `+${Math.floor(value)}`;
}

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];

type Tab = 'equip' | 'forge';
type InvFilter = SlotType | 'all' | null;

const PAPER_DOLL_LAYOUT: ({ slot: SlotType; idx: number } | 'character' | null)[][] = [
  [{ slot: SlotType.NECKLACE, idx: 0 }, { slot: SlotType.HAT, idx: 0 }, { slot: SlotType.WEAPON, idx: 0 }],
  [{ slot: SlotType.RING, idx: 0 }, 'character', { slot: SlotType.ARMOR, idx: 0 }],
  [{ slot: SlotType.RING, idx: 1 }, 'character', { slot: SlotType.GLOVES, idx: 0 }],
  [null, { slot: SlotType.SHOES, idx: 0 }, null],
];

export function EquipmentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<Tab>('equip');
  const [inventoryFilter, setInventoryFilter] = useState<InvFilter>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [selectedForgeGroupIndex, setSelectedForgeGroupIndex] = useState<number | null>(null);
  const [batchResults, setBatchResults] = useState<{ name: string; slot: SlotType; grade: EquipmentGrade; weaponSubType: WeaponSubType | null; mergeLevel: number }[] | null>(null);
  const [statToast, setStatToast] = useState<{ atk: number; maxHp: number; def: number; crit: number } | null>(null);
  const statToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDemoteConfirm, setShowDemoteConfirm] = useState(false);

  const mergeCandidates = game.forge.findMergeCandidates(game.player.inventory);
  const playerStats = game.player.computeStats();

  function showStatChange(before: Stats, after: Stats) {
    const diff = {
      atk: after.atk - before.atk,
      maxHp: after.maxHp - before.maxHp,
      def: after.def - before.def,
      crit: after.crit - before.crit,
    };
    if (diff.atk === 0 && diff.maxHp === 0 && diff.def === 0 && diff.crit === 0) return;
    if (statToastTimer.current) clearTimeout(statToastTimer.current);
    setStatToast(diff);
    statToastTimer.current = setTimeout(() => setStatToast(null), 700);
  }

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

  function demoteEquipment(slotType: SlotType, index: number) {
    const slot = game.player.getEquipmentSlot(slotType);
    const eq = slot.equipped[index];
    if (!eq || eq.level === 0) return;

    const before = game.player.computeStats();
    const result = eq.demote();
    if (result.isOk()) {
      game.player.resources.add(ResourceType.EQUIPMENT_STONE, result.data!.refund);
      slot.syncLevel(index);
      game.saveGame();
      showStatChange(before, game.player.computeStats());
    }
    setShowDemoteConfirm(false);
    refresh();
  }

  function upgradeEquipment(slotType: SlotType, index: number) {
    const slot = game.player.getEquipmentSlot(slotType);
    const eq = slot.equipped[index];
    if (!eq) return;
    const cost = eq.getUpgradeCost();
    if (!game.player.resources.canAfford(ResourceType.EQUIPMENT_STONE, cost)) return;

    const before = game.player.computeStats();
    const result = eq.upgrade(game.player.resources.equipmentStones);
    if (result.isOk()) {
      game.player.resources.spend(ResourceType.EQUIPMENT_STONE, result.data!.cost);
      slot.syncLevel(index);
      game.saveGame();
      showStatChange(before, game.player.computeStats());
    }
    refresh();
  }

  function bulkUpgradeEquipment(slotType: SlotType, index: number) {
    const slot = game.player.getEquipmentSlot(slotType);
    const eq = slot.equipped[index];
    if (!eq) return;

    const before = game.player.computeStats();
    let upgraded = false;
    while (true) {
      const cost = eq.getUpgradeCost();
      if (!game.player.resources.canAfford(ResourceType.EQUIPMENT_STONE, cost)) break;
      if (eq.needsPromote()) break;
      const result = eq.upgrade(game.player.resources.equipmentStones);
      if (result.isFail()) break;
      game.player.resources.spend(ResourceType.EQUIPMENT_STONE, result.data!.cost);
      upgraded = true;
    }
    if (upgraded) {
      slot.syncLevel(index);
      game.saveGame();
      showStatChange(before, game.player.computeStats());
    }
    refresh();
  }

  function unequip(slotType: SlotType, index: number) {
    const before = game.player.computeStats();
    game.player.unequipToInventory(slotType, index);
    setSelectedSlotKey(null);
    game.saveGame();
    showStatChange(before, game.player.computeStats());
    refresh();
  }

  function equipFromInventory(id: string) {
    const before = game.player.computeStats();
    game.player.equipFromInventory(id);
    setSelectedInventoryId(null);
    game.saveGame();
    showStatChange(before, game.player.computeStats());
    refresh();
  }

  function sell(id: string) {
    const price = game.player.sellEquipment(id);
    if (price > 0) {
      game.updateQuestProgress('weekly_sell');
      game.saveGame();
    }
    setSelectedInventoryId(null);
    refresh();
  }

  function mergeEquipment(group: Equipment[]) {
    const required = EquipmentTable.getMergeCount(group[0].grade);
    const result = game.forge.merge(group.slice(0, required), game.rng);
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

      const mergeResult = game.forge.merge(group.slice(0, required), game.rng);
      if (mergeResult.isFail() || !mergeResult.data) continue;

      for (const eq of group.slice(0, required)) {
        game.player.removeFromInventory(eq.id);
      }
      game.player.addToInventory(mergeResult.data.result);
      const r = mergeResult.data.result;
      results.push({ name: eqDisplayName(r), slot: r.slot, grade: r.grade, weaponSubType: r.weaponSubType, mergeLevel: r.mergeLevel });
    }

    if (results.length > 0) {
      game.saveGame();
      setBatchResults(results);
      setSelectedForgeGroupIndex(null);
      setTimeout(() => setBatchResults(null), 4000);
    }
    refresh();
  }

  function getFilteredInventory(): Equipment[] {
    if (inventoryFilter === null) return [];
    const items = inventoryFilter === 'all'
      ? [...game.player.inventory]
      : game.player.inventory.filter(e => e.slot === inventoryFilter);
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

  function renderDetailPanel() {
    if (selectedSlotKey) {
      const [slotType, idxStr] = selectedSlotKey.split('_') as [SlotType, string];
      const idx = parseInt(idxStr);
      const slot = game.player.getEquipmentSlot(slotType);
      const eq = slot.equipped[idx];
      if (!eq) return null;

      const stats = eq.getStats();
      return (
        <div className="equip-detail-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EquipmentIcon slot={eq.slot} grade={eq.grade} size={40} weaponSubType={eq.weaponSubType} />
            <div style={{ flex: 1 }}>
              <div className={`grade-${eq.grade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                {eq.isS && <span className="grade-s">[S] </span>}
                {eqDisplayName(eq)}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {GRADE_LABELS[eq.grade]} Lv.{eq.level}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn-icon"
                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => bulkUpgradeEquipment(slotType, idx)}
                disabled={game.player.resources.equipmentStones < eq.getUpgradeCost() || eq.needsPromote()}
                title="일괄 강화"
              >
                <ChevronsUp size={14} />
              </button>
              {eq.level > 0 && (
                <button
                  className="btn-icon"
                  style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowDemoteConfirm(v => !v)}
                  title="장비 강등"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
          {showDemoteConfirm && eq.level > 0 && (
            <div style={{ background: '#1a1020', border: '1px solid #e94560', borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>
                장비 강등 시 강화석이 100% 반환됩니다.
              </div>
              <div style={{ fontSize: 12, color: '#4fc3f7', marginBottom: 8 }}>
                반환: {eq.getTotalUpgradeCost()} 강화석
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', color: '#e94560' }}
                onClick={() => demoteEquipment(slotType, idx)}
              >
                강등하기
              </button>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 6 }}>
            {stats.atk > 0 && <span style={{ marginRight: 12 }}>ATK +{stats.atk}</span>}
            {stats.maxHp > 0 && <span>HP +{stats.maxHp}</span>}
          </div>
          {eq.subStats.length > 0 && (
            <div style={{ fontSize: 11, color: '#b0b0ff', marginBottom: 6 }}>
              {eq.subStats.map((s, i) => (
                <span key={i} style={{ marginRight: 10 }}>
                  {SUBSTAT_LABELS[s.stat] ?? s.stat} {formatSubStatValue(s.stat, s.value)}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
            {getPassiveTypeName(eq)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => upgradeEquipment(slotType, idx)}
              disabled={game.player.resources.equipmentStones < eq.getUpgradeCost()}
            >
              강화 {eq.getUpgradeCost()}석 (보유:{game.player.resources.equipmentStones})
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => unequip(slotType, idx)}
            >
              해제
            </button>
          </div>
        </div>
      );
    }

    if (selectedInventoryId) {
      const eq = game.player.inventory.find(e => e.id === selectedInventoryId);
      if (!eq) return null;

      const stats = eq.getStats();
      return (
        <div className="equip-detail-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EquipmentIcon slot={eq.slot} grade={eq.grade} size={40} weaponSubType={eq.weaponSubType} />
            <div style={{ flex: 1 }}>
              <div className={`grade-${eq.grade.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                {eq.isS && <span className="grade-s">[S] </span>}
                {eqDisplayName(eq)}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {GRADE_LABELS[eq.grade]} Lv.{eq.level} | {SLOT_LABELS[eq.slot]}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 6 }}>
            {stats.atk > 0 && <span style={{ marginRight: 12 }}>ATK +{stats.atk}</span>}
            {stats.maxHp > 0 && <span>HP +{stats.maxHp}</span>}
          </div>
          {eq.subStats.length > 0 && (
            <div style={{ fontSize: 11, color: '#b0b0ff', marginBottom: 6 }}>
              {eq.subStats.map((s, i) => (
                <span key={i} style={{ marginRight: 10 }}>
                  {SUBSTAT_LABELS[s.stat] ?? s.stat} {formatSubStatValue(s.stat, s.value)}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
            {getPassiveTypeName(eq)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => equipFromInventory(eq.id)}
            >
              장착
            </button>
            {eq.isS ? (
              <button className="btn btn-secondary" style={{ flex: 1 }} disabled>판매불가</button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => sell(eq.id)}
              >
                {SELL_PRICES[eq.grade]}G 판매
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderEquipTab() {
    const inventoryItems = getFilteredInventory();

    return (
      <>
        {statToast && (
          <div className="stat-toast">
            {statToast.atk !== 0 && (
              <span style={{ color: statToast.atk > 0 ? '#4caf50' : '#e94560' }}>
                ATK {statToast.atk > 0 ? '+' : ''}{statToast.atk}
              </span>
            )}
            {statToast.maxHp !== 0 && (
              <span style={{ color: statToast.maxHp > 0 ? '#4caf50' : '#e94560' }}>
                HP {statToast.maxHp > 0 ? '+' : ''}{statToast.maxHp}
              </span>
            )}
            {statToast.def !== 0 && (
              <span style={{ color: statToast.def > 0 ? '#4caf50' : '#e94560' }}>
                DEF {statToast.def > 0 ? '+' : ''}{statToast.def}
              </span>
            )}
            {statToast.crit !== 0 && (
              <span style={{ color: statToast.crit > 0 ? '#4caf50' : '#e94560' }}>
                CRIT {statToast.crit > 0 ? '+' : ''}{(statToast.crit * 100).toFixed(1)}%
              </span>
            )}
          </div>
        )}

        <div className="paper-doll">
          {PAPER_DOLL_LAYOUT.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              if (cell === 'character') {
                if (rowIdx === 2) return null;
                return (
                  <div key={`char_${rowIdx}_${colIdx}`} className="paper-doll-character">
                    <CharacterSprite type="capybara" size={72} />
                  </div>
                );
              }

              if (cell === null) {
                return <div key={`empty_${rowIdx}_${colIdx}`} />;
              }

              const { slot: slotType, idx } = cell;
              const slotObj = game.player.getEquipmentSlot(slotType);
              const eq = slotObj.equipped[idx];
              const slotKey = `${slotType}_${idx}`;
              const isSelected = selectedSlotKey === slotKey;
              const gradeColor = eq ? GRADE_COLORS[eq.grade] : undefined;

              return (
                <div key={slotKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    className={`paper-doll-slot${eq ? ' equipped' : ''}${isSelected ? ' selected' : ''}`}
                    style={{
                      borderColor: isSelected ? undefined : (eq ? gradeColor : undefined),
                    }}
                    onClick={() => {
                      setSelectedInventoryId(null);
                      setInventoryFilter(slotType);
                      setShowDemoteConfirm(false);
                      if (eq) {
                        setSelectedSlotKey(isSelected ? null : slotKey);
                      } else {
                        setSelectedSlotKey(null);
                      }
                    }}
                  >
                    {eq ? (
                      <EquipmentIcon slot={slotType} grade={eq.grade} size={32} weaponSubType={eq.weaponSubType} />
                    ) : (
                      <div style={{ opacity: 0.15 }}>
                        <EquipmentIcon slot={slotType} size={32} />
                      </div>
                    )}
                  </div>
                  <span className="paper-doll-label">
                    {SLOT_LABELS[slotType]}{slotObj.maxCount > 1 ? ` ${idx + 1}` : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {renderDetailPanel()}

        <div className="equip-stats-bar">
          <span>ATK <b>{playerStats.atk}</b></span>
          <span>HP <b>{playerStats.maxHp}</b></span>
          <span>DEF <b>{playerStats.def}</b></span>
          <span>CRIT <b>{(playerStats.crit * 100).toFixed(1)}%</b></span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 4px' }}>
          <h3 style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
            보관함 ({game.player.inventory.length})
          </h3>
          <span style={{ fontSize: 11, color: '#666' }}>
            강화석: {game.player.resources.equipmentStones}
          </span>
        </div>

        <div className="inv-filter-bar" style={{ marginTop: 0 }}>
          <button
            className={`inv-filter-btn ${inventoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setInventoryFilter('all')}
            style={{ padding: '3px 8px', fontSize: 11 }}
          >
            전체
          </button>
          {SLOTS.map(s => (
            <button
              key={s}
              className={`inv-filter-btn ${inventoryFilter === s ? 'active' : ''}`}
              onClick={() => setInventoryFilter(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '3px 6px', fontSize: 11 }}
            >
              <EquipmentIcon slot={s} size={12} />
              {SLOT_LABELS[s]}
            </button>
          ))}
        </div>

        {inventoryFilter !== null && (
          inventoryItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: 16, fontSize: 13 }}>
              보관 중인 장비가 없습니다
            </div>
          ) : (
            <div className="inv-grid">
              {inventoryItems.map(eq => {
                const isSelected = selectedInventoryId === eq.id;
                const gradeColor = eq.isS ? '#ffd700' : GRADE_COLORS[eq.grade];

                return (
                  <div
                    key={eq.id}
                    className={`inv-grid-item${isSelected ? ' selected' : ''}`}
                    style={{ borderColor: isSelected ? undefined : gradeColor }}
                    onClick={() => {
                      setSelectedSlotKey(null);
                      setSelectedInventoryId(isSelected ? null : eq.id);
                    }}
                  >
                    <EquipmentIcon slot={eq.slot} grade={eq.grade} size={32} weaponSubType={eq.weaponSubType} />
                    <span style={{ fontSize: 9, color: gradeColor, fontWeight: 'bold' }}>
                      {eq.isS ? 'S' : GRADE_LABELS[eq.grade]}
                    </span>
                    <span style={{ fontSize: 9, color: '#777' }}>
                      {SLOT_LABELS[eq.slot]}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </>
    );
  }

  return (
    <div className="screen">
      <h2>장비</h2>

      <div className="inv-filter-bar">
        <button
          className={`inv-filter-btn ${tab === 'equip' ? 'active' : ''}`}
          onClick={() => setTab('equip')}
        >
          장비
        </button>
        <button
          className={`inv-filter-btn ${tab === 'forge' ? 'active' : ''}`}
          onClick={() => { setTab('forge'); setSelectedForgeGroupIndex(null); }}
        >
          합성 ({mergeCandidates.length})
        </button>
      </div>

      {tab === 'equip' && renderEquipTab()}

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
                {batchResults.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <EquipmentIcon slot={item.slot} grade={item.grade} size={20} weaponSubType={item.weaponSubType} />
                    <span className={`grade-${item.grade.toLowerCase()}`} style={{ fontSize: 12 }}>
                      {item.name}
                    </span>
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
