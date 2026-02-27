import { BattleLogType, type BattleLogEntry } from './BattleLog';

export interface BattleDamageResult {
  damageMap: Map<string, number>;
  healMap: Map<string, number>;
}

export function categorizeBattleEntries(entries: BattleLogEntry[], playerName: string): BattleDamageResult {
  const damageMap = new Map<string, number>();
  const healMap = new Map<string, number>();

  for (const entry of entries) {
    const isDmg = entry.type === BattleLogType.ATTACK
      || entry.type === BattleLogType.CRIT
      || entry.type === BattleLogType.SKILL_DAMAGE
      || entry.type === BattleLogType.COUNTER
      || entry.type === BattleLogType.RAGE_ATTACK;
    const isDot = entry.type === BattleLogType.DOT_DAMAGE;
    const isHeal = entry.type === BattleLogType.LIFESTEAL
      || entry.type === BattleLogType.HOT_HEAL
      || entry.type === BattleLogType.REVIVE
      || entry.type === BattleLogType.HEAL;

    if (isDmg && entry.source === playerName && entry.target !== playerName) {
      let key: string;
      if (entry.type === BattleLogType.RAGE_ATTACK) {
        key = '분노 공격';
      } else if (entry.skillName && entry.skillName !== '일반 공격') {
        key = entry.skillName;
      } else if (entry.type === BattleLogType.COUNTER) {
        key = '반격';
      } else {
        key = '일반 공격';
      }
      damageMap.set(key, (damageMap.get(key) ?? 0) + entry.value);
    } else if (isDot && entry.target !== playerName) {
      const key = '독 피해';
      damageMap.set(key, (damageMap.get(key) ?? 0) + entry.value);
    }

    if (isHeal && entry.target === playerName) {
      let key: string;
      if (entry.type === BattleLogType.LIFESTEAL) key = '흡혈';
      else if (entry.type === BattleLogType.HOT_HEAL) key = '재생';
      else if (entry.type === BattleLogType.REVIVE) key = '부활';
      else key = entry.skillName || '회복';

      healMap.set(key, (healMap.get(key) ?? 0) + entry.value);
    }
  }

  return { damageMap, healMap };
}
