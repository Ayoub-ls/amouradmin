import { useState, useEffect, useCallback } from "react";
import {
  Lock, Unlock, LogOut, Search, Trash2, TrendingUp,
  ShoppingCart, Package, DollarSign, MapPin, RotateCcw,
  Sparkles, Plus, Phone, CheckCircle, Clock, Send, XCircle,
  Truck, RefreshCw, Copy, Check, AlertCircle, Settings, Save
} from "lucide-react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://brrqjcmqnrctplqixlqh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_s3rAeTblm_QL0KyyeEdcsg_wxLHPT-9";
const TABLE_NAME = "orders";

// ─── DASHBOARD CONFIG ─────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "admin123";
const DEFAULT_PRICE = 2900;   // fallback price if source has no price set
const CLIENT_NAME = "Amourshop";
const PRICES_KEY = "source_prices"; // localStorage key

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const sbFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const db = {
  getAll: () => sbFetch(`${TABLE_NAME}?order=created_at.desc`),
  update: (id, data) => sbFetch(`${TABLE_NAME}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => sbFetch(`${TABLE_NAME}?id=eq.${id}`, { method: "DELETE" }),
  insert: (data) => sbFetch(TABLE_NAME, { method: "POST", body: JSON.stringify(data) }),
};

// ─── PRICE HELPERS ────────────────────────────────────────────────────────────
const loadPrices = () => {
  try { return JSON.parse(localStorage.getItem(PRICES_KEY) || "{}"); }
  catch { return {}; }
};
const savePrices = (p) => localStorage.setItem(PRICES_KEY, JSON.stringify(p));
const getPrice = (source, prices) => prices[source] || DEFAULT_PRICE;
const orderValue = (order, prices) => (order.quantity || 1) * getPrice(order.source, prices);

// ─── GTM PIXEL ────────────────────────────────────────────────────────────────
const fireGTMPurchase = (order, prices) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "purchase_cod_delivered",
      order_id: order.id,
      value: orderValue(order, prices),
      currency: "DZD",
      product: order.size || order.product_name || "product",
      customer_name: order.name,
      wilaya: order.city,
      source: order.source,
    });
  }
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_NAMES = ["حميد بوقرة", "ياسمين بوعلام", "أمين فرحات", "فاطمة الزهراء شريفي", "كريم بلحاج", "رضا بلقاسم", "ليلى ابراهيمي"];
const MOCK_PHONES = ["0550123456", "0661987654", "0772345678", "0560765432", "0699112233", "0790887766"];
const MOCK_WILAYAS = ["16 - الجزائر العاصمة", "31 - وهران", "25 - قسنطينة", "19 - سطيف", "09 - البليدة", "23 - عنابة", "13 - تلمسان"];
const MOCK_SIZES = ["(مقاس 6 سنوات x 1)", "(مقاس 8 سنوات x 2)", "(مقاس 4 سنوات x 1) + (مقاس 10 سنوات x 1)", "(مقاس 12 سنة x 1)"];
const MOCK_SOURCES = ["product-a", "product-b", "product-c"];

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS = {
  pending: { label: "في الانتظار", color: "yellow", Icon: Clock, gtm: false },
  confirmed: { label: "مؤكد", color: "blue", Icon: CheckCircle, gtm: false },
  shipped: { label: "تم الشحن", color: "indigo", Icon: Send, gtm: false },
  delivered: { label: "تم التسليم", color: "emerald", Icon: Truck, gtm: true },
  cancelled: { label: "ملغي", color: "red", Icon: XCircle, gtm: false },
};
const BADGE = {
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ─── PRICES PANEL ─────────────────────────────────────────────────────────────
function PricesPanel({ sources, prices, onSave }) {
  const [draft, setDraft] = useState({ ...prices });
  const [newSource, setNewSource] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [saved, setSaved] = useState(false);

  // auto-populate known sources with existing or default price
  useEffect(() => {
    const merged = { ...draft };
    sources.forEach(s => { if (!(s in merged)) merged[s] = DEFAULT_PRICE; });
    setDraft(merged);
  }, [sources]);

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = () => {
    const s = newSource.trim();
    const p = parseInt(newPrice);
    if (!s || !p) return;
    setDraft(prev => ({ ...prev, [s]: p }));
    setNewSource("");
    setNewPrice("");
  };

  const handleRemove = (s) => {
    const d = { ...draft };
    delete d[s];
    setDraft(d);
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4">
      <h4 className="font-extrabold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
        <Settings className="w-4 h-4 text-amber-400" />
        <span>أسعار الصفحات (سعر الوحدة لكل مصدر)</span>
      </h4>

      {/* Existing sources */}
      <div className="space-y-2">
        {Object.entries(draft).length === 0
          ? <p className="text-xs text-slate-500 py-2 text-center">لا توجد صفحات مسجلة بعد</p>
          : Object.entries(draft).map(([source, price]) => (
            <div key={source} className="flex items-center gap-2">
              <span className="flex-1 font-mono text-xs bg-slate-800 px-3 py-2 rounded-xl text-slate-300 truncate">{source}</span>
              <input
                type="number"
                value={price}
                onChange={e => setDraft(prev => ({ ...prev, [source]: parseInt(e.target.value) || 0 }))}
                className="w-28 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono font-bold text-amber-400 focus:ring-1 focus:ring-amber-500 outline-none text-center"
              />
              <span className="text-xs text-slate-500">DA</span>
              <button onClick={() => handleRemove(source)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer focus:outline-none">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        }
      </div>

      {/* Add new source manually */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        <input
          type="text" value={newSource}
          onChange={e => setNewSource(e.target.value)}
          placeholder="اسم الصفحة (source)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <input
          type="number" value={newPrice}
          onChange={e => setNewPrice(e.target.value)}
          placeholder="السعر"
          className="w-24 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-amber-400 focus:ring-1 focus:ring-amber-500 outline-none text-center"
        />
        <button onClick={handleAdd}
          className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer focus:outline-none">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-slate-500 bg-slate-800/50 rounded-xl p-3 leading-relaxed">
        السعر الافتراضي إذا لم يُحدَّد مصدر: <span className="text-amber-400 font-mono">{DEFAULT_PRICE} DA</span>
      </div>

      <button onClick={handleSave}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none">
        {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "تم الحفظ!" : "حفظ الأسعار"}
      </button>
    </div>
  );
}

// ─── SNIPPET MODAL ────────────────────────────────────────────────────────────
const buildSnippet = () => `<!--
  ORDER SUBMISSION SNIPPET
  Paste before </body> in every landing page.
  Change SOURCE to match your product name.
-->
<script>
const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_ANON_KEY}";
const SOURCE       = "product-a"; // ← change per landing page

async function submitOrder(orderData) {
  const payload = {
    name:         orderData.name,
    phone:        orderData.phone,
    city:         orderData.city,
    size:         orderData.size         || null,
    quantity:     orderData.quantity     || 1,
    product_name: orderData.product_name || SOURCE,
    source:       SOURCE,
    status:       "pending",
    created_at:   new Date().toISOString(),
  };
  const res = await fetch(\`\${SUPABASE_URL}/rest/v1/orders\`, {
    method: "POST",
    headers: {
      apikey:         SUPABASE_KEY,
      Authorization:  \`Bearer \${SUPABASE_KEY}\`,
      "Content-Type": "application/json",
      Prefer:         "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
// Usage:
// await submitOrder({ name, phone, city, size, quantity });
<\/script>

<!--
  SUPABASE TABLE (run once in SQL editor):
  create table orders (
    id           uuid primary key default gen_random_uuid(),
    name         text not null,
    phone        text not null,
    city         text,
    size         text,
    quantity     int default 1,
    product_name text,
    source       text,
    status       text default 'pending',
    created_at   timestamptz default now()
  );
  alter table orders enable row level security;
  create policy "allow all" on orders for all to anon using (true);
-->`;

function SnippetModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const snippet = buildSnippet();
  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="font-black text-white text-base">Landing Page Snippet</h3>
            <p className="text-xs text-slate-400 mt-0.5">Change SOURCE per product — prices are set in dashboard</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer focus:outline-none">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 rounded-xl p-2 cursor-pointer focus:outline-none">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <pre className="overflow-auto p-5 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap flex-1">{snippet}</pre>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ onGoBack }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showSnippet, setShowSnippet] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [pixelFlash, setPixelFlash] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("admin_authed") === "true") setIsAuthenticated(true);
    setPrices(loadPrices());
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders((await db.getAll()) || []); }
    catch { setError("فشل الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) loadOrders(); }, [isAuthenticated, loadOrders]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authed", "true");
    } else {
      alert("كلمة المرور خاطئة!");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authed");
  };

  const handleSavePrices = (updated) => {
    setPrices(updated);
    savePrices(updated);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await db.update(id, { status: newStatus });
      const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
      setOrders(updated);
      if (STATUS[newStatus]?.gtm) {
        const order = orders.find(o => o.id === id);
        if (order) {
          fireGTMPurchase({ ...order, status: newStatus }, prices);
          const val = orderValue({ ...order }, prices);
          setPixelFlash(`🔥 Purchase fired — ${order.name} — ${val.toLocaleString()} DA`);
          setTimeout(() => setPixelFlash(null), 4000);
        }
      }
    } catch { alert("خطأ في تحديث الحالة"); }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف هذه الطلبية نهائياً؟")) return;
    try { await db.delete(id); setOrders(orders.filter(o => o.id !== id)); }
    catch { alert("خطأ في الحذف"); }
  };

  const handleGenerateMock = async () => {
    const mocks = Array.from({ length: 5 }, (_, i) => ({
      name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
      phone: MOCK_PHONES[Math.floor(Math.random() * MOCK_PHONES.length)],
      city: MOCK_WILAYAS[Math.floor(Math.random() * MOCK_WILAYAS.length)],
      size: MOCK_SIZES[Math.floor(Math.random() * MOCK_SIZES.length)],
      quantity: Math.floor(Math.random() * 3) + 1,
      product_name: MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)],
      source: MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)],
      status: ["pending", "confirmed", "shipped", "delivered", "cancelled"][Math.floor(Math.random() * 5)],
      created_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    }));
    try { for (const m of mocks) await db.insert(m); await loadOrders(); }
    catch { alert("خطأ في توليد البيانات — تحقق من إعدادات Supabase"); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("مسح جميع الطلبيات نهائياً؟")) return;
    try { for (const o of orders) await db.delete(o.id); setOrders([]); }
    catch { alert("خطأ في المسح"); }
  };

  // ── Derived stats ──
  const activeOrders = orders.filter(o => o.status !== "cancelled");
  const totalRevenue = activeOrders.reduce((s, o) => s + orderValue(o, prices), 0);
  const totalItems = activeOrders.reduce((s, o) => s + (o.quantity || 1), 0);
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const deliveryRate = orders.length > 0 ? Math.round(deliveredCount / orders.length * 100) : 0;

  const sources = [...new Set(orders.map(o => o.source).filter(Boolean))];

  const wilayaDist = {};
  orders.forEach(o => {
    if (!o.city) return;
    const n = o.city.replace(/^\d+\s*-\s*/, "");
    wilayaDist[n] = (wilayaDist[n] || 0) + 1;
  });
  const topWilayas = Object.entries(wilayaDist).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const maxW = topWilayas[0]?.count || 1;

  // Revenue per source
  const sourceDist = {};
  orders.filter(o => o.status !== "cancelled").forEach(o => {
    if (!o.source) return;
    sourceDist[o.source] = (sourceDist[o.source] || 0) + orderValue(o, prices);
  });
  const topSources = Object.entries(sourceDist).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  const maxS = topSources[0]?.revenue || 1;

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.name?.toLowerCase().includes(q) || o.phone?.includes(q) || o.city?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSource = sourceFilter === "all" || o.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  // ── LOGIN ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden" style={{ fontFamily: "'Cairo',sans-serif" }}>
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full bg-emerald-700/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-emerald-800/10 blur-3xl" />
        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl z-10 text-right space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">لوحة تحكم المشرف</h2>
            <p className="text-xs text-slate-400">{CLIENT_NAME} — نظام إدارة الطلبات</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="password" value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono text-center tracking-widest"
              placeholder="••••••••" />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer focus:outline-none">
              <Unlock className="w-5 h-5" /><span>دخول لوحة التحكم</span>
            </button>
          </form>
          {onGoBack && (
            <button onClick={onGoBack} className="w-full text-xs text-slate-400 hover:text-white transition-all underline cursor-pointer text-center pt-2 border-t border-slate-700">
              العودة للمتجر
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12" style={{ fontFamily: "'Cairo',sans-serif", direction: "rtl" }}>

      {showSnippet && <SnippetModal onClose={() => setShowSnippet(false)} />}

      {pixelFlash && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />{pixelFlash}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="text-lg font-black text-white leading-none">{CLIENT_NAME}</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Manager — Supabase</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPrices(v => !v)}
            className={`hidden sm:flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:outline-none border ${showPrices ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400"}`}>
            <Settings className="w-3.5 h-3.5" /><span>أسعار الصفحات</span>
          </button>
          <button onClick={() => setShowSnippet(true)}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:outline-none">
            <Copy className="w-3.5 h-3.5" /><span>Snippet</span>
          </button>
          <button onClick={loadOrders}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer focus:outline-none">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none border border-red-500/20">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8 text-right">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">{error}</p>
              <p className="text-xs text-red-400/70 mt-0.5">تأكد من إعداد SUPABASE_URL و SUPABASE_ANON_KEY في الكود</p>
            </div>
          </div>
        )}

        {/* Prices Panel — collapsible */}
        {showPrices && (
          <PricesPanel sources={sources} prices={prices} onSave={handleSavePrices} />
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي المبيعات", value: `${totalRevenue.toLocaleString()} DA`, color: "emerald", Icon: DollarSign },
            { label: "إجمالي الطلبات", value: orders.length, color: "blue", Icon: ShoppingCart },
            { label: "القطع المباعة", value: totalItems, color: "amber", Icon: Package },
            { label: "معدل التسليم", value: `${deliveryRate}%`, color: "indigo", Icon: TrendingUp },
          ].map(({ label, value, color, Icon: I }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold">{label}</span>
                <h3 className={`text-xl font-black font-mono leading-none pt-1 text-${color}-400`}>{value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center shrink-0 border border-${color}-500/20`}>
                <I className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Wilaya */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin className="w-4 h-4 text-emerald-400" /><span>أعلى الولايات طلباً</span>
            </h4>
            {topWilayas.length === 0
              ? <p className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات بعد</p>
              : topWilayas.map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 font-mono">({w.count})</span>
                    <span className="text-white">{w.name}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(w.count / maxW * 100)}%` }} />
                  </div>
                </div>
              ))
            }
          </div>

          {/* Revenue per source */}
          <div className="md:col-span-4 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-indigo-400" /><span>مبيعات كل صفحة (DA)</span>
            </h4>
            {topSources.length === 0
              ? <p className="text-slate-500 text-xs py-4 text-center">لا توجد مصادر بعد</p>
              : topSources.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-400 font-mono">{s.revenue.toLocaleString()} DA</span>
                    <span className="text-white font-mono">{s.name}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-indigo-500 to-violet-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(s.revenue / maxS * 100)}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-500 text-left font-mono">
                    سعر الوحدة: {(prices[s.name] || DEFAULT_PRICE).toLocaleString()} DA
                  </div>
                </div>
              ))
            }
          </div>

          {/* Tools */}
          <div className="md:col-span-3 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" /><span>أدوات</span>
            </h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowPrices(v => !v)}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none">
                <Settings className="w-3.5 h-3.5" /><span>إعداد أسعار الصفحات</span>
              </button>
              <button onClick={() => setShowSnippet(true)}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none">
                <Copy className="w-3.5 h-3.5" /><span>Get Snippet</span>
              </button>
              <button onClick={handleGenerateMock}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none">
                <Plus className="w-3.5 h-3.5" /><span>بيانات تجريبية</span>
              </button>
              <button onClick={handleClearAll}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none">
                <RotateCcw className="w-3.5 h-3.5" /><span>مسح كل البيانات</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-lg space-y-5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-4">
            <h4 className="font-black text-lg text-white">سجل الطلبيات</h4>
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-stretch justify-end">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute top-1/2 right-3 -translate-y-1/2" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-9 pl-4 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none text-white w-48"
                  placeholder="ابحث..." />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none text-white appearance-none">
                <option value="all">كل الحالات</option>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none text-white appearance-none">
                <option value="all">كل الصفحات</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">الزبون</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">الولاية</th>
                  <th className="px-4 py-3">المنتج / المقاس</th>
                  <th className="px-4 py-3">الكمية</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الصفحة</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-left">تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr><td colSpan="9" className="px-4 py-10 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />جاري التحميل...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9" className="px-4 py-10 text-center text-slate-500">لا توجد نتائج</td></tr>
                ) : filtered.map(order => {
                  const st = STATUS[order.status] || STATUS.pending;
                  const StI = st.Icon;
                  const val = orderValue(order, prices);
                  return (
                    <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-white whitespace-nowrap">{order.name}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${order.phone}`} className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono [direction:ltr] justify-end">
                          <span>{order.phone}</span><Phone className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.city}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate">{order.size || order.product_name}</td>
                      <td className="px-4 py-3 font-black font-mono text-center text-amber-500">{order.quantity}</td>
                      <td className="px-4 py-3 font-black font-mono text-emerald-400 whitespace-nowrap">{val.toLocaleString()} DA</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-1 rounded-lg text-slate-400">{order.source || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${BADGE[st.color]}`}>
                          <StI className="w-3 h-3" />{st.label}
                          {st.gtm && <span className="text-[9px] opacity-70 ml-0.5">GTM✓</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-start">
                          <select value={order.status}
                            onChange={e => handleUpdateStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[10px] font-bold focus:ring-1 focus:ring-emerald-500 outline-none text-white appearance-none disabled:opacity-50">
                            {Object.entries(STATUS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}{v.gtm ? " 🔥" : ""}</option>
                            ))}
                          </select>
                          <button onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer focus:outline-none">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 text-left">
            {filtered.length} طلبية | 🔥 "تم التسليم" يُشغّل Purchase pixel في GTM بالسعر الصحيح لكل صفحة
          </p>
        </div>
      </main>
    </div>
  );
}
