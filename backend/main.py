from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import psycopg2, os

app = FastAPI(title='Bank Accounts API')

# -----------------------
# CORS — must be first
# -----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Return CORS headers even on unhandled exceptions (fixes 500 CORS stripping)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

# -----------------------
# DB CONNECTION
# -----------------------
def get_db():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
    )

# -----------------------
# MODELS
# -----------------------
class AccountCreate(BaseModel):
    name: str
    balance: float = 0

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None

class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    desc: str

class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    desc: Optional[str] = "Transfer"

# -----------------------
# HEALTH
# -----------------------
@app.get('/health')
def health():
    try:
        conn = get_db()
        conn.close()
        return {'status': 'ok', 'database': 'connected'}
    except Exception as e:
        return {'status': 'degraded', 'database': str(e)}

# -----------------------
# ACCOUNTS
# -----------------------
@app.get('/api/accounts')
def get_accounts():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, name, balance FROM accounts ORDER BY id')
    rows = cur.fetchall()
    conn.close()
    return [{'id': r[0], 'name': r[1], 'balance': float(r[2])} for r in rows]

@app.get('/api/accounts/{account_id}')
def get_account(account_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, name, balance FROM accounts WHERE id=%s', (account_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    return {'id': row[0], 'name': row[1], 'balance': float(row[2])}

@app.post('/api/accounts')
def create_account(account: AccountCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO accounts (name, balance) VALUES (%s, %s) RETURNING id",
        (account.name, account.balance)
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"message": "Account created", "id": new_id}

@app.put('/api/accounts/{account_id}')
def update_account(account_id: int, update: AccountUpdate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM accounts WHERE id=%s', (account_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    if update.name:
        cur.execute("UPDATE accounts SET name=%s WHERE id=%s", (update.name, account_id))
    conn.commit()
    conn.close()
    return {"message": "Account updated"}

@app.delete('/api/accounts/{account_id}')
def delete_account(account_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT balance FROM accounts WHERE id=%s', (account_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    cur.execute("DELETE FROM transactions WHERE account_id=%s", (account_id,))
    cur.execute("DELETE FROM accounts WHERE id=%s", (account_id,))
    conn.commit()
    conn.close()
    return {"message": "Account deleted"}

# -----------------------
# TRANSACTIONS
# -----------------------
@app.get('/api/transactions')
def get_transactions(account_id: Optional[int] = None, limit: int = 20):
    conn = get_db()
    cur = conn.cursor()
    if account_id:
        cur.execute(
            'SELECT id, account_id, amount, date, "desc" FROM transactions WHERE account_id=%s ORDER BY date DESC LIMIT %s',
            (account_id, limit)
        )
    else:
        cur.execute(
            'SELECT id, account_id, amount, date, "desc" FROM transactions ORDER BY date DESC LIMIT %s',
            (limit,)
        )
    rows = cur.fetchall()
    conn.close()
    return [
        {'id': r[0], 'account_id': r[1], 'amount': float(r[2]), 'date': str(r[3]), 'desc': r[4]}
        for r in rows
    ]

@app.post('/api/transactions')
def create_transaction(tx: TransactionCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT balance FROM accounts WHERE id=%s", (tx.account_id,))
    result = cur.fetchone()
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")
    current_balance = float(result[0])
    new_balance = current_balance + tx.amount
    if new_balance < 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient funds")
    cur.execute("UPDATE accounts SET balance=%s WHERE id=%s", (new_balance, tx.account_id))
    # "desc" quoted to avoid reserved keyword conflict
    cur.execute(
        'INSERT INTO transactions (account_id, amount, "desc") VALUES (%s, %s, %s)',
        (tx.account_id, tx.amount, tx.desc)
    )
    conn.commit()
    conn.close()
    return {"message": "Transaction completed", "balance": new_balance}

# -----------------------
# TRANSFERS (account to account)
# -----------------------
@app.post('/api/transfers')
def transfer(transfer: TransferCreate):
    if transfer.from_account_id == transfer.to_account_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")
    if transfer.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT balance, name FROM accounts WHERE id=%s", (transfer.from_account_id,))
    from_acc = cur.fetchone()
    cur.execute("SELECT balance, name FROM accounts WHERE id=%s", (transfer.to_account_id,))
    to_acc = cur.fetchone()
    if not from_acc:
        conn.close()
        raise HTTPException(status_code=404, detail="Source account not found")
    if not to_acc:
        conn.close()
        raise HTTPException(status_code=404, detail="Destination account not found")
    from_balance = float(from_acc[0])
    if from_balance < transfer.amount:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient funds")
    new_from = from_balance - transfer.amount
    new_to = float(to_acc[0]) + transfer.amount
    cur.execute("UPDATE accounts SET balance=%s WHERE id=%s", (new_from, transfer.from_account_id))
    cur.execute("UPDATE accounts SET balance=%s WHERE id=%s", (new_to, transfer.to_account_id))
    desc_debit = f"Transfer to {to_acc[1]}"
    desc_credit = f"Transfer from {from_acc[1]}"
    cur.execute(
        'INSERT INTO transactions (account_id, amount, "desc") VALUES (%s, %s, %s)',
        (transfer.from_account_id, -transfer.amount, desc_debit)
    )
    cur.execute(
        'INSERT INTO transactions (account_id, amount, "desc") VALUES (%s, %s, %s)',
        (transfer.to_account_id, transfer.amount, desc_credit)
    )
    conn.commit()
    conn.close()
    return {
        "message": "Transfer completed",
        "from_balance": new_from,
        "to_balance": new_to
    }

# -----------------------
# SUMMARY / STATS
# -----------------------
@app.get('/api/stats')
def get_stats():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), COALESCE(SUM(balance),0) FROM accounts")
    acc_row = cur.fetchone()
    cur.execute("SELECT COUNT(*), COALESCE(SUM(amount),0) FROM transactions WHERE amount > 0")
    dep_row = cur.fetchone()
    cur.execute("SELECT COUNT(*), COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE amount < 0")
    with_row = cur.fetchone()
    conn.close()
    return {
        "total_accounts": acc_row[0],
        "total_balance": float(acc_row[1]),
        "total_deposits": float(dep_row[1]),
        "total_withdrawals": float(with_row[1]),
        "deposit_count": dep_row[0],
        "withdrawal_count": with_row[0],
    }