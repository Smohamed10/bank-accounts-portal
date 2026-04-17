from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2, os
app = FastAPI(title='QNB Accounts API')
app.add_middleware(
CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)
def get_db():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
)
@app.get('/health')
def health(): return {'status': 'ok'}
@app.get('/api/accounts')
def get_accounts():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM accounts')
    rows = cur.fetchall()
    conn.close()
    return [{'id':r[0],'name':r[1],'balance':r[2]} for r in rows]
@app.get('/api/transactions')
def get_transactions():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM transactions ORDER BY date DESC LIMIT 20')
    rows = cur.fetchall()
    conn.close()
    return [{'id':r[0],'account_id':r[1],'amount':r[2],'date':str(r[3]),'desc':r[4]} for r in rows]