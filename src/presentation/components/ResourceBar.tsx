import { useGame } from '../GameContext';

export function ResourceBar() {
  const { game } = useGame();
  const r = game.player.resources;

  return (
    <div className="resource-bar">
      <span className="res-item" title="Gold">G: {Math.floor(r.gold)}</span>
      <span className="res-item" title="Gems">D: {Math.floor(r.gems)}</span>
      <span className="res-item" title="Stamina">S: {Math.floor(r.stamina)}</span>
      <span className="res-item" title="Challenge Tokens">T: {r.challengeTokens}</span>
      <span className="res-item" title="Arena Tickets">A: {r.arenaTickets}</span>
    </div>
  );
}
