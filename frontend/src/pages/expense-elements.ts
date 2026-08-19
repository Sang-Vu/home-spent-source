export interface ExpenseElements {
  expenseDate: HTMLInputElement;
  amount: HTMLInputElement;
  note: HTMLTextAreaElement;
  saveButton: HTMLButtonElement;
  loadButton: HTMLButtonElement;
  statusBar: HTMLDivElement;
  syncStatus: HTMLDivElement;
  draftSummary: HTMLDivElement;
  draftList: HTMLDivElement;
  categories: NodeListOf<HTMLInputElement>;
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required element '${id}' was not found.`);
  }

  return element as T;
}

export function createExpenseElements(): ExpenseElements {
  return {
    expenseDate: getRequiredElement<HTMLInputElement>("expenseDate"),
    amount: getRequiredElement<HTMLInputElement>("amount"),
    note: getRequiredElement<HTMLTextAreaElement>("note"),
    saveButton: getRequiredElement<HTMLButtonElement>("saveBtn"),
    loadButton: getRequiredElement<HTMLButtonElement>("loadBtn"),
    statusBar: getRequiredElement<HTMLDivElement>("statusBar"),
    syncStatus: getRequiredElement<HTMLDivElement>("syncStatus"),
    draftSummary: getRequiredElement<HTMLDivElement>("draftSummary"),
    draftList: getRequiredElement<HTMLDivElement>("draftList"),
    categories: document.querySelectorAll<HTMLInputElement>(
      'input[name="category"]',
    ),
  };
}
