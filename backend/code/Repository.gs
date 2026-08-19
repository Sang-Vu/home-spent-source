/**
 * ==========================================================
 * Google Sheet Repository
 * ==========================================================
 *
 * Responsibility:
 *  - Read data from Google Sheets
 *  - Write data to Google Sheets
 *  - Locate worksheet by year/month
 *
 * Not Responsible:
 *  - HTTP Request / Response
 *  - JSON
 *  - Business Logic
 *  - Object Mapping (handled by Mapper)
 * ==========================================================
 */

const GoogleSheetRepository = {

  /**
   * ----------------------------------------------------------
   * Load all expenses of a month
   * ----------------------------------------------------------
   *
   * @param {number} year
   * @param {number} month
   * @returns {Object[]}
   */
  loadMonth(year, month) {
    const spreadsheet = this.openSpreadsheet_();
    const sheet =
      this.openSheet_(
        spreadsheet,
        year,
        month
      );
    const firstDataRow = this.findFirstDataRow_(sheet);

    return this.readRows_(sheet, firstDataRow);
  },

  /**
   * ----------------------------------------------------------
   * Save one DailyExpense
   * ----------------------------------------------------------
   *
   * @param {Object} expense
   */
  saveExpense(expense) {
    const spreadsheet = this.openSpreadsheet_();
    const expenseDate = expense.expenseDate;
    const year = Number(expenseDate.substring(0, 4));
    const month = Number(expenseDate.substring(5, 7));

    const sheet =
      this.openSheet_(
        spreadsheet,
        year,
        month
      );

    const firstDataRow = this.findFirstDataRow_(sheet);

    const rowNumber =
      this.getRowNumber_(
        firstDataRow,
        expenseDate
      );

    this.writeExpense_(sheet, rowNumber, expense);
  },

  /**
   * ----------------------------------------------------------
   * Health Check
   * ----------------------------------------------------------
   *
   * @returns {boolean}
   */
  ping() {
    this.openSpreadsheet_();
    return true;
  },

  //==========================================================
  // Private
  //==========================================================

  /**
   * ----------------------------------------------------------
   * Open Spreadsheet
   * ----------------------------------------------------------
   *
   * @returns {Spreadsheet}
   */
  openSpreadsheet_() {
    const spreadsheetId = CONFIG.SPREADSHEET.ID;

    if (!spreadsheetId) {
      throw new Error(
        "Spreadsheet ID is not configured."
      );
    }

    return SpreadsheetApp.openById(spreadsheetId);
  },

  /**
   * ----------------------------------------------------------
   * Build Sheet Name
   * ----------------------------------------------------------
   *
   * Example:
   * year = 2026
   * month = 7
   *
   * Result:
   * T07-26
   *
   * @param {number} year
   * @param {number} month
   * @returns {string}
   */
  buildSheetName_(year, month) {
    const mm = String(month).padStart(2, "0");
    const yy = String(year).substring(2);

    return `T${mm}-${yy}`;
  },

  /**
   * ----------------------------------------------------------
   * Open Monthly Sheet
   * ----------------------------------------------------------
   *
   * @param {Spreadsheet} spreadsheet
   * @param {number} year
   * @param {number} month
   * @returns {Sheet}
   */
  openSheet_(spreadsheet, year, month) {
    const sheetName = this.buildSheetName_(year, month);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }

    return sheet;
  },

  /**
   * ----------------------------------------------------------
   * Find first data row
   * ----------------------------------------------------------
   *
   * @param {Sheet} sheet
   * @returns {number}
   */
  findFirstDataRow_(sheet) {
    const lastRow = sheet.getLastRow();
    const values = sheet
      .getRange(1, CONFIG.COLUMN.DATE + 1, lastRow, 1)
      .getValues();

    for (let i = 0; i < values.length; i++) {
      if (isDateValue_(values[i][0])) {
        return i + 1;
      }
    }

    throw new Error("No expense date found in sheet.");
  },

  /**
   * ----------------------------------------------------------
   * Find last data row (contiguous date rows only)
   * ----------------------------------------------------------
   *
   * Stops at the first row after firstDataRow that is NOT a
   * date, so footer rows like "Tổng Chi:", "Trước 6/7"... are
   * excluded from the result.
   *
   * @param {Sheet} sheet
   * @param {number} firstDataRow
   * @returns {number}
   */
  findLastDataRow_(sheet, firstDataRow) {
    const lastRow = sheet.getLastRow();
    const values = sheet
      .getRange(firstDataRow, CONFIG.COLUMN.DATE + 1, lastRow - firstDataRow + 1, 1)
      .getValues();

    let lastDataRow = firstDataRow - 1;

    for (let i = 0; i < values.length; i++) {
      if (isDateValue_(values[i][0])) {
        lastDataRow = firstDataRow + i;
      } else {
        break;
      }
    }

    return lastDataRow;
  },

  /**
   * ----------------------------------------------------------
   * Get row number by expense date
   * ----------------------------------------------------------
   *
   * @param {number} firstDataRow
   * @param {string} expenseDate
   * @returns {number}
   */
  getRowNumber_(firstDataRow, expenseDate) {
    const day = Number(expenseDate.substring(8, 10));
    return firstDataRow + day - 1;
  },

  /**
   * ----------------------------------------------------------
   * Read all expense rows
   * ----------------------------------------------------------
   *
   * @param {Sheet} sheet
   * @param {number} firstDataRow
   * @returns {Object[]}
   */
  readRows_(sheet, firstDataRow) {
    const lastDataRow = this.findLastDataRow_(sheet, firstDataRow);
    const rowCount = lastDataRow - firstDataRow + 1;

    const range = sheet.getRange(
      firstDataRow,
      1,
      rowCount,
      CONFIG.COLUMN.LAST_MODIFIED + 1
    );

    const values = range.getValues();
    const formulas = range.getFormulas();

    const amountColumns = [
      CONFIG.COLUMN.FOOD_AMOUNT,
      CONFIG.COLUMN.DAILY_AMOUNT,
      CONFIG.COLUMN.BILL_AMOUNT
    ];

    const rows = values.map((row, rowIndex) => {
      const merged = row.slice();

      amountColumns.forEach((colIndex) => {
        const formula = formulas[rowIndex][colIndex];

        if (formula && formula.indexOf("=") === 0) {
          // Có công thức -> trả về nguyên biểu thức gốc (bỏ dấu "=")
          merged[colIndex] = formula.substring(1);
        }
        // Không có công thức -> giữ nguyên giá trị thô (số/text bình thường)
      });

      return merged;
    });

    return rows.map(row => Mapper.fromRow(row));
  },

  /**
   * ----------------------------------------------------------
   * Write expense
   * ----------------------------------------------------------
   *
   * @param {Sheet} sheet
   * @param {number} rowNumber
   * @param {Object} expense
   */
  writeExpense_(sheet, rowNumber, expense) {
    const values = Mapper.toRow(expense);

    sheet
      .getRange(
        rowNumber,
        CONFIG.COLUMN.FOOD_AMOUNT + 1,
        1,
        values.length
      )
      .setValues([values]);
  }
};