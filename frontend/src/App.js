import { useEffect, useState, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const fmt = (n) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initials = (name) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  { bg: "#ebf8ff", color: "#2b6cb0" },
  { bg: "#f0fff4", color: "#276749" },
  { bg: "#faf5ff", color: "#6b46c1" },
  { bg: "#fff5f5", color: "#c53030" },
  { bg: "#fffaf0", color: "#c05621" },
];

const getColor = (id) => avatarColors[id % avatarColors.length];

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [txAccountId, setTxAccountId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txType, setTxType] = useState("deposit");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const [searchTx, setSearchTx] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const [accRes, txRes, stRes] = await Promise.all([
        fetch(`${API}/api/accounts`),
        fetch(`${API}/api/transactions?limit=50`),
        fetch(`${API}/api/stats`),
      ]);
      setAccounts(await accRes.json());
      setTransactions(await txRes.json());
      setStats(await stRes.json());
    } catch {
      showToast("Failed to load data", "error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAccount = async () => {
    if (!newName.trim()) return showToast("Enter account holder name", "error");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, balance: parseFloat(newBalance) || 0 }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setNewName(""); setNewBalance("");
      await load();
      showToast(`Account for ${newName} created`);
    } catch (e) { showToast(e.message || "Failed", "error"); }
    setLoading(false);
  };

  const deleteAccount = async (id, name) => {
    if (!window.confirm(`Delete account for ${name}? All transactions will be removed.`)) return;
    try {
      await fetch(`${API}/api/accounts/${id}`, { method: "DELETE" });
      await load();
      showToast("Account deleted");
    } catch { showToast("Failed to delete", "error"); }
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await fetch(`${API}/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      setEditingId(null);
      await load();
      showToast("Account renamed");
    } catch { showToast("Failed to rename", "error"); }
  };

  const doTransaction = async () => {
    if (!txAccountId) return showToast("Select an account", "error");
    if (!txAmount || isNaN(txAmount)) return showToast("Enter a valid amount", "error");
    const finalAmount = txType === "withdrawal" ? -Math.abs(parseFloat(txAmount)) : Math.abs(parseFloat(txAmount));
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: parseInt(txAccountId),
          amount: finalAmount,
          desc: txDesc || (txType === "deposit" ? "Deposit" : "Withdrawal"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setTxAmount(""); setTxDesc("");
      await load();
      showToast(`${txType === "deposit" ? "Deposit" : "Withdrawal"} of $${fmt(Math.abs(finalAmount))} completed`);
    } catch (e) { showToast(e.message || "Transaction failed", "error"); }
    setLoading(false);
  };

  const doTransfer = async () => {
    if (!fromId || !toId) return showToast("Select both accounts", "error");
    if (fromId === toId) return showToast("Cannot transfer to same account", "error");
    if (!transferAmount || isNaN(transferAmount) || parseFloat(transferAmount) <= 0)
      return showToast("Enter a valid amount", "error");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account_id: parseInt(fromId),
          to_account_id: parseInt(toId),
          amount: parseFloat(transferAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setTransferAmount("");
      await load();
      showToast(`Transfer of $${fmt(transferAmount)} completed`);
    } catch (e) { showToast(e.message || "Transfer failed", "error"); }
    setLoading(false);
  };

  const filteredTx = transactions.filter((tx) => {
    const matchAccount = filterAccount === "all" || tx.account_id === parseInt(filterAccount);
    const matchSearch = tx.desc?.toLowerCase().includes(searchTx.toLowerCase());
    return matchAccount && matchSearch;
  });

  const s = {
    wrap: { minHeight: "100vh", background: "#f0f2f8", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#1a1a2e" },
    nav: { background: "#1a1a2e", display: "flex", alignItems: "center", padding: "0 1.5rem", height: "56px", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
    navBrand: { color: "#fff", fontWeight: "700", fontSize: "16px", marginRight: "20px", display: "flex", alignItems: "center", gap: "8px" },
    navBtn: (active) => ({ background: active ? "rgba(255,255,255,0.12)" : "transparent", color: active ? "#fff" : "#94a3b8", border: "none", borderRadius: "8px", padding: "7px 13px", fontSize: "13px", fontWeight: active ? "600" : "400", cursor: "pointer" }),
    main: { maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "1.5rem" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
    statCard: (color) => ({ background: "#fff", borderRadius: "12px", padding: "1.1rem 1.3rem", borderLeft: `4px solid ${color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }),
    statLabel: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", color: "#94a3b8", marginBottom: "4px" },
    statVal: (color) => ({ fontSize: "22px", fontWeight: "700", color }),
    statSub: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
    card: { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "1.2rem", overflow: "hidden" },
    cardHead: { padding: "0.9rem 1.3rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e" },
    cardBody: { padding: "1.2rem 1.3rem" },
    row: { display: "flex", gap: "8px", alignItems: "center" },
    input: { flex: 1, padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", background: "#fafafa", color: "#1a1a2e", outline: "none", minWidth: 0 },
    select: { flex: 1, padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", background: "#fafafa", color: "#1a1a2e", outline: "none", minWidth: 0 },
    btnPrimary: { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
    btnGreen: { background: "#38a169", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
    btnRed: { background: "transparent", color: "#e53e3e", border: "1.5px solid #fed7d7", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
    btnBlue: { background: "transparent", color: "#3182ce", border: "1.5px solid #bee3f8", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
    btnGhost: { background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
    accRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 1.3rem", borderBottom: "1px solid #f1f5f9" },
    avatar: (id) => ({ width: "36px", height: "36px", borderRadius: "50%", background: getColor(id).bg, color: getColor(id).color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "11px", flexShrink: 0 }),
    txRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 1.3rem", borderBottom: "1px solid #f1f5f9" },
    txIcon: (pos) => ({ width: "30px", height: "30px", borderRadius: "50%", background: pos ? "#f0fff4" : "#fff5f5", color: pos ? "#38a169" : "#e53e3e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }),
    badge: (pos) => ({ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: pos ? "#f0fff4" : "#fff5f5", color: pos ? "#276749" : "#c53030" }),
    segRow: { display: "flex", gap: "4px", background: "#f1f5f9", padding: "4px", borderRadius: "8px", marginBottom: "1rem" },
    seg: (active) => ({ flex: 1, padding: "7px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: active ? "600" : "400", cursor: "pointer", background: active ? "#fff" : "transparent", color: active ? "#1a1a2e" : "#94a3b8", boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }),
    toast: (type) => ({ position: "fixed", bottom: "20px", right: "20px", background: type === "error" ? "#e53e3e" : "#38a169", color: "#fff", padding: "11px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 9999, maxWidth: "320px" }),
    emptyState: { padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "13px" },
    lbl: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.6px" },
  };

  return (
    <div style={s.wrap}>
      <nav style={s.nav}>
        <div style={s.navBrand}>🏦 QNB Portal</div>
        {[["dashboard","Dashboard"],["accounts","Accounts"],["transactions","Transactions"],["transfer","Transfer"],["deposit","Deposit/Withdraw"]].map(([key,label]) => (
          <button key={key} style={s.navBtn(activeTab===key)} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </nav>

      <div style={s.main}>

        {activeTab === "dashboard" && (
          <>
            <div style={s.grid3}>
              <div style={s.statCard("#3182ce")}>
                <div style={s.statLabel}>Total Balance</div>
                <div style={s.statVal("#3182ce")}>${fmt(stats?.total_balance ?? 0)}</div>
                <div style={s.statSub}>{stats?.total_accounts ?? 0} accounts</div>
              </div>
              <div style={s.statCard("#38a169")}>
                <div style={s.statLabel}>Total Deposits</div>
                <div style={s.statVal("#38a169")}>${fmt(stats?.total_deposits ?? 0)}</div>
                <div style={s.statSub}>{stats?.deposit_count ?? 0} transactions</div>
              </div>
              <div style={s.statCard("#e53e3e")}>
                <div style={s.statLabel}>Total Withdrawals</div>
                <div style={s.statVal("#e53e3e")}>${fmt(stats?.total_withdrawals ?? 0)}</div>
                <div style={s.statSub}>{stats?.withdrawal_count ?? 0} transactions</div>
              </div>
            </div>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>Top Accounts</span>
                  <button style={s.btnBlue} onClick={() => setActiveTab("accounts")}>View all</button>
                </div>
                {[...accounts].sort((a,b) => b.balance - a.balance).slice(0,5).map((acc,i) => (
                  <div key={acc.id} style={s.accRow}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={s.avatar(acc.id)}>{initials(acc.name)}</div>
                      <div>
                        <div style={{ fontWeight:"600", fontSize:"13px" }}>{acc.name}</div>
                        <div style={{ fontSize:"11px", color:"#94a3b8" }}>#{acc.id}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight:"700", fontSize:"14px", color: acc.balance >= 0 ? "#38a169" : "#e53e3e" }}>${fmt(acc.balance)}</span>
                  </div>
                ))}
                {accounts.length === 0 && <div style={s.emptyState}>No accounts yet</div>}
              </div>
              <div style={s.card}>
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>Recent Activity</span>
                  <button style={s.btnBlue} onClick={() => setActiveTab("transactions")}>View all</button>
                </div>
                {transactions.slice(0,6).map((tx) => (
                  <div key={tx.id} style={s.txRow}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={s.txIcon(tx.amount >= 0)}>{tx.amount >= 0 ? "↑" : "↓"}</div>
                      <div>
                        <div style={{ fontWeight:"600", fontSize:"12px" }}>{tx.desc}</div>
                        <div style={{ fontSize:"11px", color:"#94a3b8" }}>Acct #{tx.account_id}</div>
                      </div>
                    </div>
                    <span style={s.badge(tx.amount >= 0)}>{tx.amount >= 0 ? "+" : ""}${fmt(Math.abs(tx.amount))}</span>
                  </div>
                ))}
                {transactions.length === 0 && <div style={s.emptyState}>No transactions yet</div>}
              </div>
            </div>
          </>
        )}

        {activeTab === "accounts" && (
          <>
            <div style={s.card}>
              <div style={s.cardHead}><span style={s.cardTitle}>Open New Account</span></div>
              <div style={s.cardBody}>
                <div style={s.row}>
                  <input style={s.input} placeholder="Account holder full name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createAccount()} />
                  <input style={{ ...s.input, maxWidth:"140px" }} type="number" placeholder="Opening balance" value={newBalance} onChange={e => setNewBalance(e.target.value)} />
                  <button style={s.btnPrimary} onClick={createAccount} disabled={loading}>{loading ? "..." : "Open Account"}</button>
                </div>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardTitle}>All Accounts</span>
                <span style={{ fontSize:"12px", color:"#94a3b8" }}>{accounts.length} total</span>
              </div>
              {accounts.length === 0 && <div style={s.emptyState}>No accounts. Create one above.</div>}
              {accounts.map((acc, i) => (
                <div key={acc.id} style={{ ...s.accRow, ...(i === accounts.length-1 ? { borderBottom:"none" } : {}) }}>
                  {editingId === acc.id ? (
                    <div style={{ display:"flex", gap:"8px", flex:1, alignItems:"center" }}>
                      <input style={{ ...s.input, maxWidth:"200px" }} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                      <button style={s.btnGreen} onClick={() => saveEdit(acc.id)}>Save</button>
                      <button style={s.btnGhost} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={s.avatar(acc.id)}>{initials(acc.name)}</div>
                      <div>
                        <div style={{ fontWeight:"600", fontSize:"13px" }}>{acc.name}</div>
                        <div style={{ fontSize:"11px", color:"#94a3b8" }}>ID #{acc.id}</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontWeight:"700", fontSize:"14px", color: acc.balance >= 0 ? "#38a169" : "#e53e3e", minWidth:"80px", textAlign:"right" }}>${fmt(acc.balance)}</span>
                    {editingId !== acc.id && (
                      <>
                        <button style={s.btnBlue} onClick={() => { setTxAccountId(String(acc.id)); setActiveTab("deposit"); }}>Transact</button>
                        <button style={s.btnGhost} onClick={() => { setEditingId(acc.id); setEditName(acc.name); }}>Rename</button>
                        <button style={s.btnRed} onClick={() => deleteAccount(acc.id, acc.name)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "transactions" && (
          <div style={s.card}>
            <div style={s.cardHead}>
              <span style={s.cardTitle}>Transaction History</span>
              <span style={{ fontSize:"12px", color:"#94a3b8" }}>{filteredTx.length} records</span>
            </div>
            <div style={{ padding:"0.8rem 1.3rem", borderBottom:"1px solid #f1f5f9", display:"flex", gap:"8px" }}>
              <input style={s.input} placeholder="Search description..." value={searchTx} onChange={e => setSearchTx(e.target.value)} />
              <select style={s.select} value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                <option value="all">All accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {filteredTx.length === 0 && <div style={s.emptyState}>No transactions found</div>}
            {filteredTx.map((tx, i) => {
              const acc = accounts.find(a => a.id === tx.account_id);
              return (
                <div key={tx.id} style={{ ...s.txRow, ...(i === filteredTx.length-1 ? { borderBottom:"none" } : {}) }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={s.txIcon(tx.amount >= 0)}>{tx.amount >= 0 ? "↑" : "↓"}</div>
                    <div>
                      <div style={{ fontWeight:"600", fontSize:"13px" }}>{tx.desc}</div>
                      <div style={{ fontSize:"11px", color:"#94a3b8" }}>{acc?.name || `Acct #${tx.account_id}`} · {tx.date?.slice(0,16)}</div>
                    </div>
                  </div>
                  <span style={{ ...s.badge(tx.amount >= 0), fontSize:"12px" }}>{tx.amount >= 0 ? "+" : "−"}${fmt(Math.abs(tx.amount))}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "transfer" && (
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Account to Account Transfer</span></div>
            <div style={s.cardBody}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"1rem" }}>
                <div>
                  <label style={s.lbl}>From Account</label>
                  <select style={{ ...s.select, width:"100%" }} value={fromId} onChange={e => setFromId(e.target.value)}>
                    <option value="">Select account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — ${fmt(a.balance)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>To Account</label>
                  <select style={{ ...s.select, width:"100%" }} value={toId} onChange={e => setToId(e.target.value)}>
                    <option value="">Select account</option>
                    {accounts.filter(a => String(a.id) !== fromId).map(a => <option key={a.id} value={a.id}>{a.name} — ${fmt(a.balance)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label style={s.lbl}>Amount</label>
                <input style={{ ...s.input, width:"100%", boxSizing:"border-box" }} type="number" placeholder="Enter transfer amount" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
              </div>
              {fromId && toId && transferAmount && (
                <div style={{ background:"#f8fafc", borderRadius:"8px", padding:"12px 14px", marginBottom:"1rem", fontSize:"13px", color:"#4a5568", borderLeft:"3px solid #3182ce" }}>
                  <b>${fmt(transferAmount)}</b> will move from <b>{accounts.find(a=>String(a.id)===fromId)?.name}</b> → <b>{accounts.find(a=>String(a.id)===toId)?.name}</b>
                </div>
              )}
              <button style={{ ...s.btnPrimary, width:"100%", padding:"11px", fontSize:"14px" }} onClick={doTransfer} disabled={loading}>{loading ? "Processing..." : "Confirm Transfer"}</button>
            </div>
          </div>
        )}

        {activeTab === "deposit" && (
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Deposit / Withdrawal</span></div>
            <div style={s.cardBody}>
              <div style={{ marginBottom:"1rem" }}>
                <label style={s.lbl}>Account</label>
                <select style={{ ...s.select, width:"100%" }} value={txAccountId} onChange={e => setTxAccountId(e.target.value)}>
                  <option value="">Select account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — ${fmt(a.balance)}</option>)}
                </select>
              </div>
              <div style={{ ...s.segRow, marginBottom:"1rem" }}>
                <button style={s.seg(txType==="deposit")} onClick={() => setTxType("deposit")}>Deposit</button>
                <button style={s.seg(txType==="withdrawal")} onClick={() => setTxType("withdrawal")}>Withdrawal</button>
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label style={s.lbl}>Amount</label>
                <input style={{ ...s.input, width:"100%", boxSizing:"border-box" }} type="number" placeholder="Enter amount" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label style={s.lbl}>Description (optional)</label>
                <input style={{ ...s.input, width:"100%", boxSizing:"border-box" }} placeholder={txType === "deposit" ? "e.g. Salary, Cash deposit..." : "e.g. ATM withdrawal, Bill payment..."} value={txDesc} onChange={e => setTxDesc(e.target.value)} />
              </div>
              {txAccountId && txAmount && (
                <div style={{ background: txType==="deposit" ? "#f0fff4" : "#fff5f5", borderRadius:"8px", padding:"12px 14px", marginBottom:"1rem", fontSize:"13px", borderLeft:`3px solid ${txType==="deposit"?"#38a169":"#e53e3e"}`, color:"#4a5568" }}>
                  {txType === "deposit" ? "Adding" : "Deducting"} <b>${fmt(Math.abs(parseFloat(txAmount)||0))}</b> {txType==="deposit"?"to":"from"} <b>{accounts.find(a=>String(a.id)===txAccountId)?.name}</b>
                </div>
              )}
              <button style={{ ...(txType==="deposit" ? s.btnGreen : { ...s.btnPrimary, background:"#e53e3e" }), width:"100%", padding:"11px", fontSize:"14px" }} onClick={doTransaction} disabled={loading}>
                {loading ? "Processing..." : txType === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <div style={s.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}