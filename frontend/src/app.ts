import { ExpenseStorage } from "./storage/expense-storage";
import { ExpenseService } from "./services/expense-service";
import { DraftStorage } from "./storage/draft-storage";
import { ExpenseApi } from "./data/expense-api";
import { SyncEngine } from "./sync/sync-engine";
import { SyncService } from "./services/sync-service";
import { ExpensePage } from "./pages/expense-page";
import { createExpenseElements } from "./pages/expense-elements";
import { Config } from "./config";

export class App {
  public static async start(): Promise<void> {
    try {
      const expenseStorage = new ExpenseStorage();
      await expenseStorage.initialize();

      const draftStorage = new DraftStorage();
      await draftStorage.initialize();

      const api = new ExpenseApi(Config.apiUrl);

      const syncEngine = new SyncEngine(expenseStorage, api);

      const syncService = new SyncService(expenseStorage, syncEngine);

      const expenseService = new ExpenseService(
        expenseStorage,
        draftStorage,
        api,
        syncService,
      );

      const elements = createExpenseElements();
      const expensePage = new ExpensePage(elements, expenseService);

      expensePage.bindSyncStatus(syncService);

      await syncService.initialize();
      await expensePage.initialize();
    } catch (error) {
      console.error("Application Startup Failed.", error);
    }
  }
}
