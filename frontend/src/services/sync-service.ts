import { ExpenseStorage } from "../storage/expense-storage";
import { SyncEngine } from "../sync/sync-engine";

export type SyncMessageListener = (message: string) => void;
export type SyncProcessingListener = (isProcessing: boolean) => void;

/**
 * Keeps the in-memory work queue small. The durable queue is IndexedDB: every
 * record whose syncStatus is Pending is discovered again after a reload.
 */
export class SyncService {
  private readonly queuedDates = new Set<string>();
  private readonly listeners = new Set<SyncMessageListener>();
  private readonly processingListeners = new Set<SyncProcessingListener>();
  private isProcessing = false;

  constructor(
    private readonly storage: ExpenseStorage,
    private readonly syncEngine: SyncEngine,
  ) {}

  public async initialize(): Promise<void> {
    const pendingExpenses = await this.storage.getUnsynced();

    for (const expense of pendingExpenses) {
      this.queuedDates.add(expense.expenseDate);
    }

    window.addEventListener("online", () => this.processInBackground());
    this.publish(
      this.queuedDates.size > 0
        ? `Đang chờ đồng bộ ${this.queuedDates.size} ngày.`
        : "",
    );
    this.processInBackground();
  }

  public subscribe(listener: SyncMessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeProcessing(listener: SyncProcessingListener): () => void {
    this.processingListeners.add(listener);
    return () => this.processingListeners.delete(listener);
  }

  public enqueue(expenseDate: string): void {
    this.queuedDates.add(expenseDate);
    this.publish(`Đang chờ đồng bộ ${this.queuedDates.size} ngày.`);
    this.processInBackground();
  }

  public async syncMonth(year: number, month: number): Promise<void> {
    if (this.isProcessing) {
      throw new Error(
        "A sync is already in progress. Please try again shortly.",
      );
    }

    this.isProcessing = true;
    this.publishProcessing(true);
    this.publish(`Đang tải dữ liệu tháng ${month}/${year}...`);

    try {
      await this.syncEngine.syncNow(year, month);
      this.publish("");
    } catch (error) {
      console.warn("Manual month sync failed.", error);
      this.publish("Không thể tải dữ liệu. Vui lòng thử lại.");
      throw error;
    } finally {
      this.isProcessing = false;
      this.publishProcessing(false);
      this.processInBackground();
    }
  }

  private processInBackground(): void {
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queuedDates.size === 0) return;

    this.isProcessing = true;
    this.publishProcessing(true);

    try {
      while (this.queuedDates.size > 0) {
        const monthKey = this.peekNextMonth();

        if (!monthKey) return;

        const datesInMonth = this.takeDatesForMonth(
          monthKey.year,
          monthKey.month,
        );
        this.publish(
          `Đang đồng bộ dữ liệu tháng ${monthKey.month}/${monthKey.year}...`,
        );

        try {
          await this.syncEngine.syncNow(monthKey.year, monthKey.month);
        } catch (error) {
          for (const expenseDate of datesInMonth) {
            this.queuedDates.add(expenseDate);
          }
          console.warn("Sync failed; the record remains pending.", error);
          this.publish(
            "Chưa thể đồng bộ. Dữ liệu sẽ được thử lại khi có mạng.",
          );
          return;
        }
      }

      this.publish("");
    } finally {
      this.isProcessing = false;
      this.publishProcessing(false);
    }
  }

  private peekNextMonth(): { year: number; month: number } | null {
    const firstDate = this.queuedDates.values().next().value;

    if (!firstDate) return null;

    const [yearText, monthText] = firstDate.split("-");

    return { year: Number(yearText), month: Number(monthText) };
  }

  private takeDatesForMonth(year: number, month: number): string[] {
    const prefix = `${year}-${month.toString().padStart(2, "0")}-`;

    const matchedDates = Array.from(this.queuedDates).filter((date) =>
      date.startsWith(prefix),
    );

    for (const date of matchedDates) {
      this.queuedDates.delete(date);
    }

    return matchedDates;
  }

  private publish(message: string): void {
    for (const listener of this.listeners) listener(message);
  }

  private publishProcessing(isProcessing: boolean): void {
    for (const listener of this.processingListeners) listener(isProcessing);
  }
}
