import { SyncAction } from "../enums/sync-action";
import { DailyExpense } from "./daily-expense";

export interface SyncDecision {
  action: SyncAction;
  sourceRecord?: DailyExpense;
}
