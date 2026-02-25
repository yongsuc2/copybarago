const SPRITES: Record<string, { body: string; eyes: string; extra?: string }> = {
  capybara: {
    body: `<ellipse cx="50" cy="58" rx="30" ry="22" fill="#8B6914"/>
           <ellipse cx="50" cy="42" rx="22" ry="18" fill="#A0782C"/>
           <ellipse cx="38" cy="30" rx="6" ry="8" fill="#A0782C"/>
           <ellipse cx="62" cy="30" rx="6" ry="8" fill="#A0782C"/>`,
    eyes: `<circle cx="42" cy="40" r="3" fill="#222"/>
           <circle cx="58" cy="40" r="3" fill="#222"/>
           <ellipse cx="50" cy="48" rx="4" ry="2.5" fill="#5a3e0a"/>`,
  },
  slime: {
    body: `<ellipse cx="50" cy="60" rx="28" ry="20" fill="#4caf50"/>
           <ellipse cx="50" cy="45" rx="22" ry="22" fill="#66bb6a"/>
           <ellipse cx="50" cy="30" rx="8" ry="8" fill="#81c784"/>`,
    eyes: `<circle cx="42" cy="42" r="4" fill="#fff"/>
           <circle cx="58" cy="42" r="4" fill="#fff"/>
           <circle cx="43" cy="43" r="2" fill="#222"/>
           <circle cx="59" cy="43" r="2" fill="#222"/>`,
  },
  goblin: {
    body: `<ellipse cx="50" cy="60" rx="20" ry="18" fill="#558b2f"/>
           <circle cx="50" cy="40" r="16" fill="#689f38"/>
           <polygon points="34,32 28,18 38,28" fill="#689f38"/>
           <polygon points="66,32 72,18 62,28" fill="#689f38"/>`,
    eyes: `<circle cx="44" cy="38" r="3" fill="#ff5722"/>
           <circle cx="56" cy="38" r="3" fill="#ff5722"/>
           <path d="M43 48 Q50 52 57 48" stroke="#222" fill="none" stroke-width="2"/>`,
  },
  skeleton: {
    body: `<ellipse cx="50" cy="62" rx="16" ry="16" fill="#e0e0e0"/>
           <circle cx="50" cy="38" r="16" fill="#eeeeee"/>
           <rect x="46" y="54" width="8" height="14" rx="2" fill="#bdbdbd"/>`,
    eyes: `<circle cx="43" cy="36" r="5" fill="#222"/>
           <circle cx="57" cy="36" r="5" fill="#222"/>
           <rect x="44" y="44" width="12" height="2" fill="#222"/>`,
  },
  orc: {
    body: `<ellipse cx="50" cy="58" rx="28" ry="24" fill="#33691e"/>
           <circle cx="50" cy="38" r="20" fill="#558b2f"/>
           <rect x="36" y="46" width="6" height="8" rx="2" fill="#fff"/>
           <rect x="58" y="46" width="6" height="8" rx="2" fill="#fff"/>`,
    eyes: `<circle cx="42" cy="34" r="4" fill="#ff3d00"/>
           <circle cx="58" cy="34" r="4" fill="#ff3d00"/>`,
  },
  dark_knight: {
    body: `<ellipse cx="50" cy="60" rx="22" ry="20" fill="#37474f"/>
           <circle cx="50" cy="38" r="18" fill="#455a64"/>
           <polygon points="50,14 38,32 62,32" fill="#546e7a"/>
           <rect x="72" y="36" width="16" height="4" rx="1" fill="#90a4ae"/>`,
    eyes: `<circle cx="44" cy="36" r="3" fill="#f44336"/>
           <circle cx="56" cy="36" r="3" fill="#f44336"/>`,
  },
  elite_wolf: {
    body: `<ellipse cx="50" cy="60" rx="26" ry="18" fill="#616161"/>
           <ellipse cx="50" cy="42" rx="20" ry="16" fill="#757575"/>
           <polygon points="38,30 30,14 42,26" fill="#757575"/>
           <polygon points="62,30 70,14 58,26" fill="#757575"/>
           <ellipse cx="68" cy="62" rx="12" ry="4" fill="#616161" transform="rotate(-30 68 62)"/>`,
    eyes: `<circle cx="42" cy="40" r="3" fill="#ffeb3b"/>
           <circle cx="58" cy="40" r="3" fill="#ffeb3b"/>`,
  },
  elite_mage: {
    body: `<ellipse cx="50" cy="62" rx="20" ry="18" fill="#4a148c"/>
           <circle cx="50" cy="40" r="16" fill="#6a1b9a"/>
           <polygon points="50,10 36,36 64,36" fill="#7b1fa2"/>
           <circle cx="50" cy="10" r="4" fill="#e040fb"/>`,
    eyes: `<circle cx="44" cy="38" r="3" fill="#e040fb"/>
           <circle cx="56" cy="38" r="3" fill="#e040fb"/>`,
  },
  boss_dragon: {
    body: `<ellipse cx="50" cy="58" rx="30" ry="24" fill="#b71c1c"/>
           <circle cx="50" cy="36" r="20" fill="#c62828"/>
           <polygon points="24,40 10,20 30,36" fill="#d32f2f"/>
           <polygon points="76,40 90,20 70,36" fill="#d32f2f"/>
           <polygon points="50,20 44,8 50,14 56,8" fill="#e53935"/>`,
    eyes: `<circle cx="42" cy="34" r="4" fill="#ffd600"/>
           <circle cx="58" cy="34" r="4" fill="#ffd600"/>
           <ellipse cx="42" cy="34" rx="1.5" ry="4" fill="#222"/>
           <ellipse cx="58" cy="34" rx="1.5" ry="4" fill="#222"/>`,
  },
  boss_demon: {
    body: `<ellipse cx="50" cy="58" rx="26" ry="22" fill="#1a1a1a"/>
           <circle cx="50" cy="36" r="18" fill="#2c2c2c"/>
           <polygon points="34,28 24,10 38,24" fill="#2c2c2c"/>
           <polygon points="66,28 76,10 62,24" fill="#2c2c2c"/>
           <polygon points="20,50 8,30 26,44" fill="#1a1a1a"/>
           <polygon points="80,50 92,30 74,44" fill="#1a1a1a"/>`,
    eyes: `<circle cx="42" cy="34" r="4" fill="#e94560"/>
           <circle cx="58" cy="34" r="4" fill="#e94560"/>`,
  },
  boss_golem: {
    body: `<rect x="26" y="40" width="48" height="40" rx="8" fill="#78909c"/>
           <rect x="30" y="20" width="40" height="30" rx="6" fill="#90a4ae"/>
           <rect x="18" y="44" width="12" height="28" rx="4" fill="#78909c"/>
           <rect x="70" y="44" width="12" height="28" rx="4" fill="#78909c"/>`,
    eyes: `<circle cx="42" cy="32" r="5" fill="#76ff03"/>
           <circle cx="58" cy="32" r="5" fill="#76ff03"/>`,
  },
  dungeon_dragon: {
    body: `<ellipse cx="50" cy="58" rx="30" ry="24" fill="#00695c"/>
           <circle cx="50" cy="36" r="20" fill="#00897b"/>
           <polygon points="22,42 6,22 28,38" fill="#26a69a"/>
           <polygon points="78,42 94,22 72,38" fill="#26a69a"/>
           <polygon points="50,20 42,6 50,14 58,6" fill="#4db6ac"/>`,
    eyes: `<circle cx="42" cy="34" r="4" fill="#ffd600"/>
           <circle cx="58" cy="34" r="4" fill="#ffd600"/>
           <ellipse cx="42" cy="34" rx="1.5" ry="4" fill="#222"/>
           <ellipse cx="58" cy="34" rx="1.5" ry="4" fill="#222"/>`,
    extra: `<path d="M40 48 Q50 56 60 48" stroke="#4db6ac" fill="none" stroke-width="2"/>`,
  },
  world_tree: {
    body: `<rect x="42" y="50" width="16" height="30" rx="3" fill="#5d4037"/>
           <rect x="38" y="55" width="6" height="12" rx="2" fill="#4e342e" transform="rotate(-20 41 61)"/>
           <rect x="56" y="55" width="6" height="12" rx="2" fill="#4e342e" transform="rotate(20 59 61)"/>
           <circle cx="50" cy="36" r="22" fill="#2e7d32"/>
           <circle cx="38" cy="28" r="12" fill="#388e3c"/>
           <circle cx="62" cy="28" r="12" fill="#388e3c"/>
           <circle cx="50" cy="20" r="10" fill="#43a047"/>`,
    eyes: `<circle cx="42" cy="38" r="4" fill="#76ff03"/>
           <circle cx="58" cy="38" r="4" fill="#76ff03"/>
           <circle cx="42" cy="38" r="2" fill="#222"/>
           <circle cx="58" cy="38" r="2" fill="#222"/>`,
  },
  harpy: {
    body: `<ellipse cx="50" cy="60" rx="18" ry="16" fill="#5c6bc0"/>
           <circle cx="50" cy="40" r="14" fill="#7986cb"/>
           <polygon points="24,46 4,28 30,42" fill="#9fa8da"/>
           <polygon points="76,46 96,28 70,42" fill="#9fa8da"/>
           <polygon points="20,50 8,36 26,46" fill="#7986cb"/>
           <polygon points="80,50 92,36 74,46" fill="#7986cb"/>
           <polygon points="40,76 46,68 50,78 54,68 60,76" fill="#5c6bc0"/>`,
    eyes: `<circle cx="44" cy="38" r="3" fill="#fff"/>
           <circle cx="56" cy="38" r="3" fill="#fff"/>
           <circle cx="44" cy="38" r="1.5" fill="#222"/>
           <circle cx="56" cy="38" r="1.5" fill="#222"/>`,
    extra: `<polygon points="50,32 47,26 53,26" fill="#ffab00"/>`,
  },
};

