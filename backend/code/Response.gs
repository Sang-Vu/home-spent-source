/**
 * ==========================================================
 * Response Helper
 * ==========================================================
 */
const Response = {

  /**
   * Success Response
   *
   * @param {*} data
   * @returns {TextOutput}
   */
  success(data) {

    const response = {

      success: true

    };

    if (data !== undefined) {

      response.data = data;

    }

    return response;

  },

  /**
   * Error Response
   *
   * @param {string} code
   * @param {string} message
   * @returns {TextOutput}
   */
  error(code, message) {

    const response = {

      success: false,

      code: code

    };

    if (message !== undefined) {

      response.message = message;

    }

    return response;

  },

  /**
   * JSON Response
   *
   * @param {Object} object
   * @returns {TextOutput}
   */
  json(object) {

    return ContentService
      .createTextOutput(
        JSON.stringify(object)
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

};