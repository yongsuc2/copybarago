import { useGame } from '../GameContext';

const NAV_ITEMS = [
  { screen: 'main', label: 'Home' },
  { screen: 'chapter', label: 'Chapter' },
  { screen: 'talent', label: 'Talent' },
  { screen: 'equipment', label: 'Equip' },
  { screen: 'pet', label: 'Pet' },
  { screen: 'content', label: 'Content' },
  { screen: 'gacha', label: 'Gacha' },
];

export function NavBar() {
  const { screen, setScreen } = useGame();

  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map(item => (
        <button
          key={item.screen}
          className={`nav-btn ${screen === item.screen ? 'active' : ''}`}
          onClick={() => setScreen(item.screen)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
