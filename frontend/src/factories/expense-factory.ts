import { SyncStatus } from "../enums/sync-status";
import { DailyExpense } from "../models/daily-expense";

export class ExpenseFactory {
  public static create(expenseDate: string): DailyExpense {
    return {
      expenseDate,

      foodAmount: "",
      foodNote: "",

      dailyAmount: "",
      dailyNote: "",

      billAmount: "",
      billNote: "",

      lastModifiedUtc: "",

      syncStatus: SyncStatus.Pending,

      isDeleted: false,
    };
  }
}
