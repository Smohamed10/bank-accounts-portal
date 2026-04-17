import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const loadAccounts = () => {
    fetch(`${API}/api/accounts`)
      .then(r => r.json())
      .then(setAccounts);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // CREATE account
  const createAccount = async () => {
    await fetch(`${API}/api/accounts`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name, balance: 0 })
    });
    setName("");
    loadAccounts();
  };

  // DELETE account
  const deleteAccount = async (id) => {
    await fetch(`${API}/api/accounts/${id}`, {
      method: "DELETE"
    });
    loadAccounts();
  };

  // TRANSACTION
  const sendTransaction = async () => {
    await fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        account_id: selectedId,
        amount: parseFloat(amount),
        desc: "Manual operation"
      })
    });
    setAmount(0);
    loadAccounts();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🏦 Bank Dashboard</h1>

      {/* CREATE */}
      <div>
        <input
          placeholder="Account name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={createAccount}>Create</button>
      </div>

      <hr />

      {/* LIST */}
      <h2>Accounts</h2>
      {accounts.map(acc => (
        <div key={acc.id} style={{
          border: "1px solid #ccc",
          padding: "10px",
          margin: "10px 0"
        }}>
          <b>{acc.name}</b> — ${acc.balance}

          <br />

          <button onClick={() => setSelectedId(acc.id)}>
            Select
          </button>

          <button onClick={() => deleteAccount(acc.id)}>
            Delete
          </button>
        </div>
      ))}

      <hr />

      {/* TRANSACTION */}
      <h2>Transaction</h2>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button onClick={sendTransaction}>
        Deposit / Withdraw
      </button>
    </div>
  );
}

export default App;