import { PetTier } from '../../domain/enums';

const TIER_COLORS: Record<PetTier, string> = {
  [PetTier.S]: '#ffd740',
  [PetTier.A]: '#ce93d8',
  [PetTier.B]: '#81c784',
};

function elsaSvg(c: string) {
  return `<circle cx="50" cy="40" r="8" fill="${c}" opacity="0.3"/>
    <line x1="50" y1="20" x2="50" y2="60" stroke="${c}" stroke-width="2"/>
    <line x1="30" y1="40" x2="70" y2="40" stroke="${c}" stroke-width="2"/>
    <line x1="36" y1="26" x2="64" y2="54" stroke="${c}" stroke-width="1.5"/>
    <line x1="64" y1="26" x2="36" y2="54" stroke="${c}" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="4" fill="${c}"/>`;
}

function piggySvg(c: string) {
  return `<ellipse cx="50" cy="42" rx="22" ry="18" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="42" rx="22" ry="18" fill="none" stroke="${c}" stroke-width="2"/>
    <ellipse cx="50" cy="46" rx="10" ry="7" fill="${c}" opacity="0.6"/>
    <circle cx="46" cy="47" r="2" fill="#1a1a2e"/>
    <circle cx="54" cy="47" r="2" fill="#1a1a2e"/>
    <circle cx="40" cy="36" r="4" fill="#1a1a2e"/>
    <circle cx="60" cy="36" r="4" fill="#1a1a2e"/>
    <circle cx="41" cy="35" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="61" cy="35" r="1.5" fill="#fff" opacity="0.8"/>
    <path d="M30 30 Q34 18 40 26" fill="${c}" opacity="0.6"/>
    <path d="M70 30 Q66 18 60 26" fill="${c}" opacity="0.6"/>`;
}

function freyaSvg(c: string) {
  return `<ellipse cx="50" cy="44" rx="18" ry="16" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="44" rx="18" ry="16" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M32 38 Q28 18 38 30" fill="${c}" opacity="0.7"/>
    <path d="M68 38 Q72 18 62 30" fill="${c}" opacity="0.7"/>
    <circle cx="42" cy="40" r="3.5" fill="#1a1a2e"/>
    <circle cx="58" cy="40" r="3.5" fill="#1a1a2e"/>
    <circle cx="43" cy="39" r="1.2" fill="#fff" opacity="0.8"/>
    <circle cx="59" cy="39" r="1.2" fill="#fff" opacity="0.8"/>
    <path d="M46 50 Q50 54 54 50" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M28 34 Q18 28 14 40" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>
    <path d="M72 34 Q82 28 86 40" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
}

function slimeKingSvg(c: string) {
  return `<ellipse cx="50" cy="50" rx="24" ry="18" fill="${c}" opacity="0.5"/>
    <ellipse cx="50" cy="50" rx="24" ry="18" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="42" cy="46" r="4" fill="#1a1a2e"/>
    <circle cx="58" cy="46" r="4" fill="#1a1a2e"/>
    <circle cx="43" cy="45" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="59" cy="45" r="1.5" fill="#fff" opacity="0.8"/>
    <path d="M44 56 Q50 60 56 56" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M36 32 L42 24 L48 32" fill="${c}" stroke="${c}" stroke-width="1"/>
    <path d="M46 30 L50 20 L54 30" fill="${c}" stroke="${c}" stroke-width="1"/>
    <path d="M52 32 L58 24 L64 32" fill="${c}" stroke="${c}" stroke-width="1"/>`;
}

function flashSvg(c: string) {
  return `<path d="M56 14 L40 40 L52 40 L44 66 L68 34 L54 34 Z" fill="${c}" opacity="0.8"/>
    <path d="M56 14 L40 40 L52 40 L44 66 L68 34 L54 34 Z" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M50 30 L48 42 L56 32" fill="#fff" opacity="0.3"/>`;
}

function unicornSvg(c: string) {
  return `<ellipse cx="50" cy="48" rx="20" ry="16" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="48" rx="20" ry="16" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="50" y1="32" x2="50" y2="14" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="12" r="3" fill="${c}"/>
    <circle cx="42" cy="44" r="3.5" fill="#1a1a2e"/>
    <circle cx="58" cy="44" r="3.5" fill="#1a1a2e"/>
    <circle cx="43" cy="43" r="1.2" fill="#fff" opacity="0.8"/>
    <circle cx="59" cy="43" r="1.2" fill="#fff" opacity="0.8"/>
    <path d="M32 42 Q28 28 36 36" fill="${c}" opacity="0.6"/>
    <path d="M68 42 Q72 28 64 36" fill="${c}" opacity="0.6"/>`;
}

