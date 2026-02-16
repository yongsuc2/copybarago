import { useState } from 'react';
import { useGame } from '../GameContext';
import { AttendanceDataTable } from '../../domain/data/AttendanceDataTable';
import type { AttendanceRewardDef } from '../../domain/data/AttendanceDataTable';
import { EquipmentDataTable } from '../../domain/data/EquipmentDataTable';
import { EquipmentIcon } from '../components/EquipmentIcon';
import type { Pet } from '../../domain/entities/Pet';
import type { Equipment } from '../../domain/entities/Equipment';
import { Check, Lock, Gift } from 'lucide-react';

interface ClaimResult {
  day: number;
  pet?: Pet;
  equipment?: Equipment;
}

export function EventScreen() {
  const { game, refresh } = useGame();
  const [lastClaim, setLastClaim] = useState<ClaimResult | null>(null);
  const attendance = game.attendance;
  const rewards = AttendanceDataTable.getAllRewards();
  const currentDay = attendance.getCurrentDay();
  const canClaim = attendance.canCheckIn();

  function handleClaim() {
    const result = game.claimAttendance();
    if (!result) return;
    setLastClaim(result);
    refresh();
  }

  function getCardState(reward: AttendanceRewardDef): 'claimed' | 'claimable' | 'locked' {
    const dayIndex = reward.day - 1;
    if (attendance.checkedDays[dayIndex]) return 'claimed';
    if (dayIndex === currentDay && canClaim) return 'claimable';
    return 'locked';
  }

  function renderRewardCard(reward: AttendanceRewardDef) {
    const state = getCardState(reward);

    return (
      <div
        key={reward.day}
        className={`attendance-card ${state}`}
        onClick={state === 'claimable' ? handleClaim : undefined}
      >
        <div className="attendance-day">Day {reward.day}</div>
        <div className="attendance-icon">
          {state === 'claimed' ? (
            <Check size={24} color="#69f0ae" />
          ) : state === 'locked' ? (
            <Lock size={20} color="#555" />
          ) : (
            <Gift size={24} color="#ffd740" />
          )}
        </div>
        <div className="attendance-desc">{reward.description}</div>
        {state === 'claimable' && (
          <button className="btn btn-primary attendance-claim-btn">
            수령
          </button>
        )}
        {state === 'claimed' && (
          <div className="attendance-done">수령 완료</div>
        )}
      </div>
    );
  }

  function renderClaimResult() {
    if (!lastClaim) return null;

    const rewardDef = AttendanceDataTable.getReward(lastClaim.day);
    if (!rewardDef) return null;

    return (
      <div className="card" style={{ borderColor: '#ffd740', marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#ffd740' }}>
          Day {lastClaim.day} 보상 수령!
        </div>
        <div style={{ fontSize: 13 }}>
          {rewardDef.description}
        </div>
        {lastClaim.pet && (
          <div style={{ marginTop: 4, color: '#e040fb', fontSize: 13 }}>
            {lastClaim.pet.name} ({lastClaim.pet.tier}티어, {lastClaim.pet.grade}등급) 획득!
          </div>
        )}
        {lastClaim.equipment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <EquipmentIcon
              slot={lastClaim.equipment.slot}
              grade={lastClaim.equipment.grade}
              size={24}
              weaponSubType={lastClaim.equipment.weaponSubType}
            />
            <span style={{ fontSize: 13 }}>
              {lastClaim.equipment.isS && <span className="grade-s">[S] </span>}
              {EquipmentDataTable.getGradeLabel(lastClaim.equipment.grade)}{' '}
              {EquipmentDataTable.getSlotLabel(lastClaim.equipment.slot)} 획득!
            </span>
          </div>
        )}
      </div>
    );
  }

  const checkedCount = attendance.checkedDays.filter(d => d).length;
  const totalDays = AttendanceDataTable.getTotalDays();

  return (
    <div className="screen">
      <h2>이벤트</h2>

      <div className="inv-filter-bar">
        <button className="inv-filter-btn active">
          출석체크
        </button>
      </div>

      <div className="card">
        <div className="stat-row">
          <span>출석 진행도</span>
          <span>{checkedCount} / {totalDays}일</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(checkedCount / totalDays) * 100}%` }} />
        </div>
        {attendance.isComplete() && (
          <div style={{ textAlign: 'center', color: '#69f0ae', marginTop: 8, fontSize: 13 }}>
            7일 출석 완료! 내일 새 사이클이 시작됩니다.
          </div>
        )}
      </div>

      {renderClaimResult()}

      <div className="attendance-grid">
        {rewards.map(r => renderRewardCard(r))}
      </div>
    </div>
  );
}
