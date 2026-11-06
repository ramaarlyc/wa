#!/usr/bin/env python3
"""Local SQLite transaction API for the dashboard prototype."""
import json
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DB = Path(__file__).with_name("keuangan.local.db")


def init_db():
    with sqlite3.connect(DB) as db:
        db.execute("""CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY, date TEXT NOT NULL, type TEXT NOT NULL,
            amount INTEGER NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL,
            wallet TEXT NOT NULL, notes TEXT NOT NULL
        )""")
        db.commit()


def read_transactions():
    with sqlite3.connect(DB) as db:
        db.row_factory = sqlite3.Row
        return [dict(row) for row in db.execute(
            "SELECT id,date,type,amount,title,category,wallet,notes "
            "FROM transactions ORDER BY date DESC, rowid DESC")]


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        if self.path != "/api/transactions":
            self.send_json(404, {"error": "not found"})
            return
        rows = read_transactions()
        self.send_json(200, {"status": "success", "count": len(rows), "transactions": rows})

    def do_POST(self):
        if self.path != "/api/transactions":
            self.send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            if data.get("message"):
                parts = str(data["message"]).split()
                if len(parts) < 2 or parts[0].lower() not in ("masuk", "keluar"):
                    raise ValueError("invalid message format")
                data = {
                    "id": "local-" + str(__import__("time").time_ns()),
                    "date": __import__("datetime").date.today().isoformat(),
                    "type": "income" if parts[0].lower() == "masuk" else "expense",
                    "amount": int("".join(filter(str.isdigit, parts[1]))),
                    "title": " ".join(parts[3:]) or "Transaksi WhatsApp",
                    "category": parts[2] if len(parts) > 2 else "Umum",
                    "wallet": "Kas / Tunai",
                    "notes": "Dicatat via WhatsApp (lokal)",
                }
            required = ("id", "date", "type", "amount", "title", "category", "wallet", "notes")
            if any(not data.get(key) and data.get(key) != 0 for key in required):
                raise ValueError("missing transaction field")
            if data["type"] not in ("income", "expense"):
                raise ValueError("invalid transaction type")
            data["amount"] = int(data["amount"])
            with sqlite3.connect(DB) as db:
                db.execute("INSERT OR REPLACE INTO transactions VALUES (?,?,?,?,?,?,?,?)",
                           tuple(data[key] for key in required))
                db.commit()
            self.send_json(200, {"status": "success", "transaction": data})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self.send_json(400, {"status": "error", "error": str(exc)})

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    init_db()
    print(f"Local API: http://127.0.0.1:8787  DB: {DB}")
    ThreadingHTTPServer(("127.0.0.1", 8787), Handler).serve_forever()
