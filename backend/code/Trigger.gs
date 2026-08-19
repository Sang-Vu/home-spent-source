/**
 * ==========================================================
 * Edit Trigger
 * ==========================================================
 *
 * Responsibility:
 *  - Keep LAST_MODIFIED accurate even when a human edits a
 *    row directly in the Sheet UI, bypassing saveExpense().
 *
 * Not Responsible:
 *  - HTTP Request / Response
 *  - Business Logic
 *  - Object Mapping
 *
 * NOTE
 * This is a simple trigger (function name "onEdit" is
 * recognized automatically by Apps Script). It only fires for
 * direct human edits in the Sheet UI — programmatic writes via
 * setValues()/setValue() (e.g. from saveExpense()) never
 * trigger it, so there is no risk of an infinite loop.
 * ==========================================================
 */

/**
 * ----------------------------------------------------------
 * On Edit
 * ----------------------------------------------------------
 *
 * @param {Object} e
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();

  if (!touchesExpenseColumns_(range)) {
    return;
  }

  const timestampColumn = CONFIG.COLUMN.LAST_MODIFIED + 1;
  const nowUtc = buildNowUtc_();

  const firstRow = range.getRow();
  const lastRow = range.getLastRow();

  for (let row = firstRow; row <= lastRow; row++) {
    if (isExpenseDataRow_(sheet, row)) {
      sheet.getRange(row, timestampColumn).setValue(nowUtc);
    }
  }
}

//==========================================================
// Private
//==========================================================

/**
 * ----------------------------------------------------------
 * Check whether the edited range overlaps the expense data
 * columns (FOOD_AMOUNT .. BILL_NOTE). Edits to the DATE column
 * or the LAST_MODIFIED column itself are ignored.
 * ----------------------------------------------------------
 *
 * @param {Range} range
 * @returns {boolean}
 */
function touchesExpenseColumns_(range) {
  const dataFirstColumn = CONFIG.COLUMN.FOOD_AMOUNT + 1;
  const dataLastColumn = CONFIG.COLUMN.BILL_NOTE + 1;

  const firstColumn = range.getColumn();
  const lastColumn = range.getLastColumn();

  return lastColumn >= dataFirstColumn && firstColumn <= dataLastColumn;
}

/**
 * ----------------------------------------------------------
 * Check whether a row is a real expense data row (has a
 * valid date), excluding footer rows like "Tổng Chi:".
 * ----------------------------------------------------------
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @returns {boolean}
 */
function isExpenseDataRow_(sheet, row) {
  const dateCell = sheet.getRange(row, CONFIG.COLUMN.DATE + 1).getValue();
  return isDateValue_(dateCell);
}

/**
 * ----------------------------------------------------------
 * Current UTC timestamp, formatted the same way the frontend
 * writes it via new Date().toISOString().
 * ----------------------------------------------------------
 *
 * @returns {string}
 */
function buildNowUtc_() {
  return Utilities.formatDate(
    new Date(),
    "UTC",
    CONFIG.DATE.UTC_PATTERN
  );
}