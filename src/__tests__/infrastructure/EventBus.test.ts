import { describe, it, expect, vi } from 'vitest';
import { EventBus, GameEvents } from '../../infrastructure/EventBus';

describe('EventBus', () => {
  it('delivers events to subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.subscribe(GameEvents.BATTLE_START, handler);
    bus.publish(GameEvents.BATTLE_START, { player: 'p1' });

    expect(handler).toHaveBeenCalledWith({ player: 'p1' });
  });

  it('supports multiple subscribers', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.subscribe(GameEvents.BATTLE_END, h1);
    bus.subscribe(GameEvents.BATTLE_END, h2);
    bus.publish(GameEvents.BATTLE_END, { result: 'win' });

    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it('unsubscribes correctly', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe(GameEvents.LEVEL_UP, handler);
    unsubscribe();
    bus.publish(GameEvents.LEVEL_UP, { level: 5 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handlers for different event types', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.subscribe(GameEvents.BATTLE_START, handler);
    bus.publish(GameEvents.BATTLE_END, { result: 'lose' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.subscribe(GameEvents.BATTLE_START, handler);
    bus.clear();
    bus.publish(GameEvents.BATTLE_START, {});

    expect(handler).not.toHaveBeenCalled();
  });
});
