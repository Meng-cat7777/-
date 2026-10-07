/**
 * 喵選拾光 訂單接收程式（Google Apps Script）
 * 貼到「喵選拾光 訂單」試算表的 擴充功能 > Apps Script，再部署成「網頁應用程式」：
 *   執行身分：我　／　誰可以存取：所有人
 * 部署後拿到的網址（https://script.google.com/macros/s/…/exec）貼到後台「顯示與價格」>「訂單接收網址」。
 * 每筆訂單會新增一列到「訂單」工作表，並寄一封通知信到這個 Google 帳號。
 */
const SHEET_NAME = '訂單';
const HEAD = ['下單時間', '訂單編號', '姓名', '手機', 'Email', 'LINE／IG', '付款方式', '取貨', '手圍',
  '商品', '商品小計', '運費', '合計', '價格待確認', '備註', '處理狀態'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d || !d.orderId || !Array.isArray(d.items) || !d.items.length || d.items.length > 60) return out_({ ok: false });
    const sheet = sheet_();
    const items = d.items.map(function (i) {
      const price = i.price == null ? '價格待確認' : 'NT$ ' + Number(i.price) * Number(i.qty || 1);
      return '・' + t_(i.name, 120) + (i.sub ? '（' + t_(i.sub, 300) + '）' : '') + ' × ' + Number(i.qty || 1) + '　' + price;
    }).join('\n');
    sheet.appendRow([new Date(), t_(d.orderId, 20), t_(d.name, 60), "'" + t_(d.phone, 20).replace(/^'/, ''), t_(d.email, 120), t_(d.contact, 120),
      t_(d.pay, 30), t_(d.store, 120), t_(d.wrist, 30), items, Number(d.subtotal) || 0,
      d.shipping == null ? '確認後告知' : Number(d.shipping) || 0, Number(d.total) || 0, d.pending ? '是' : '', t_(d.note, 1000), '新訂單']);
    const body = [
      '喵選拾光 有一筆新訂單：', '',
      '訂單編號：' + t_(d.orderId, 20), '收件人：' + t_(d.name, 60) + '　' + t_(d.phone, 20),
      d.contact ? '聯絡方式：' + t_(d.contact, 120) : '', d.email ? 'Email：' + t_(d.email, 120) : '',
      '付款方式：' + t_(d.pay, 30), '取貨：' + t_(d.store, 120), d.wrist ? '手圍：' + t_(d.wrist, 30) : '', '',
      '商品：', items, '',
      '合計：NT$ ' + (Number(d.total) || 0) + (d.pending ? ' 起（有價格待確認的項目）' : ''),
      d.note ? '備註：' + t_(d.note, 1000) : '', '', '訂單都記在試算表的「訂單」工作表。'
    ].filter(function (x, i, a) { return x !== '' || a[i - 1] !== ''; }).join('\n');
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: '【喵選拾光】新訂單 ' + t_(d.orderId, 20) + '｜' + t_(d.name, 30), body: body });
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doGet() { return out_({ ok: true, message: '喵選拾光 訂單接收中' }); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); }
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
  return sh;
}

// 文字清理：限制長度，並避免以 = + - @ 開頭被試算表當成公式
function t_(v, max) {
  let s = String(v == null ? '' : v).slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 第一次部署前可以先執行這個函式，完成授權並建立「訂單」工作表
function setup() { sheet_(); }
