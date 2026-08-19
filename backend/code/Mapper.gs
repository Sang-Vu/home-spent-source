/**
 * ==========================================================
 * DailyExpense Mapper
 * ==========================================================
 *
 * Responsibility:
 *  - Convert Google Sheet Row <-> DailyExpense
 *
 * Not Responsible:
 *  - Open Spreadsheet
 *  - Read Sheet
 *  - Save Sheet
 *  - HTTP Request
 * ==========================================================
 */

const Mapper = {

  /**
   * ----------------------------------------------------------
   * Google Sheet Row -> DailyExpense
   * ----------------------------------------------------------
   *
   * @param {Array} row
   * @returns {Object}
   */
  fromRow(row) {

    return {

      expenseDate:
        this.parseExpenseDate(
          row[CONFIG.COLUMN.DATE]
        ),

      foodAmount:
        row[CONFIG.COLUMN.FOOD_AMOUNT],

      foodNote:
        row[CONFIG.COLUMN.FOOD_NOTE],

      dailyAmount:
        row[CONFIG.COLUMN.DAILY_AMOUNT],

      dailyNote:
        row[CONFIG.COLUMN.DAILY_NOTE],

      billAmount:
        row[CONFIG.COLUMN.BILL_AMOUNT],

      billNote:
        row[CONFIG.COLUMN.BILL_NOTE],

      lastModifiedUtc:
        row[CONFIG.COLUMN.LAST_MODIFIED]

    };

  },

  /**
   * ----------------------------------------------------------
   * DailyExpense -> Google Sheet Values
   * ----------------------------------------------------------
   *
   * NOTE
   * Repository only updates columns B:H.
   * Date column (A) is managed by the spreadsheet template.
   *
   * @param {Object} expense
   * @returns {Array}
   */
  toRow(expense) {

    return [
      this.formatAmountForSheet_(expense.foodAmount),
      expense.foodNote,
      this.formatAmountForSheet_(expense.dailyAmount),
      expense.dailyNote,
      this.formatAmountForSheet_(expense.billAmount),
      expense.billNote,
      expense.lastModifiedUtc
    ];

  },

  /**
   * ----------------------------------------------------------
   * Format amount value for writing to Sheet
   * ----------------------------------------------------------
   *
   * - Plain number ("50000")           -> ghi nguyên, không đổi
   * - Biểu thức số học ("45+15")       -> thêm "=" để Sheets tính
   * - Giá trị khác (text bất thường)   -> ghi nguyên văn (an toàn,
   *   không ép thành công thức để tránh formula injection)
   *
   * @param {*} amount
   * @returns {*}
   */
  formatAmountForSheet_(amount) {
    if (amount === null || amount === undefined || amount === "") {
      return amount;
    }

    const value = String(amount).trim();

    // Số thuần túy -> giữ nguyên, không cần công thức
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }

    // Chỉ chứa số, khoảng trắng và các toán tử +,-,*,/,.
    // -> an toàn để thêm "=" cho Sheets tính như công thức
    if (/^[0-9+\-*/.\s]+$/.test(value)) {
      return "=" + value;
    }

    // Trường hợp khác -> ghi nguyên văn, không ép công thức
    return value;
  },

  /**
   * ----------------------------------------------------------
   * Google Date -> yyyy-MM-dd
   * ----------------------------------------------------------
   *
   * @param {Date} date
   * @returns {string}
   */
  parseExpenseDate(date) {
    if (!isDateValue_(date)) {
        throw new Error("Invalid sheet date.");
    }

    return Utilities.formatDate(
      date,
      CONFIG.DATE.TIMEZONE,
      CONFIG.DATE.ISO_PATTERN
    );

  },

  /**
   * ----------------------------------------------------------
   * yyyy-MM-dd -> Google Date
   * ----------------------------------------------------------
   *
   * Reserved for future use.
   *
   * @param {string} expenseDate
   * @returns {Date}
   */
  formatSheetDate(expenseDate) {

    const [year, month, day] =
      expenseDate
        .split("-")
        .map(Number);

    return new Date(
      year,
      month - 1,
      day
    );

  }

};