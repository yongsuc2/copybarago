import { Result } from '../value-objects/Result';

export interface SaveData {
  version: number;
  timestamp: number;
  playerData: Record<string, unknown>;
}

const SAVE_VERSION = 1;
const STORAGE_KEY = 'capybara_go_save';

export class SaveManager {
  save(data: Record<string, unknown>): Result {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      playerData: data,
    };

    try {
      const json = JSON.stringify(saveData);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, json);
      }
      return Result.ok();
    } catch {
      return Result.fail('Failed to save');
    }
  }

  load(): Result<SaveData> {
    try {
      if (typeof localStorage === 'undefined') {
        return Result.fail('localStorage not available');
      }

      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) {
        return Result.fail('No save data found');
      }

      const data = JSON.parse(json) as SaveData;

      if (data.version !== SAVE_VERSION) {
        return Result.fail(`Save version mismatch: expected ${SAVE_VERSION}, got ${data.version}`);
      }

      return Result.ok(data);
    } catch {
      return Result.fail('Failed to load save data');
    }
  }

  deleteSave(): Result {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      return Result.ok();
    } catch {
      return Result.fail('Failed to delete save');
    }
  }

  hasSave(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  getLastSaveTime(): number | null {
    const result = this.load();
    if (result.isFail() || !result.data) return null;
    return result.data.timestamp;
  }
}