function iceWindFoxSvg(c: string) {
  return `<ellipse cx="50" cy="46" rx="18" ry="14" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="46" rx="18" ry="14" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M34 40 Q26 16 40 32" fill="${c}" opacity="0.7"/>
    <path d="M66 40 Q74 16 60 32" fill="${c}" opacity="0.7"/>
    <circle cx="43" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="57" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="44" cy="41" r="1" fill="#aef" opacity="0.9"/>
    <circle cx="58" cy="41" r="1" fill="#aef" opacity="0.9"/>
    <path d="M47 50 L50 53 L53 50" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M50 54 Q50 64 42 66" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
}

function littleElleSvg(c: string) {
  return `<ellipse cx="50" cy="48" rx="22" ry="18" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="48" rx="22" ry="18" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M36 42 Q20 36 24 54 Q28 60 36 54" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="1.5"/>
    <circle cx="42" cy="40" r="4" fill="#1a1a2e"/>
    <circle cx="58" cy="40" r="4" fill="#1a1a2e"/>
    <circle cx="43" cy="39" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="59" cy="39" r="1.5" fill="#fff" opacity="0.8"/>`;
}

function cleopatraSvg(c: string) {
  return `<path d="M50 18 Q56 18 58 24 Q62 36 58 50 Q54 60 50 64 Q46 60 42 50 Q38 36 42 24 Q44 18 50 18" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="2"/>
    <circle cx="46" cy="30" r="3" fill="#1a1a2e"/>
    <circle cx="54" cy="30" r="3" fill="#1a1a2e"/>
    <circle cx="47" cy="29" r="1" fill="#ff5252" opacity="0.8"/>
    <circle cx="55" cy="29" r="1" fill="#ff5252" opacity="0.8"/>
    <path d="M48 36 L50 40 L52 36" fill="none" stroke="#ff5252" stroke-width="1.5"/>
    <path d="M46 20 Q50 14 54 20" fill="none" stroke="${c}" stroke-width="2"/>`;
}

function purpleDemonFoxSvg(c: string) {
  return `<ellipse cx="50" cy="46" rx="18" ry="14" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="46" rx="18" ry="14" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M34 40 Q28 20 42 34" fill="${c}" opacity="0.7"/>
    <path d="M66 40 Q72 20 58 34" fill="${c}" opacity="0.7"/>
    <circle cx="43" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="57" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="44" cy="41" r="1" fill="#e040fb" opacity="0.9"/>
    <circle cx="58" cy="41" r="1" fill="#e040fb" opacity="0.9"/>
    <path d="M47 50 L50 53 L53 50" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M46 56 Q50 62 54 56" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
}

function babyDragonSvg(c: string) {
  return `<ellipse cx="50" cy="46" rx="20" ry="16" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="46" rx="20" ry="16" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M32 42 Q24 28 34 34" fill="${c}" opacity="0.6"/>
    <path d="M68 42 Q76 28 66 34" fill="${c}" opacity="0.6"/>
    <circle cx="42" cy="42" r="4" fill="#1a1a2e"/>
    <circle cx="58" cy="42" r="4" fill="#1a1a2e"/>
    <circle cx="43" cy="41" r="1.5" fill="#ff9800" opacity="0.8"/>
    <circle cx="59" cy="41" r="1.5" fill="#ff9800" opacity="0.8"/>
    <path d="M44 54 Q50 58 56 54" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M36 32 L32 22 L40 28" fill="${c}" opacity="0.5"/>
    <path d="M64 32 L68 22 L60 28" fill="${c}" opacity="0.5"/>`;
}

function monopolySvg(c: string) {
  return `<circle cx="50" cy="48" r="16" fill="${c}" opacity="0.4"/>
    <circle cx="50" cy="48" r="16" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M34 40 L34 28 L66 28 L66 40" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="1.5"/>
    <path d="M30 40 L70 40" stroke="${c}" stroke-width="2"/>
    <circle cx="43" cy="46" r="3" fill="#1a1a2e"/>
    <circle cx="57" cy="46" r="3" fill="#1a1a2e"/>
    <circle cx="44" cy="45" r="1" fill="#fff" opacity="0.8"/>
    <circle cx="58" cy="45" r="1" fill="#fff" opacity="0.8"/>
    <path d="M45 56 Q50 60 55 56" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>`;
}

function glazedShroomSvg(c: string) {
  return `<rect x="44" y="46" width="12" height="20" rx="3" fill="${c}" opacity="0.6"/>
    <ellipse cx="50" cy="42" rx="22" ry="14" fill="${c}" opacity="0.5"/>
    <ellipse cx="50" cy="42" rx="22" ry="14" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="40" cy="38" r="3" fill="#fff" opacity="0.3"/>
    <circle cx="56" cy="34" r="4" fill="#fff" opacity="0.3"/>
    <circle cx="44" cy="48" r="2" fill="#1a1a2e"/>
    <circle cx="56" cy="48" r="2" fill="#1a1a2e"/>`;
}

