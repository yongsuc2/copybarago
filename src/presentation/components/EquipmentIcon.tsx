import { EquipmentGrade, SlotType } from '../../domain/enums';

const GRADE_COLORS: Record<EquipmentGrade, string> = {
  [EquipmentGrade.COMMON]: '#aaa',
  [EquipmentGrade.UNCOMMON]: '#4caf50',
  [EquipmentGrade.RARE]: '#2196f3',
  [EquipmentGrade.EPIC]: '#9c27b0',
  [EquipmentGrade.LEGENDARY]: '#ff9800',
  [EquipmentGrade.MYTHIC]: '#e94560',
};

const GRADE_INDEX: Record<EquipmentGrade, number> = {
  [EquipmentGrade.COMMON]: 0,
  [EquipmentGrade.UNCOMMON]: 1,
  [EquipmentGrade.RARE]: 2,
  [EquipmentGrade.EPIC]: 3,
  [EquipmentGrade.LEGENDARY]: 4,
  [EquipmentGrade.MYTHIC]: 5,
};

function weaponSvg(color: string, grade: EquipmentGrade): string {
  const gi = GRADE_INDEX[grade];
  if (gi >= 4) {
    return `<line x1="50" y1="12" x2="50" y2="70" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
            <path d="M38 18 L50 12 L62 18" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M35 24 L50 16 L65 24" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
            <line x1="38" y1="50" x2="62" y2="50" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
            <circle cx="50" cy="46" r="3" fill="${color}" opacity="0.8"/>`;
  }
  if (gi >= 2) {
    return `<line x1="50" y1="14" x2="50" y2="72" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="50" cy="14" r="6" fill="none" stroke="${color}" stroke-width="2.5"/>
            <circle cx="50" cy="14" r="2" fill="${color}"/>
            <line x1="38" y1="52" x2="62" y2="52" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<path d="M50 14 L56 32 L50 70 L44 32 Z" fill="${color}" opacity="0.9"/>
          <line x1="38" y1="52" x2="62" y2="52" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="50" cy="52" r="2.5" fill="${color}"/>`;
}

function armorSvg(color: string): string {
  return `<path d="M30 30 L50 22 L70 30 L70 55 L50 68 L30 55 Z" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="2"/>
          <path d="M40 30 L50 26 L60 30 L60 48 L50 56 L40 48 Z" fill="${color}" opacity="0.5"/>
          <line x1="50" y1="26" x2="50" y2="56" stroke="${color}" stroke-width="1.5" opacity="0.6"/>`;
}

function ringSvg(color: string): string {
  return `<ellipse cx="50" cy="46" rx="18" ry="20" fill="none" stroke="${color}" stroke-width="3.5"/>
          <ellipse cx="50" cy="30" rx="6" ry="5" fill="${color}"/>
          <circle cx="50" cy="30" r="2.5" fill="#fff" opacity="0.7"/>`;
}

function necklaceSvg(color: string): string {
  return `<path d="M30 28 Q30 20 50 18 Q70 20 70 28" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M30 28 L38 48 L50 56 L62 48 L70 28" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>
          <circle cx="50" cy="56" r="7" fill="${color}" opacity="0.8"/>
          <circle cx="50" cy="56" r="3" fill="#fff" opacity="0.5"/>`;
}

function shoesSvg(color: string): string {
  return `<path d="M30 38 L30 58 L56 58 L66 48 L66 38 Z" fill="${color}" opacity="0.7" stroke="${color}" stroke-width="2"/>
          <path d="M56 58 L72 58 L72 50 L66 48" fill="${color}" opacity="0.5" stroke="${color}" stroke-width="1.5"/>
          <line x1="34" y1="42" x2="62" y2="42" stroke="#fff" stroke-width="1.5" opacity="0.3"/>`;
}

function glovesSvg(color: string): string {
  return `<path d="M36 32 L36 62 L56 62 L56 32 Z" fill="${color}" opacity="0.6" stroke="${color}" stroke-width="2" rx="4"/>
          <rect x="36" y="28" width="20" height="8" rx="3" fill="${color}" opacity="0.8"/>
          <line x1="42" y1="36" x2="42" y2="56" stroke="${color}" stroke-width="1" opacity="0.4"/>
          <line x1="50" y1="36" x2="50" y2="56" stroke="${color}" stroke-width="1" opacity="0.4"/>
          <path d="M56 40 L66 34 L68 38 L58 46 Z" fill="${color}" opacity="0.5"/>`;
}

function hatSvg(color: string): string {
  return `<ellipse cx="50" cy="58" rx="28" ry="6" fill="${color}" opacity="0.7"/>
          <path d="M28 58 Q28 30 50 22 Q72 30 72 58" fill="${color}" opacity="0.5" stroke="${color}" stroke-width="2"/>
          <ellipse cx="50" cy="58" rx="28" ry="6" fill="none" stroke="${color}" stroke-width="2"/>
          <circle cx="50" cy="28" r="3" fill="${color}"/>`;
}

const SLOT_SVG_MAP: Record<SlotType, (color: string, grade: EquipmentGrade) => string> = {
  [SlotType.WEAPON]: weaponSvg,
  [SlotType.ARMOR]: (c) => armorSvg(c),
  [SlotType.RING]: (c) => ringSvg(c),
  [SlotType.NECKLACE]: (c) => necklaceSvg(c),
  [SlotType.SHOES]: (c) => shoesSvg(c),
  [SlotType.GLOVES]: (c) => glovesSvg(c),
  [SlotType.HAT]: (c) => hatSvg(c),
};

interface EquipmentIconProps {
  slot: SlotType;
  grade?: EquipmentGrade;
  size?: number;
}

export function EquipmentIcon({ slot, grade = EquipmentGrade.COMMON, size = 36 }: EquipmentIconProps) {
  const color = GRADE_COLORS[grade];
  const svgContent = SLOT_SVG_MAP[slot](color, grade);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 80"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
