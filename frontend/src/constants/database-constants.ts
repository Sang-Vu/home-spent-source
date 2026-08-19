export const DatabaseConstants = {
  DATABASE_NAME: "ExpenseTrackerDB",

  DATABASE_VERSION: 2,

  EXPENSE_STORE_NAME: "dailyExpenses",

  INDEX_LAST_MODIFIED: "lastModifiedUtc",

  INDEX_SYNC_STATUS: "syncStatus",

  DRAFT_STORE_NAME: "drafts",
} as const;
