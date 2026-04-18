from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2, os

app = FastAPI(title='Bank Accounts API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# -----------------------
# DB CONNECTION jjjj
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

class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    desc: str

# -----------------------
# ROUTES
# -----------------------
@app.get('/health')
def health():
    return {'status': 'ok'}


# GET accounts
@app.get('/api/accounts')
def get_accounts():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM accounts')
    rows = cur.fetchall()
    conn.close()

    return [{'id': r[0], 'name': r[1], 'balance': r[2]} for r in rows]


# CREATE account
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


# DELETE account
@app.delete('/api/accounts/{account_id}')
def delete_account(account_id: int):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM accounts WHERE id=%s", (account_id,))
    conn.commit()
    conn.close()

    return {"message": "Account deleted"}


# DEPOSIT / WITHDRAW
@app.post('/api/transactions')
def create_transaction(tx: TransactionCreate):
    conn = get_db()
    cur = conn.cursor()

    # Check account
    cur.execute("SELECT balance FROM accounts WHERE id=%s", (tx.account_id,))
    result = cur.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Account not found")

    current_balance = result[0]
    new_balance = current_balance + tx.amount

    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Update balance
    cur.execute(
        "UPDATE accounts SET balance=%s WHERE id=%s",
        (new_balance, tx.account_id)
    )

    # Insert transaction
    cur.execute(
        "INSERT INTO transactions (account_id, amount, desc) VALUES (%s, %s, %s)",
        (tx.account_id, tx.amount, tx.desc)
    )

    conn.commit()
    conn.close()

    return {"message": "Transaction completed", "balance": new_balance}


# GET transactions
@app.get('/api/transactions')
def get_transactions():
    conn = get_db()
    cur = conn.cursor()

    cur.execute('SELECT * FROM transactions ORDER BY date DESC LIMIT 20')
    rows = cur.fetchall()

    conn.close()

    return [
        {
            'id': r[0],
            'account_id': r[1],
            'amount': r[2],
            'date': str(r[3]),
            'desc': r[4]
        }
        for r in rows
    ]