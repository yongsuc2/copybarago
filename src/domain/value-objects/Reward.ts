import { ResourceType } from '../enums';

export interface ResourceReward {
  type: ResourceType;
  amount: number;
}

export class Reward {
  constructor(
    public readonly resources: ResourceReward[] = [],
    public readonly equipmentIds: string[] = [],
    public readonly skillIds: string[] = [],
    public readonly petIds: string[] = [],
  ) {}

  static empty(): Reward {
    return new Reward();
  }

  static fromResources(...resources: ResourceReward[]): Reward {
    return new Reward(resources);
  }

  merge(other: Reward): Reward {
    return new Reward(
      [...this.resources, ...other.resources],
      [...this.equipmentIds, ...other.equipmentIds],
      [...this.skillIds, ...other.skillIds],
      [...this.petIds, ...other.petIds],
    );
  }

  isEmpty(): boolean {
    return (
      this.resources.length === 0 &&
      this.equipmentIds.length === 0 &&
      this.skillIds.length === 0 &&
      this.petIds.length === 0
    );
  }
}
