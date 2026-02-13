import { ResourceType } from '../enums';

export interface CostEntry {
  type: ResourceType;
  amount: number;
}

export class Cost {
  constructor(public readonly entries: CostEntry[]) {}

  static single(type: ResourceType, amount: number): Cost {
    return new Cost([{ type, amount }]);
  }

  static free(): Cost {
    return new Cost([]);
  }

  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  getAmount(type: ResourceType): number {
    const entry = this.entries.find(e => e.type === type);
    return entry?.amount ?? 0;
  }
}
