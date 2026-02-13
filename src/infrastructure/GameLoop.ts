type TickCallback = (deltaMs: number) => void;

export class GameLoop {
  private callbacks: Set<TickCallback> = new Set();
  private lastTime: number = 0;
  private running: boolean = false;
  private animFrameId: number = 0;

  addTickCallback(callback: TickCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  manualTick(deltaMs: number): void {
    for (const callback of this.callbacks) {
      callback(deltaMs);
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const deltaMs = now - this.lastTime;
    this.lastTime = now;

    for (const callback of this.callbacks) {
      callback(deltaMs);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
