export class Stats {
  constructor(
    public readonly hp: number = 0,
    public readonly maxHp: number = 0,
    public readonly atk: number = 0,
    public readonly def: number = 0,
    public readonly crit: number = 0,
  ) {}

  static ZERO = new Stats(0, 0, 0, 0, 0);

  static create(partial: Partial<{ hp: number; maxHp: number; atk: number; def: number; crit: number }>): Stats {
    return new Stats(
      partial.hp ?? 0,
      partial.maxHp ?? 0,
      partial.atk ?? 0,
      partial.def ?? 0,
      partial.crit ?? 0,
    );
  }

  add(other: Stats): Stats {
    return new Stats(
      this.hp + other.hp,
      this.maxHp + other.maxHp,
      this.atk + other.atk,
      this.def + other.def,
      this.crit + other.crit,
    );
  }

  multiply(factor: number): Stats {
    return new Stats(
      Math.floor(this.hp * factor),
      Math.floor(this.maxHp * factor),
      Math.floor(this.atk * factor),
      Math.floor(this.def * factor),
      this.crit * factor,
    );
  }

  withHp(hp: number): Stats {
    return new Stats(hp, this.maxHp, this.atk, this.def, this.crit);
  }

  withMaxHp(maxHp: number): Stats {
    return new Stats(this.hp, maxHp, this.atk, this.def, this.crit);
  }

  clone(): Stats {
    return new Stats(this.hp, this.maxHp, this.atk, this.def, this.crit);
  }
}
