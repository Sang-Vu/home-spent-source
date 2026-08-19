import { SyncStatus } from "../enums/sync-status";

export interface DailyExpense {
  expenseDate: string;
  foodAmount: string;
  foodNote: string;
  dailyAmount: string;
  dailyNote: string;
  billAmount: string;
  billNote: string;
  lastModifiedUtc: string;
  syncStatus: SyncStatus;
  isDeleted: boolean;
}
