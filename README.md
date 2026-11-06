# Pencatatan Keuangan via WhatsApp & Web Dashboard

Sistem pencatatan transaksi keuangan otomatis melalui pesan WhatsApp yang terintegrasi dengan Google Sheets dan Web Dashboard interaktif.

## Fitur Utama

- **Catat via WhatsApp**: Kirim format pesan sederhana untuk mencatat pengeluaran atau pemasukan secara real-time.
- **Integrasi Google Sheets**: Semua transaksi tersimpan aman di Google Sheets via Google Apps Script Webhook.
- **Web Dashboard Interaktif**: Visualisasi grafik pemasukan/pengeluaran, statistik kategori, dompet/rekening, anggaran bulanan, dan ekspor data.
- **Auto-Sync & Offline First**: Sinkronisasi data otomatis dengan Google Sheets serta penyimpanan cadangan di browser.
- **Mode Lokal (Opsional)**: Backend Python ringan (`local_backend.py`) dengan basis data SQLite untuk penggunaan offline.

## Format Pesan WhatsApp

```text
keluar [nominal] [kategori] [keterangan]
masuk [nominal] [kategori] [keterangan]
```

### Contoh:
- `keluar 25000 Makan Nasi Padang`
- `masuk 1500000 Freelance Desain Web`

## Struktur File

- `index.html`: Dashboard web utama dengan integrasi Google Sheets & WhatsApp.
- `google-apps-script.js`: Kode backend Apps Script untuk webhook Fonnte dan REST API Google Sheets.
- `local_backend.py`: Server Python lokal SQLite untuk pencatatan tanpa internet.
- `index.local.html`: Varian dashboard yang terhubung ke server lokal (`localhost:8787`).
- `manifest.json` & `sw.js`: Konfigurasi Progressive Web App (PWA).

## Cara Menjalankan

1. Buka `index.html` langsung di browser Anda (atau jalankan via web server lokal).
2. Klik tombol **Sync WA** untuk memperbarui transaksi dari Google Sheets.
