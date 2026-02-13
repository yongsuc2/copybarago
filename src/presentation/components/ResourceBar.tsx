import { useGame } from '../GameContext';
import { Coins, Gem, Zap, Medal, Ticket } from 'lucide-react';

export function ResourceBar() {
  const { game } = useGame();
  const r = game.player.resources;

  return (
    <div className="resource-bar">
      <span className="res-item" title="골드"><Coins size={13} color="#ffd700" /> {Math.floor(r.gold)}</span>
      <span className="res-item" title="보석"><Gem size={13} color="#e040fb" /> {Math.floor(r.gems)}</span>
      <span className="res-item" title="스태미나"><Zap size={13} color="#4caf50" /> {Math.floor(r.stamina)}</span>
      <span className="res-item" title="도전 토큰"><Medal size={13} color="#ff9800" /> {r.challengeTokens}</span>
      <span className="res-item" title="아레나 티켓"><Ticket size={13} color="#2196f3" /> {r.arenaTickets}</span>
    </div>
  );
}
