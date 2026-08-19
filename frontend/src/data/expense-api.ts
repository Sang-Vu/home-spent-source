import { DailyExpense } from "../models/daily-expense";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
}

export class ExpenseApi {
  constructor(private readonly apiUrl: string) {}

  async loadMonth(year: number, month: number): Promise<DailyExpense[]> {
    return this.request_<DailyExpense[]>("LOAD_MONTH", {
      year,
      month,
    });
  }

  async save(expense: DailyExpense): Promise<void> {
    await this.request_<void>("SAVE_EXPENSE", {
      expense,
    });
  }

  async ping(): Promise<boolean> {
    await this.request_<void>("PING");

    return true;
  }

  private async request_<T>(
    action: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    const body = payload == null ? { action } : { action, ...payload };
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (!result.success) {
      throw new Error(result.message ?? "Unknown server error.");
    }

    return result.data as T;
  }
}
