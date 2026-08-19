import { DailyExpense } from "./daily-expense";

export interface ComparisonContext {
  localMap: Map<string, DailyExpense>;
  remoteMap: Map<string, DailyExpense>;
  allDates: string[];
}
