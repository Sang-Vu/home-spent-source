import { DatabaseConstants } from "../constants/database-constants";
import { DailyExpense } from "../models/daily-expense";

export class DraftStorage {
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

        console.log("Draft IndexedDB initialized.");

        resolve();
      };
    });
  }

  public async save(record: DailyExpense): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");

      const request = store.put(record);

      request.onsuccess = () => {
        console.log("Draft saved:", record.expenseDate);

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
          console.log("Draft loaded:", expenseDate);

          resolve(result);
        } else {
          console.log("Draft not found:", expenseDate);

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

        console.log(`Loaded ${records.length} draft(s).`);

        resolve(records);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async delete(expenseDate: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");

      const request = store.delete(expenseDate);

      request.onsuccess = () => {
        console.log("Draft deleted:", expenseDate);

        resolve();
      };

      request.onerror = () => {
        reject(request.error);
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
      DatabaseConstants.DRAFT_STORE_NAME,
      mode,
    );

    return transaction.objectStore(DatabaseConstants.DRAFT_STORE_NAME);
  }
}
