/**
 * ----------------------------------------------------------
 * Kiểm tra 1 giá trị có phải là Date hợp lệ hay không
 * ----------------------------------------------------------
 *
 * Không dùng `instanceof Date` vì Apps Script đôi khi trả về
 * Date object được tạo ở 1 JS realm khác (đặc biệt với cell
 * tính bằng công thức), khiến instanceof cho kết quả sai (false)
 * dù giá trị thực chất là ngày tháng hợp lệ.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isDateValue_(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.getTime === "function" &&
    !isNaN(value.getTime())
  );
}