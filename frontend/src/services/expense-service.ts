import { ExpenseStorage } from "../storage/expense-storage";
import { DailyExpense } from "../models/daily-expense";
import { ExpenseApi } from "../data/expense-api";
import { DraftStorage } from "../storage/draft-storage";
import { ExpenseFactory } from "../factories/expense-factory";
import { SyncStatus } from "../enums/sync-status";
import { SyncService } from "./sync-service";

export class ExpenseService {
  constructor(
    private readonly expenseStorage: ExpenseStorage,
    private readonly draftStorage: DraftStorage,
    private readonly api: ExpenseApi,
    private readonly syncService: SyncService,
  ) {}

  public async saveExpense(expense: DailyExpense): Promise<void> {
    const pendingExpense: DailyExpense = {
      ...expense,
      syncStatus: SyncStatus.Pending,
    };

    await this.expenseStorage.save(pendingExpense);

    try {
      await this.draftStorage.delete(pendingExpense.expenseDate);
    } catch (error) {
      console.warn("Failed to delete draft:", error);
    }

    this.syncService.enqueue(pendingExpense.expenseDate);
  }

  public async loadExpense(expenseDate: string): Promise<DailyExpense | null> {
    const draft = await this.draftStorage.load(expenseDate);

    if (draft) return draft;

    const localExpense = await this.expenseStorage.load(expenseDate);

    if (localExpense) return localExpense;

    return this.loadExpenseMonthFromRemote(expenseDate);
  }

  public async deleteExpense(expenseDate: string): Promise<void> {
    await this.expenseStorage.clear(expenseDate);
    this.syncService.enqueue(expenseDate);
  }

  public async syncExpenses(year: number, month: number): Promise<void> {
    await this.syncService.syncMonth(year, month);
  }

  public async saveDraft(expense: DailyExpense): Promise<void> {
    await this.draftStorage.save(expense);
  }

  public async deleteDraft(expenseDate: string): Promise<void> {
    await this.draftStorage.delete(expenseDate);
  }

  public async hasDraft(expenseDate: string): Promise<boolean> {
    const draft = await this.draftStorage.load(expenseDate);

    return draft !== null;
  }

  public async getDraftCount(): Promise<number> {
    const drafts = await this.draftStorage.getAll();

    return drafts.length;
  }

  public async getDraftDates(): Promise<string[]> {
    const drafts = await this.draftStorage.getAll();

    return drafts
      .map((draft) => draft.expenseDate)
      .sort((a, b) => a.localeCompare(b));
  }

  private async loadExpenseMonthFromRemote(
    expenseDate: string,
  ): Promise<DailyExpense | null> {
    const [yearText, monthText] = expenseDate.split("-");
    const year = Number(yearText);
    const month = Number(monthText);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new Error("Invalid expense date.");
    }

    const remoteExpenses = await this.api.loadMonth(year, month);

    for (const remoteExpense of remoteExpenses) {
      await this.expenseStorage.save({
        ...remoteExpense,
        syncStatus: SyncStatus.Synced,
      });
    }

    return this.expenseStorage.load(expenseDate);
  }

  public async loadOrCreateExpense(expenseDate: string): Promise<DailyExpense> {
    const expense = await this.loadExpense(expenseDate);

    return expense ?? ExpenseFactory.create(expenseDate);
  }
}
