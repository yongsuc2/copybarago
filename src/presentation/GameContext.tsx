import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { GameManager } from '../services/GameManager';

interface GameContextValue {
  game: GameManager;
  screen: string;
  setScreen: (screen: string) => void;
  refresh: () => void;
  tick: number;
}

const GameContext = createContext<GameContextValue | null>(null);

const gameInstance = new GameManager();

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState('main');
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  return (
    <GameContext.Provider value={{ game: gameInstance, screen, setScreen, refresh, tick }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
