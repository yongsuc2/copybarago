import { useState } from 'react';
import { useGame } from '../GameContext';
import type { PullResult } from '../../domain/economy/TreasureChest';

export function GachaScreen() {
  const { game, refresh } = useGame();
  const [results, setResults] = useState<PullResult[]>([]);
  const chest = game.goldChest;

  function doPull() {
    const result = game.pullGacha();
    if (!result) return;
    setResults([result]);
    refresh();
  }

  function doPull10() {
    const results = game.pullGacha10();
    if (!results) return;
    setResults(results);
    refresh();
  }

  return (
    <div className="screen">
      <h2>뽑기</h2>

      <div className="card">
        <div className="stat-row"><span>보석</span><span>{Math.floor(game.player.resources.gems)}</span></div>
        <div className="stat-row"><span>천장</span><span>{chest.pityCount} / {chest.getPityThreshold()}</span></div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${chest.getPityProgress() * 100}%` }} />
        </div>
        <div className="stat-row"><span>천장까지</span><span>{chest.getRemainingToPity()}회</span></div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button className="btn btn-primary" onClick={doPull}
          disabled={game.player.resources.gems < chest.getCostPerPull()}>
          1회 뽑기 ({chest.getCostPerPull()} 보석)
        </button>
        <button className="btn btn-primary" onClick={doPull10}
          disabled={game.player.resources.gems < chest.getPull10Cost()}>
          10회 뽑기 ({chest.getPull10Cost()} 보석)
        </button>
      </div>

      {results.length > 0 && (
        <>
          <h3>결과</h3>
          {results.map((r, i) => (
            <div className="card" key={i} style={{ padding: 8, margin: '4px 0', borderColor: r.isPity ? '#ffd700' : '#333' }}>
              {r.equipment ? (
                <div>
                  <span className={`grade-${r.equipment.grade.toLowerCase()}`}>
                    {r.equipment.isS && <span className="grade-s">[S] </span>}
                    {r.equipment.grade}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 12 }}>{r.equipment.slot}</span>
                  {r.isPity && <span style={{ marginLeft: 8, color: '#ffd700', fontSize: 12 }}>천장!</span>}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#888' }}>
                  {r.resources.map(res => `${res.type}: +${res.amount}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
