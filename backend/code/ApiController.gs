const ApiController = {

    /**
 * ----------------------------------------------------------
 * Load Month
 * ----------------------------------------------------------
 *
 * @param {Object} request
 * @returns {Object}
 */
  loadMonth(request) {

      if (request == null)
      {
          return Response.error(
              "INVALID_REQUEST",
              "Request is required."
          );
      }

      const year = request.year;
      const month = request.month;

      if (year == null || month == null) {
          return Response.error(
              "INVALID_REQUEST",
              "Year and month are required."
          );
      }

      const expenses = GoogleSheetRepository.loadMonth(year, month);

      return Response.success(expenses);

  },

    /**
 * ----------------------------------------------------------
 * Save Expense
 * ----------------------------------------------------------
 *
 * @param {Object} request
 * @returns {Object}
 */
  saveExpense(request) {

      if (request == null) {
          return Response.error(
              "INVALID_REQUEST",
              "Request is required."
          );
      }

      const expense = request.expense;

      if (expense == null) {
          return Response.error(
              "INVALID_REQUEST",
              "Expense is required."
          );
      }

      if (!expense.expenseDate) {
          return Response.error(
              "INVALID_REQUEST",
              "Expense date is required."
          );
      }

      GoogleSheetRepository.saveExpense(expense);

      return Response.success({
          message: "Saved successfully."
      });

  },

    /**
 * ----------------------------------------------------------
 * Ping
 * ----------------------------------------------------------
 *
 * @returns {Object}
 */
  ping() {

      GoogleSheetRepository.ping();

      return Response.success({
          message: "OK"
      });

  },

}