const NAME_TO_TYPE: Record<string, string> = {
  'Capybara': 'capybara',
  'Slime': 'slime',
  'Goblin': 'goblin',
  'Skeleton': 'skeleton',
  'Orc': 'orc',
  'Dark Knight': 'dark_knight',
  'Alpha Wolf': 'elite_wolf',
  'Dark Mage': 'elite_mage',
  'Ancient Dragon': 'boss_dragon',
  'Demon Lord': 'boss_demon',
  'Stone Golem': 'boss_golem',
  'Dungeon Dragon': 'dungeon_dragon',
  'World Tree': 'world_tree',
  'Harpy': 'harpy',
};

export function getCharacterType(name: string): string {
  return NAME_TO_TYPE[name] ?? 'slime';
}

interface CharacterSpriteProps {
  type: string;
  size?: number;
  isBoss?: boolean;
}

export function CharacterSprite({ type, size = 64, isBoss = false }: CharacterSpriteProps) {
  const sprite = SPRITES[type] ?? SPRITES.slime;
  const actualSize = isBoss ? size * 1.4 : size;

  return (
    <svg
      width={actualSize}
      height={actualSize}
      viewBox="0 0 100 80"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: sprite.body + sprite.eyes + (sprite.extra ?? '') }}
    />
  );
}
