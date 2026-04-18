import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("accounts");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAccounts = () => {
    fetch(`${API}/api/accounts`)
      .then((r) => r.json())
      .then(setAccounts)
      .catch(() => showToast("Failed to load accounts", "error"));
  };

  const loadTransactions = () => {
    fetch(`${API}/api/transactions`)
      .then((r) => r.json())
      .then(setTransactions)
      .catch(() => showToast("Failed to load transactions", "error"));
  };

  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, []);

  const createAccount = async () => {
    if (!name.trim()) return showToast("Enter an account name", "error");
    setLoading(true);
    await fetch(`${API}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, balance: 0 }),
    });
    setName("");
    loadAccounts();
    setLoading(false);
    showToast("Account created successfully");
  };

  const deleteAccount = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    await fetch(`${API}/api/accounts/${id}`, { method: "DELETE" });
    loadAccounts();
    showToast("Account deleted");
  };

  const sendTransaction = async () => {
    if (!selectedId) return showToast("Select an account first", "error");
    if (!amount) return showToast("Enter an amount", "error");
    setLoading(true);
    const res = await fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: selectedId,
        amount: parseFloat(amount),
        desc: "Manual operation",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.detail || "Transaction failed", "error");
    } else {
      showToast("Transaction completed");
      setAmount("");
      loadAccounts();
      loadTransactions();
    }
    setLoading(false);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#f4f6fb",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      color: "#1a1a2e",
    },
    header: {
      background: "#1a1a2e",
      color: "#fff",
      padding: "0 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "60px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    },
    headerTitle: {
      fontSize: "18px",
      fontWeight: "600",
      letterSpacing: "0.3px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    badge: {
      background: "#16213e",
      color: "#a0aec0",
      fontSize: "11px",
      padding: "3px 8px",
      borderRadius: "20px",
      fontWeight: "500",
    },
    main: {
      maxWidth: "960px",
      margin: "0 auto",
      padding: "2rem 1.5rem",
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      marginBottom: "2rem",
    },
    statCard: {
      background: "#fff",
      borderRadius: "12px",
      padding: "1.2rem 1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      borderLeft: "4px solid",
    },
    statLabel: {
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      color: "#718096",
      marginBottom: "6px",
    },
    statValue: {
      fontSize: "26px",
      fontWeight: "700",
    },
    card: {
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      marginBottom: "1.5rem",
      overflow: "hidden",
    },
    cardHeader: {
      padding: "1rem 1.5rem",
      borderBottom: "1px solid #f0f0f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#1a1a2e",
    },
    cardBody: {
      padding: "1.5rem",
    },
    inputRow: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    input: {
      flex: 1,
      padding: "10px 14px",
      border: "1.5px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      background: "#fafafa",
      color: "#1a1a2e",
      transition: "border 0.2s",
    },
    btnPrimary: {
      background: "#1a1a2e",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "background 0.2s",
    },
    btnDanger: {
      background: "transparent",
      color: "#e53e3e",
      border: "1.5px solid #fed7d7",
      borderRadius: "6px",
      padding: "5px 12px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    },
    btnSelect: {
      background: "transparent",
      color: "#3182ce",
      border: "1.5px solid #bee3f8",
      borderRadius: "6px",
      padding: "5px 12px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    },
    btnSelectActive: {
      background: "#ebf8ff",
      color: "#2b6cb0",
      border: "1.5px solid #3182ce",
      borderRadius: "6px",
      padding: "5px 12px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    },
    tabs: {
      display: "flex",
      gap: "4px",
      background: "#f4f6fb",
      padding: "4px",
      borderRadius: "10px",
      marginBottom: "1.5rem",
    },
    tab: {
      flex: 1,
      padding: "8px 16px",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      background: "transparent",
      color: "#718096",
      transition: "all 0.2s",
    },
    tabActive: {
      flex: 1,
      padding: "8px 16px",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      background: "#fff",
      color: "#1a1a2e",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    accountItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid #f0f0f5",
    },
    avatar: {
      width: "38px",
      height: "38px",
      borderRadius: "50%",
      background: "#ebf8ff",
      color: "#2b6cb0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      fontSize: "13px",
      flexShrink: 0,
    },
    txItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid #f0f0f5",
    },
    toast: (type) => ({
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: type === "error" ? "#e53e3e" : "#38a169",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 9999,
    }),
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={{ fontSize: "20px" }}>🏦</span>
          QNB Bank Portal
          <span style={styles.badge}>DEV</span>
        </div>
        <span style={{ fontSize: "13px", color: "#a0aec0" }}>
          {accounts.length} accounts
        </span>
      </div>

      <div style={styles.main}>
        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, borderLeftColor: "#3182ce" }}>
            <div style={styles.statLabel}>Total Balance</div>
            <div style={{ ...styles.statValue, color: "#3182ce" }}>
              ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeftColor: "#38a169" }}>
            <div style={styles.statLabel}>Accounts</div>
            <div style={{ ...styles.statValue, color: "#38a169" }}>
              {accounts.length}
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeftColor: "#805ad5" }}>
            <div style={styles.statLabel}>Transactions</div>
            <div style={{ ...styles.statValue, color: "#805ad5" }}>
              {transactions.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={activeTab === "accounts" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("accounts")}
          >
            Accounts
          </button>
          <button
            style={activeTab === "transactions" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            style={activeTab === "transfer" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("transfer")}
          >
            New Transfer
          </button>
        </div>

        {/* Accounts Tab */}
        {activeTab === "accounts" && (
          <>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Open New Account</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.inputRow}>
                  <input
                    style={styles.input}
                    placeholder="Account holder name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createAccount()}
                  />
                  <button
                    style={styles.btnPrimary}
                    onClick={createAccount}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>All Accounts</span>
                <span style={{ fontSize: "13px", color: "#718096" }}>
                  {accounts.length} total
                </span>
              </div>
              <div style={{ padding: "0 1.5rem" }}>
                {accounts.length === 0 && (
                  <p style={{ color: "#718096", padding: "1.5rem 0", fontSize: "14px" }}>
                    No accounts yet. Create one above.
                  </p>
                )}
                {accounts.map((acc, i) => (
                  <div
                    key={acc.id}
                    style={{
                      ...styles.accountItem,
                      ...(i === accounts.length - 1 ? { borderBottom: "none" } : {}),
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={styles.avatar}>
                        {acc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#718096" }}>
                          ID #{acc.id}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "15px",
                          color: acc.balance >= 0 ? "#38a169" : "#e53e3e",
                        }}
                      >
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        style={selectedId === acc.id ? styles.btnSelectActive : styles.btnSelect}
                        onClick={() => {
                          setSelectedId(acc.id);
                          setActiveTab("transfer");
                        }}
                      >
                        Transfer
                      </button>
                      <button
                        style={styles.btnDanger}
                        onClick={() => deleteAccount(acc.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Recent Transactions</span>
              <span style={{ fontSize: "13px", color: "#718096" }}>Last 20</span>
            </div>
            <div style={{ padding: "0 1.5rem" }}>
              {transactions.length === 0 && (
                <p style={{ color: "#718096", padding: "1.5rem 0", fontSize: "14px" }}>
                  No transactions yet.
                </p>
              )}
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  style={{
                    ...styles.txItem,
                    ...(i === transactions.length - 1 ? { borderBottom: "none" } : {}),
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{tx.desc}</div>
                    <div style={{ fontSize: "12px", color: "#718096" }}>
                      Account #{tx.account_id} · {tx.date}
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "15px",
                      color: tx.amount >= 0 ? "#38a169" : "#e53e3e",
                    }}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    ${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === "transfer" && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>New Transaction</span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#718096", display: "block", marginBottom: "8px" }}>
                  SELECT ACCOUNT
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedId(acc.id)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: selectedId === acc.id ? "2px solid #3182ce" : "1.5px solid #e2e8f0",
                        background: selectedId === acc.id ? "#ebf8ff" : "#fafafa",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>{acc.name}</span>
                      <span style={{ fontWeight: "700", color: "#38a169", fontSize: "14px" }}>
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#718096", display: "block", marginBottom: "8px" }}>
                  AMOUNT (use negative for withdrawal)
                </label>
                <input
                  style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                  type="number"
                  placeholder="e.g. 500 or -200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {selectedAccount && amount && (
                <div style={{ background: "#f7fafc", borderRadius: "8px", padding: "12px 16px", marginBottom: "1rem", fontSize: "13px", color: "#4a5568" }}>
                  New balance for <b>{selectedAccount.name}</b>:{" "}
                  <span style={{ fontWeight: "700", color: "#1a1a2e" }}>
                    ${(selectedAccount.balance + parseFloat(amount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <button
                style={{ ...styles.btnPrimary, width: "100%", padding: "12px", fontSize: "15px" }}
                onClick={sendTransaction}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Transaction"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div style={styles.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}

export default App;