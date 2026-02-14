import { useState } from 'react';
import { useGame } from '../GameContext';
import { DebugPanel } from './DebugPanel';

export function SettingsScreen() {
  const { game, refresh } = useGame();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    const ok = game.saveGame();
    if (ok) {
      showToast('저장 완료', 'success');
      refresh();
    } else {
      showToast('저장 실패', 'error');
    }
  }

  function handleLoad() {
    if (!confirm('현재 진행 상태를 덮어씁니다. 불러오시겠습니까?')) return;
    const ok = game.loadGame();
    if (ok) {
      showToast('불러오기 완료', 'success');
      refresh();
    } else {
      showToast('불러오기 실패 (세이브 없음)', 'error');
    }
  }

  function handleDelete() {
    if (!confirm('세이브 데이터를 삭제합니다. 계속하시겠습니까?')) return;
    game.deleteSave();
    showToast('세이브 삭제 완료', 'success');
    refresh();
  }

  function handleExport() {
    const encoded = game.exportSave();
    navigator.clipboard.writeText(encoded).then(() => {
      showToast('클립보드에 복사됨', 'success');
    }).catch(() => {
      setImportText(encoded);
      setShowImport(true);
      showToast('복사 실패 — 아래에서 직접 복사하세요', 'error');
    });
  }

  function handleImport() {
    if (!importText.trim()) return;
    if (!confirm('현재 진행 상태를 덮어씁니다. 가져오시겠습니까?')) return;
    const ok = game.importSave(importText.trim());
    if (ok) {
      showToast('가져오기 완료', 'success');
      setImportText('');
      setShowImport(false);
      refresh();
    } else {
      showToast('가져오기 실패 (잘못된 데이터)', 'error');
    }
  }

  function formatTime(ts: number | null): string {
    if (!ts) return '없음';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div className="screen">
      <h2>설정</h2>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="settings-section">
        <h3 style={{ margin: '0 0 8px' }}>세이브</h3>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          마지막 저장: {formatTime(game.getLastSaveTime())}
        </div>
        <div className="settings-btn-row">
          <button className="settings-btn" onClick={handleSave}>저장</button>
          <button className="settings-btn" onClick={handleLoad} disabled={!game.hasSave()}>
            불러오기
          </button>
          <button className="settings-btn danger" onClick={handleDelete} disabled={!game.hasSave()}>
            삭제
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 style={{ margin: '0 0 8px' }}>데이터 관리</h3>
        <div className="settings-btn-row">
          <button className="settings-btn" onClick={handleExport}>내보내기</button>
          <button className="settings-btn" onClick={() => setShowImport(!showImport)}>
            가져오기
          </button>
        </div>
        {showImport && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="내보내기 코드를 붙여넣으세요"
              style={{
                width: '100%', height: 80, padding: 8, borderRadius: 4,
                border: '1px solid #444', background: '#2a2a2a', color: '#fff',
                fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <button
              className="settings-btn"
              style={{ marginTop: 4, width: '100%' }}
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              가져오기 실행
            </button>
          </div>
        )}
      </div>

      <DebugPanel />
    </div>
  );
}
