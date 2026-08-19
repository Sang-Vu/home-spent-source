import { DailyExpense } from "../models/daily-expense";
import { DatabaseConstants } from "../constants/database-constants";
import { SyncStatus } from "../enums/sync-status";

export class ExpenseStorage {
  private db: IDBDatabase | null = null;

  public async initialize(): Promise<void> {
    if (this.db !== null) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        DatabaseConstants.DATABASE_NAME,

        DatabaseConstants.DATABASE_VERSION,
      );

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;

        console.log("IndexedDB initialized.");

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        // dailyExpenses
        if (
          !database.objectStoreNames.contains(
            DatabaseConstants.EXPENSE_STORE_NAME,
          )
        ) {
          const store = database.createObjectStore(
            DatabaseConstants.EXPENSE_STORE_NAME,
            {
              keyPath: "expenseDate",
            },
          );

          store.createIndex(
            DatabaseConstants.INDEX_LAST_MODIFIED,
            "lastModifiedUtc",
            {
              unique: false,
            },
          );

          store.createIndex(
            DatabaseConstants.INDEX_SYNC_STATUS,
            "syncStatus",

            {
              unique: false,
            },
          );

          console.log("Expense Object Store created.");
        }

        // drafts
        if (
          !database.objectStoreNames.contains(
            DatabaseConstants.DRAFT_STORE_NAME,
          )
        ) {
          database.createObjectStore(DatabaseConstants.DRAFT_STORE_NAME, {
            keyPath: "expenseDate",
          });

          console.log("Draft Object Store created.");
        }
      };
    });
  }

  public async save(record: DailyExpense): Promise<void> {
    const recordToSave: DailyExpense = {
      ...record,
      lastModifiedUtc: record.lastModifiedUtc ?? new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");

      const request = store.put(recordToSave);

      request.onsuccess = () => {
        console.log("Expense saved to IndexedDB:", recordToSave.expenseDate);

        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async load(expenseDate: string): Promise<DailyExpense | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");

      const request = store.get(expenseDate);

      request.onsuccess = () => {
        const result = request.result as DailyExpense | undefined;

        if (result) {
          console.log("Expense loaded:", expenseDate);

          resolve(result);
        } else {
          console.log("Expense not found:", expenseDate);

          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async getAll(): Promise<DailyExpense[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");

      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result ?? []) as DailyExpense[];

        console.log(`Loaded ${records.length} expense record(s).`);

        resolve(records);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async getAllByMonth(
    year: number,
    month: number,
  ): Promise<DailyExpense[]> {
    const records = await this.getAll();

    const prefix = `${year}-${month.toString().padStart(2, "0")}-`;

    return records.filter((record) => record.expenseDate.startsWith(prefix));
  }

  public async getUnsynced(): Promise<DailyExpense[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");

      const index = store.index(DatabaseConstants.INDEX_SYNC_STATUS);

      const request = index.getAll(SyncStatus.Pending);

      request.onsuccess = () => {
        const records = (request.result ?? []) as DailyExpense[];

        console.log(`Loaded ${records.length} pending record(s).`);

        resolve(records);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async clear(expenseDate: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");

      const getRequest = store.get(expenseDate);

      getRequest.onerror = () => {
        reject(getRequest.error);
      };

      getRequest.onsuccess = () => {
        const existingRecord = getRequest.result as DailyExpense | undefined;

        if (!existingRecord) {
          console.log("Expense not found:", expenseDate);

          resolve();
          return;
        }

        const clearedRecord: DailyExpense = {
          ...existingRecord,

          foodAmount: "",
          foodNote: "",

          dailyAmount: "",
          dailyNote: "",

          billAmount: "",
          billNote: "",

          syncStatus: SyncStatus.Pending,

          lastModifiedUtc: new Date().toISOString(),
        };

        const putRequest = store.put(clearedRecord);

        putRequest.onsuccess = () => {
          console.log("Expense cleared:", expenseDate);

          resolve();
        };

        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };
    });
  }
  private getDatabase(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database has not been initialized.");
    }

    return this.db;
  }
  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    const db = this.getDatabase();

    const transaction = db.transaction(
      DatabaseConstants.EXPENSE_STORE_NAME,
      mode,
    );

    return transaction.objectStore(DatabaseConstants.EXPENSE_STORE_NAME);
  }
}
