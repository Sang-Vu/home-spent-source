import { ExpenseCategory } from "../enums/expense-category";

export interface ExpenseFormData {
  expenseDate: string;

  category: ExpenseCategory;

  amountExpression: string;

  note: string;
}
