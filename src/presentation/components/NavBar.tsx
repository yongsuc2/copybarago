import { useGame } from '../GameContext';
import { Home, Swords, TrendingUp, Shield, PawPrint, LayoutGrid, Gift, ListTodo, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { screen: string; label: string; icon: LucideIcon }[] = [
  { screen: 'main', label: '홈', icon: Home },
  { screen: 'chapter', label: '모험', icon: Swords },
  { screen: 'talent', label: '재능', icon: TrendingUp },
  { screen: 'equipment', label: '장비', icon: Shield },
  { screen: 'pet', label: '펫', icon: PawPrint },
  { screen: 'content', label: '콘텐츠', icon: LayoutGrid },
  { screen: 'gacha', label: '뽑기', icon: Gift },
  { screen: 'quest', label: '퀘스트', icon: ListTodo },
  { screen: 'settings', label: '설정', icon: Settings },
];

export function NavBar() {
  const { screen, setScreen } = useGame();

  return (
    <nav className="nav-bar">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.screen}
            className={`nav-btn ${screen === item.screen ? 'active' : ''}`}
            onClick={() => setScreen(item.screen)}
          >
            <Icon size={18} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
