import { ExpenseElements } from "./expense-elements";
import { ExpenseService } from "../services/expense-service";
import { ExpenseFormData } from "../contracts/expense-form-data";
import { ExpenseCategory } from "../enums/expense-category";
import { ExpenseFormMapper } from "./mappers/expense-form-mapper";
import { StatusBar } from "../ui/status-bar";
import { SyncService } from "../services/sync-service";

export class ExpensePage {
  private currentDate = "";
  private currentCategory: ExpenseCategory = ExpenseCategory.Food;
  private hasUnsavedInput = false;
  private hasDraftForCurrentDay = false;
  private isDraftListVisible = false;
  private isQueueSyncing = false;
  private isManualLoading = false;
  private readonly statusBar: StatusBar;

  constructor(
    private readonly elements: ExpenseElements,
    private readonly expenseService: ExpenseService,
  ) {
    this.statusBar = new StatusBar(this.elements.statusBar);
  }

  public async initialize(): Promise<void> {
    this.elements.expenseDate.value = this.getToday();

    this.currentDate = this.elements.expenseDate.value;
    this.currentCategory = this.getSelectedCategory();

    this.registerEvents();
    await this.loadCurrentExpense();
    await this.updateDraftSummary();
  }

  public dispose(): void {}

  public bindSyncStatus(syncService: SyncService): void {
    syncService.subscribe((message) => {
      this.elements.syncStatus.textContent = message;
    });

    syncService.subscribeProcessing((isProcessing) => {
      this.isQueueSyncing = isProcessing;
      this.updateLoadBtnState();
    });
  }

  private registerEvents(): void {
    this.elements.expenseDate.addEventListener("change", () => {
      void this.onDateChanged();
    });

    this.elements.saveButton.addEventListener("click", () => {
      void this.onSaveClicked();
    });

    this.elements.amount.addEventListener("input", () => {
      this.hasUnsavedInput = true;
      this.updateSaveBtnState();
    });

    this.elements.note.addEventListener("input", () => {
      this.hasUnsavedInput = true;
      this.updateSaveBtnState();
    });

    this.elements.categories.forEach((radio) => {
      radio.addEventListener("change", () => {
        void this.onCategoryChanged();
      });
    });

    this.elements.draftSummary.addEventListener("click", () => {
      void this.onDraftSummaryClicked();
    });

    this.elements.loadButton.addEventListener("click", () => {
      void this.onLoadClicked();
    });
  }

  private getToday(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private async loadCurrentExpense(): Promise<void> {
    const expenseDate = this.elements.expenseDate.value;
    const category = this.getSelectedCategory();

    const expense = await this.expenseService.loadOrCreateExpense(expenseDate);
    const hasDraft = await this.expenseService.hasDraft(expenseDate);
    const form = ExpenseFormMapper.toFormData(expense, category);

    this.populateForm(form);

    this.currentDate = expenseDate;
    this.currentCategory = category;
    this.hasUnsavedInput = false;
    this.hasDraftForCurrentDay = hasDraft;
    this.updateSaveBtnState();
  }

  private collectForm(): ExpenseFormData {
    return {
      expenseDate: this.currentDate,
      category: this.getSelectedCategory(),
      amountExpression: this.elements.amount.value.trim(),
      note: this.elements.note.value.trim(),
    };
  }

  private collectFormForDraft(): ExpenseFormData {
    return {
      expenseDate: this.currentDate,
      category: this.currentCategory,
      amountExpression: this.elements.amount.value.trim(),
      note: this.elements.note.value.trim(),
    };
  }

  private getSelectedCategory(): ExpenseCategory {
    const selected = Array.from(this.elements.categories).find(
      (radio) => radio.checked,
    );

    if (!selected) {
      throw new Error("No expense category selected.");
    }

    return selected.value as ExpenseCategory;
  }

  private populateForm(form: ExpenseFormData): void {
    this.elements.amount.value = form.amountExpression;
    this.elements.note.value = form.note;
  }

  private updateSaveBtnState(): void {
    const shouldEnable = this.hasUnsavedInput || this.hasDraftForCurrentDay;
    this.elements.saveButton.disabled = !shouldEnable;
  }

  private updateLoadBtnState(): void {
    this.elements.loadButton.disabled =
      this.isQueueSyncing || this.isManualLoading;
  }

  private async updateDraftSummary(): Promise<void> {
    const count = await this.expenseService.getDraftCount();

    if (count === 0) {
      this.elements.draftSummary.textContent = "";
      this.elements.draftSummary.classList.remove("visible");
      return;
    }

    this.elements.draftSummary.textContent =
      count === 1 ? "1 ngày chưa được lưu." : `${count} ngày chưa được lưu.`;

    this.elements.draftSummary.classList.add("visible");
  }

  private async onDraftSummaryClicked(): Promise<void> {
    this.isDraftListVisible = !this.isDraftListVisible;

    if (this.isDraftListVisible) {
      await this.renderDraftList();
    }

    this.elements.draftList.classList.toggle(
      "visible",
      this.isDraftListVisible,
    );
  }

  private async renderDraftList(): Promise<void> {
    const dates = await this.expenseService.getDraftDates();

    this.elements.draftList.innerHTML = "";

    for (const date of dates) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "draft-list-item";
      item.textContent = date;

      item.addEventListener("click", () => {
        void this.onDraftItemClicked(date);
      });

      this.elements.draftList.appendChild(item);
    }
  }

  private async onDraftItemClicked(expenseDate: string): Promise<void> {
    await this.saveCurrentDraft();

    this.elements.expenseDate.value = expenseDate;

    await this.loadCurrentExpense();

    this.isDraftListVisible = false;
    this.elements.draftList.classList.remove("visible");
  }

  private clearForm(): void {
    this.elements.amount.value = "";
    this.elements.note.value = "";
  }

  private async onDateChanged(): Promise<void> {
    await this.saveCurrentDraft();
    await this.loadCurrentExpense();
  }

  private async onCategoryChanged(): Promise<void> {
    await this.saveCurrentDraft();
    await this.loadCurrentExpense();
  }

  private async saveCurrentDraft(): Promise<void> {
    if (!this.hasUnsavedInput) return;

    const form = this.collectFormForDraft();

    const expense = await this.expenseService.loadOrCreateExpense(
      form.expenseDate,
    );

    const draft = ExpenseFormMapper.toDailyExpense(form, expense);

    await this.expenseService.saveDraft(draft);
    this.hasUnsavedInput = false;
    this.updateSaveBtnState();
    await this.updateDraftSummary();
  }

  private async onSaveClicked(): Promise<void> {
    const form = this.collectForm();

    const existing = await this.expenseService.loadOrCreateExpense(
      form.expenseDate,
    );

    const expense = ExpenseFormMapper.toDailyExpense(form, existing);

    await this.expenseService.saveExpense(expense);

    this.statusBar.show("Saved successfully.");
    this.hasUnsavedInput = false;
    this.hasDraftForCurrentDay = false;
    this.updateSaveBtnState();
    await this.updateDraftSummary();
  }

  private async onLoadClicked(): Promise<void> {
    await this.saveCurrentDraft();

    const [yearText, monthText] = this.currentDate.split("-");
    const year = Number(yearText);
    const month = Number(monthText);

    this.isManualLoading = true;
    this.updateLoadBtnState();

    try {
      await this.expenseService.syncExpenses(year, month);
      await this.loadCurrentExpense();
    } catch (error) {
      console.error("Manual load failed:", error);
    } finally {
      this.isManualLoading = false;
      this.updateLoadBtnState();
    }
  }
}
