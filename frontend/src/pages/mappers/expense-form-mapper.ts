import { ExpenseCategory } from "../../enums/expense-category";
import { DailyExpense } from "../../models/daily-expense";
import { ExpenseFormData } from "../../contracts/expense-form-data";

export class ExpenseFormMapper {
  public static toFormData(
    expense: DailyExpense,
    category: ExpenseCategory,
  ): ExpenseFormData {
    switch (category) {
      case ExpenseCategory.Food:
        return {
          expenseDate: expense.expenseDate,
          category,
          amountExpression: expense.foodAmount,
          note: expense.foodNote,
        };

      case ExpenseCategory.Daily:
        return {
          expenseDate: expense.expenseDate,
          category,
          amountExpression: expense.dailyAmount,
          note: expense.dailyNote,
        };

      case ExpenseCategory.Bills:
        return {
          expenseDate: expense.expenseDate,
          category,
          amountExpression: expense.billAmount,
          note: expense.billNote,
        };

      default:
        throw new Error("Unsupported expense category.");
    }
  }

  public static toDailyExpense(
    form: ExpenseFormData,
    existing: DailyExpense,
  ): DailyExpense {
    const expense: DailyExpense = {
      ...existing,
      lastModifiedUtc: new Date().toISOString(),
    };

    switch (form.category) {
      case ExpenseCategory.Food:
        expense.foodAmount = form.amountExpression;
        expense.foodNote = form.note;
        break;

      case ExpenseCategory.Daily:
        expense.dailyAmount = form.amountExpression;
        expense.dailyNote = form.note;
        break;

      case ExpenseCategory.Bills:
        expense.billAmount = form.amountExpression;
        expense.billNote = form.note;
        break;

      default:
        throw new Error("Unsupported expense category.");
    }

    return expense;
  }
}
