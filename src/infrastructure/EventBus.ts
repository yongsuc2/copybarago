type Handler<T = unknown> = (event: T) => void;

export class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  subscribe<T>(eventType: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const handlerSet = this.handlers.get(eventType)!;
    handlerSet.add(handler as Handler);

    return () => {
      handlerSet.delete(handler as Handler);
      if (handlerSet.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  publish<T>(eventType: string, event: T): void {
    const handlerSet = this.handlers.get(eventType);
    if (!handlerSet) return;
    for (const handler of handlerSet) {
      handler(event);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const GameEvents = {
  BATTLE_START: 'BATTLE_START',
  BATTLE_END: 'BATTLE_END',
  CHAPTER_CLEAR: 'CHAPTER_CLEAR',
  LEVEL_UP: 'LEVEL_UP',
  EQUIPMENT_CHANGE: 'EQUIPMENT_CHANGE',
  RESOURCE_CHANGE: 'RESOURCE_CHANGE',
  PET_CHANGE: 'PET_CHANGE',
  TALENT_UPGRADE: 'TALENT_UPGRADE',
  HERITAGE_UPGRADE: 'HERITAGE_UPGRADE',
  ENCOUNTER_RESOLVED: 'ENCOUNTER_RESOLVED',
  DAILY_RESET: 'DAILY_RESET',
  EVENT_START: 'EVENT_START',
} as const;
