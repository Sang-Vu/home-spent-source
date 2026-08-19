export class StatusBar {
  private timeoutId: number | null = null;

  constructor(
    private readonly element: HTMLElement,
    private readonly displayDurationMs: number = 2000,
  ) {}

  public show(message: string): void {
    this.cancelPendingClear();

    this.element.textContent = message;

    this.timeoutId = window.setTimeout(() => {
      this.clear();
    }, this.displayDurationMs);
  }

  public clear(): void {
    this.cancelPendingClear();

    this.element.textContent = "";
  }

  private cancelPendingClear(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);

      this.timeoutId = null;
    }
  }
}
