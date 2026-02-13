export class Result<T = void> {
  private constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly data?: T,
  ) {}

  static ok<T>(data?: T, message: string = ''): Result<T> {
    return new Result<T>(true, message, data);
  }

  static fail<T = void>(message: string): Result<T> {
    return new Result<T>(false, message);
  }

  isOk(): boolean {
    return this.success;
  }

  isFail(): boolean {
    return !this.success;
  }
}
