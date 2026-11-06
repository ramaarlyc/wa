// Google Apps Script untuk Webhook WhatsApp (Fonnte) & API Dashboard Keuangan
// Auto-inisialisasi header jika spreadsheet masih kosong.

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Transaksi") || ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Tanggal", "Tipe", "Nominal", "Judul", "Kategori", "Dompet", "Catatan"]);
    sheet.getRange("A1:H1").setFontWeight("bold");
  }
  return sheet;
}

// Endpoint POST: Menerima webhook dari Fonnte saat ada pesan WA masuk
function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else {
      postData = e.parameter || {};
    }

    var message = (postData.message || "").trim();
    if (!message) {
      return jsonResponse({ reply: "Pesan kosong." });
    }

    // Format chat: [keluar/masuk] [nominal] [kategori] [judul/keterangan...]
    // Contoh: keluar 25000 Makan Nasi padang
    var parts = message.split(/\s+/);
    var cmd = parts[0].toLowerCase();

    // Ambil token dari Script Properties atau isi manual jika diperlukan
    var FONNTE_TOKEN = PropertiesService.getScriptProperties().getProperty("FONNTE_TOKEN") || "YOUR_FONNTE_TOKEN";
    var sendReply = function(target, msg) {
      if (!target || !FONNTE_TOKEN) return;
      try {
        UrlFetchApp.fetch("https://api.fonnte.com/send", {
          method: "post",
          headers: { "Authorization": FONNTE_TOKEN },
          payload: { target: target, message: msg }
        });
      } catch (e) {}
    };

    if (cmd !== "keluar" && cmd !== "masuk") {
      var help = "Format salah. Gunakan:\nkeluar/masuk [nominal] [kategori] [keterangan]\n\nContoh:\nkeluar 25000 Makan Nasi Padang\nmasuk 500000 Freelance Desain logo";
      sendReply(postData.sender, help);
      return jsonResponse({ reply: help });
    }

    var isExpense = (cmd === "keluar");
    var type = isExpense ? "expense" : "income";
    var nominal = parseInt(parts[1].replace(/[^0-9]/g, ""), 10) || 0;
    var category = parts[2] || (isExpense ? "Makanan & Minuman" : "Pemasukan Lain");
    var title = parts.slice(3).join(" ") || (isExpense ? "Pengeluaran WA" : "Pemasukan WA");
    
    var now = new Date();
    var dateStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
    var id = "wa-" + now.getTime();
    var wallet = "Kas / Tunai";
    var notes = "Dicatat via WhatsApp (" + (postData.sender || "User") + ")";

    sheet.appendRow([id, dateStr, type, nominal, title, category, wallet, notes]);

    var labelTipe = isExpense ? "Pengeluaran" : "Pemasukan";
    var formattedNominal = "Rp " + nominal.toLocaleString("id-ID");
    var reply = "✅ " + labelTipe + " Berhasil Dicatat!\n" +
                "Nominal: " + formattedNominal + "\n" +
                "Kategori: " + category + "\n" +
                "Keterangan: " + title + "\n" +
                "Tanggal: " + dateStr;

    sendReply(postData.sender, reply);
    return jsonResponse({ reply: reply });
  } catch (error) {
    return jsonResponse({ reply: "❌ Terjadi kesalahan: " + error.message });
  }
}

// Endpoint GET: Dipanggil oleh Dashboard Keuangan untuk fetch transaksi
function doGet(e) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  var transactions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    transactions.push({
      id: String(row[0]),
      date: formatDate(row[1]),
      type: row[2] === "income" ? "income" : "expense",
      amount: Number(row[3]) || 0,
      title: String(row[4] || "-"),
      category: String(row[5] || "Umum"),
      wallet: String(row[6] || "Kas / Tunai"),
      notes: String(row[7] || "")
    });
  }

  return jsonResponse({ status: "success", count: transactions.length, transactions: transactions });
}

function formatDate(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
  }
  return String(val).slice(0, 10);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
