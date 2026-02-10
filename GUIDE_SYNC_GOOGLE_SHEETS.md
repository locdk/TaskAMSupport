# Hướng dẫn Đồng bộ Dữ liệu Firebase sang Google Sheets (Phương án Google Apps Script)

Vì Extension chính thức không khả dụng hoặc khó tìm, chúng ta sẽ sử dụng **Google Apps Script** để làm Webhook nhận dữ liệu từ Website.

## Bước 1: Chuẩn bị Google Sheet

1.  Tạo một file Google Sheet mới tại [sheets.new](https://sheets.new).
2.  Đặt tên file (ví dụ: `Data Sync System`).
3.  Đổi tên **Sheet1** thành `Logs`.
4.  Tạo thêm các Sheet (Tab) mới nếu bạn muốn phân loại rõ ràng (ví dụ: `StoreLogs`, `Attendance`, `Notifications`).
5.  Trên thanh menu của Google Sheet, chọn **Extensions (Tiện ích mở rộng)** > **Apps Script**.

## Bước 2: Cài đặt Script (Chọn 1 trong 2 hoặc làm cả 2)

Vì bạn muốn lưu dữ liệu vào 2 file Google Sheet khác nhau, bạn cần thực hiện quy trình cài đặt Script này cho **từng file Sheet**.

### Kịch bản 1: Dành cho File "Nhật ký Hoạt động" (Logs)
*Dùng để lưu lịch sử chỉnh sửa cửa hàng, chấm công, v.v.*

1.  Mở file Google Sheet **Nhật ký Hoạt động**.
2.  Vào **Extensions** > **Apps Script**.
3.  Dán đoạn code dưới đây:

```javascript
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    
    // Tự động chọn Sheet dựa trên loại dữ liệu gửi lên
    let sheetName = 'Logs';
    
    if (data.type === 'store_log') sheetName = 'StoreLogs';
    else if (data.type === 'attendance_history') sheetName = 'Attendance';
    else if (data.type === 'notification') sheetName = 'Notifications';
    
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(sheetName);

    // Nếu chưa có sheet thì tạo mới
    if (!sheet) {
      sheet = doc.insertSheet(sheetName);
      if (sheetName === 'StoreLogs') {
         sheet.appendRow(['Timestamp', 'Action', 'Store Name', 'User', 'Details', 'Full Data']);
      } else if (sheetName === 'Attendance') {
         sheet.appendRow(['Timestamp', 'Action', 'User', 'Status From', 'Status To', 'Full Data']);
      } else {
         sheet.appendRow(['Timestamp', 'Title', 'Message', 'Meta Data']);
      }
    }

    let row = [];
    const timestamp = new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"});
    
    if (sheetName === 'StoreLogs') {
      row = [timestamp, data.action || '', data.storeName || '', data.userName || '', data.details || '', JSON.stringify(data)];
    } else if (sheetName === 'Attendance') {
      row = [timestamp, data.action || '', data.userName || '', data.oldStatus || '', data.newStatus || '', JSON.stringify(data)];
    } else {
      row = [timestamp, data.title || data.action || '', data.message || data.details || '', JSON.stringify(data)];
    }

    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ result: 'success', sheet: sheetName }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

---

### Kịch bản 2: Dành cho File "Dữ liệu Task" (Report)
*Dùng để đồng bộ danh sách Task định kỳ.*

1.  Mở file Google Sheet **Quản lý Task** (hoặc file bạn muốn lưu task).
2.  Vào **Extensions** > **Apps Script**.
3.  Dán đoạn code dưới đây:

```javascript
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const doc = SpreadsheetApp.getActiveSpreadsheet();

    // Kiểm tra dữ liệu đầu vào
    if (!data.sheetName || !data.tasks) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: 'Missing sheetName or tasks data' }))
          .setMimeType(ContentService.MimeType.JSON);
    }

    const sheetName = data.sheetName; // Ví dụ: "Tháng 02-2025"
    let sheet = doc.getSheetByName(sheetName);

    // Nếu chưa có sheet thì tạo mới và thêm header
    if (!sheet) {
      sheet = doc.insertSheet(sheetName);
      sheet.appendRow([
        'ID', 'Tên Tiệm', 'Nội dung', 'Loại Task', 'Trạng thái', 'Mức độ', 
        'Người thực hiện', 'Ngày tạo', 'Hạn chót', 'Ngày hoàn thành', 'Last Updated'
      ]);
      // Tùy chỉnh format header
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f3f3f3');
    }

    // Lấy danh sách ID đã có trong Sheet để kiểm tra trùng
    const lastRow = sheet.getLastRow();
    let existingIds = new Set();
    
    if (lastRow > 1) {
      // Lấy cột A (ID) từ dòng 2 đến dòng cuối
      const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
      idColumn.forEach(row => {
        if (row[0]) existingIds.add(String(row[0]));
      });
    }

    const newRows = [];
    const timestamp = new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"});

    data.tasks.forEach(task => {
      // Chỉ thêm nếu ID chưa tồn tại trong Sheet
      if (!existingIds.has(String(task.id))) {
        newRows.push([
          task.id,
          task.name,
          task.content,
          task.type,
          task.status,
          task.priority,
          task.assignee,
          task.createdAt,
          task.deadline,
          task.completedAt,
          timestamp // Thời điểm đồng bộ
        ]);
      }
    });

    // Ghi hàng loạt (Batch write) để tối ưu hiệu suất
    if (newRows.length > 0) {
      sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      return ContentService.createTextOutput(JSON.stringify({ 
        result: 'success', 
        message: `Đã thêm ${newRows.length} task mới. Bỏ qua ${data.tasks.length - newRows.length} task trùng.` 
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        result: 'success', 
        message: 'Không có task mới nào. Tất cả dữ liệu đã tồn tại.' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

## Bước 3: Deploy (Xuất bản) Web App

**Làm thao tác này cho CẢ 2 Script** mà bạn vừa tạo ở trên:

1.  Bấm nút **Deploy** (màu xanh góc trên phải) > **New deployment**.
2.  Bấm vào biểu tượng bánh răng cạnh "Select type" > chọn **Web app**.
3.  Điền thông tin:
    *   **Description:** Sync Script v1
    *   **Execute as:** `Me (gmail của bạn)` -> **QUAN TRỌNG**
    *   **Who has access:** `Anyone` -> **QUAN TRỌNG: Phải chọn mục này**
4.  Bấm **Deploy**.
5.  Copy **Web App URL**.

## Bước 4: Nhập Link vào Website

1.  Quay lại trang **Import/Export Dữ liệu**.
2.  **Mục "Google Sheet Sync Nhật ký hoạt động":** Dán URL từ **Kịch bản 1**.
3.  **Mục "Google Sheet Sync Dữ liệu Task":** Dán URL từ **Kịch bản 2**.
4.  Bấm **Lưu cấu hình** cho từng mục.

### Cách kiểm tra hoạt động:
1.  Sau khi lưu, bấm nút **Kiểm tra kết nối** (Test Connection) bên cạnh.
2.  Nếu thất bại, hệ thống sẽ báo lỗi.
3.  Nếu thành công, hãy mở Google Sheet của bạn lên.
4.  Bạn sẽ thấy một dòng dữ liệu mới trong Sheet `Logs` (hoặc Sheet tương ứng) với nội dung: `Test Connection - Hello from Task Manager App`.

### Tự động đồng bộ
Hệ thống sẽ tự động gửi dữ liệu khi:
*   Có logs thay đổi thông tin cửa hàng (`store_log`) -> Sheet `StoreLogs`
*   Có chấm công mới (`attendance`) -> Sheet `Attendance`
*   Có thông báo task (`notification`) -> Sheet `Notifications`

Dữ liệu sẽ được tự động chia vào các Tab (Sheet) tương ứng trên file Google Sheet của bạn.
