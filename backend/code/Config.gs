/**
 * ==========================================================
 * Expense Tracker Backend Configuration
 * ==========================================================
 */

const CONFIG = {

  /**
   * Spreadsheet
   */
  SPREADSHEET: {

    /**
     * Spreadsheet ID
     *
     * Example:
     * https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxx/edit
     */
    ID: PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")

  },

  /**
   * API Actions
   */
  ACTION: {
    PING: "ping",
    LOAD_MONTH: "loadMonth",
    SAVE_EXPENSE: "saveExpense"
  },

  /**
   * Sheet Settings
   */
  SHEET: {

    PREFIX: "T"

  },

  /**
   * Date Format
   */
  DATE: {
    TIMEZONE: "Asia/Ho_Chi_Minh",
    ISO_PATTERN: "yyyy-MM-dd",
    UTC_PATTERN: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"

  },

  /**
   * Column Index (1-based)
   */
  COLUMN: {
    DATE: 0,
    FOOD_AMOUNT: 1,
    FOOD_NOTE: 2,
    DAILY_AMOUNT: 3,
    DAILY_NOTE: 4,
    BILL_AMOUNT: 5,
    BILL_NOTE: 6,
    LAST_MODIFIED: 7
  }

};