function flameFoxSvg(c: string) {
  return `<ellipse cx="50" cy="46" rx="18" ry="14" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="46" rx="18" ry="14" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M34 40 Q28 20 42 34" fill="${c}" opacity="0.7"/>
    <path d="M66 40 Q72 20 58 34" fill="${c}" opacity="0.7"/>
    <circle cx="43" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="57" cy="42" r="3" fill="#1a1a2e"/>
    <circle cx="44" cy="41" r="1" fill="#ff5252" opacity="0.9"/>
    <circle cx="58" cy="41" r="1" fill="#ff5252" opacity="0.9"/>
    <path d="M47 50 L50 53 L53 50" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>
    <path d="M40 56 Q44 64 50 60 Q56 64 60 56" fill="none" stroke="#ff5252" stroke-width="1.5" opacity="0.6"/>`;
}

function cactusFighterSvg(c: string) {
  return `<rect x="42" y="24" width="16" height="40" rx="8" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="2"/>
    <path d="M42 38 Q30 38 30 30 Q30 24 36 24 L36 32" fill="none" stroke="${c}" stroke-width="2.5"/>
    <path d="M58 44 Q70 44 70 36 Q70 30 64 30 L64 38" fill="none" stroke="${c}" stroke-width="2.5"/>
    <circle cx="47" cy="36" r="2" fill="#1a1a2e"/>
    <circle cx="53" cy="36" r="2" fill="#1a1a2e"/>
    <path d="M48 42 L50 44 L52 42" fill="none" stroke="#1a1a2e" stroke-width="1"/>`;
}

function brownBunnySvg(c: string) {
  return `<ellipse cx="50" cy="50" rx="18" ry="14" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="50" rx="18" ry="14" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M40 38 Q38 14 44 36" fill="${c}" opacity="0.6" stroke="${c}" stroke-width="1.5"/>
    <path d="M60 38 Q62 14 56 36" fill="${c}" opacity="0.6" stroke="${c}" stroke-width="1.5"/>
    <circle cx="43" cy="46" r="3" fill="#1a1a2e"/>
    <circle cx="57" cy="46" r="3" fill="#1a1a2e"/>
    <circle cx="44" cy="45" r="1" fill="#fff" opacity="0.8"/>
    <circle cx="58" cy="45" r="1" fill="#fff" opacity="0.8"/>
    <path d="M47 54 L50 56 L53 54" fill="none" stroke="#1a1a2e" stroke-width="1.5"/>`;
}

function blueBirdSvg(c: string) {
  return `<ellipse cx="50" cy="44" rx="18" ry="16" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="44" rx="18" ry="16" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="42" cy="40" r="3.5" fill="#1a1a2e"/>
    <circle cx="58" cy="40" r="3.5" fill="#1a1a2e"/>
    <circle cx="43" cy="39" r="1.2" fill="#fff" opacity="0.8"/>
    <circle cx="59" cy="39" r="1.2" fill="#fff" opacity="0.8"/>
    <path d="M46 48 L50 54 L54 48" fill="#ff9800" opacity="0.8"/>
    <path d="M32 38 Q20 30 26 44" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>
    <path d="M68 38 Q80 30 74 44" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
}

function greenFrogSvg(c: string) {
  return `<ellipse cx="50" cy="48" rx="24" ry="16" fill="${c}" opacity="0.4"/>
    <ellipse cx="50" cy="48" rx="24" ry="16" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="38" cy="34" r="7" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="1.5"/>
    <circle cx="62" cy="34" r="7" fill="${c}" opacity="0.5" stroke="${c}" stroke-width="1.5"/>
    <circle cx="38" cy="34" r="3.5" fill="#1a1a2e"/>
    <circle cx="62" cy="34" r="3.5" fill="#1a1a2e"/>
    <circle cx="39" cy="33" r="1.2" fill="#fff" opacity="0.8"/>
    <circle cx="63" cy="33" r="1.2" fill="#fff" opacity="0.8"/>
    <path d="M42 54 Q50 60 58 54" fill="none" stroke="#1a1a2e" stroke-width="2"/>`;
}

const PET_SVG_MAP: Record<string, (c: string) => string> = {
  elsa: elsaSvg,
  piggy: piggySvg,
  freya: freyaSvg,
  slime_king: slimeKingSvg,
  flash: flashSvg,
  unicorn: unicornSvg,
  ice_wind_fox: iceWindFoxSvg,
  little_elle: littleElleSvg,
  cleopatra: cleopatraSvg,
  purple_demon_fox: purpleDemonFoxSvg,
  baby_dragon: babyDragonSvg,
  monopoly: monopolySvg,
  glazed_shroom: glazedShroomSvg,
  flame_fox: flameFoxSvg,
  cactus_fighter: cactusFighterSvg,
  brown_bunny: brownBunnySvg,
  blue_bird: blueBirdSvg,
  green_frog: greenFrogSvg,
};

interface PetIconProps {
  petId: string;
  tier: PetTier;
  size?: number;
}

export function PetIcon({ petId, tier, size = 40 }: PetIconProps) {
  const color = TIER_COLORS[tier];
  const svgFn = PET_SVG_MAP[petId];

  if (!svgFn) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="16" fill={color} opacity={0.4} stroke={color} strokeWidth={2} />
        <text x="50" y="45" textAnchor="middle" fill={color} fontSize="14">?</text>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 80"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: svgFn(color) }}
    />
  );
}
