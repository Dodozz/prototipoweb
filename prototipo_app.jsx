import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  ScanLine,
  CreditCard,
  Banknote,
  Trash2,
  Plus,
  Minus,
  Package,
  BarChart3,
  FileDown,
  ShieldCheck,
  Database,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  X,
  Receipt,
  TrendingUp,
  TrendingDown,
  Settings,
} from "lucide-react";

/**
 * Prototipo: "El Regalo Perfecto, S.A." — POS + Inventario
 * Enfoque: RUF-01..09 y RNFU/RNSF (costo bajo, equipos modestos, seguridad, robustez)
 * Nota: Es un prototipo front-end (sin backend real). Persiste en localStorage.
 */

// ------------------------------
// Utilidades
// ------------------------------
const fmtMoney = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(n || 0)
  );

const fmtDateTime = (d) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}_${Date.now()}`);

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignorar
    }
  }, [key, value]);

  return [value, setValue];
}

// Export CSV (para “Exportar a hojas de cálculo” estilo prototipo)
function downloadCSV(filename, rows) {
  const escapeCell = (cell) => {
    const s = String(cell ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------
// Datos de ejemplo
// ------------------------------
const demoProducts = [
  {
    id: "sku-001",
    sku: "SKU-001",
    name: "Taza personalizada",
    category: "Hogar",
    cost: 55,
    price: 149,
    stock: 18,
    reorder: 5,
    active: true,
  },
  {
    id: "sku-002",
    sku: "SKU-002",
    name: "Caja de regalo premium",
    category: "Empaque",
    cost: 30,
    price: 89,
    stock: 40,
    reorder: 10,
    active: true,
  },
  {
    id: "sku-003",
    sku: "SKU-003",
    name: "Peluche mediano",
    category: "Peluches",
    cost: 90,
    price: 219,
    stock: 9,
    reorder: 6,
    active: true,
  },
  {
    id: "sku-004",
    sku: "SKU-004",
    name: "Tarjeta de felicitación",
    category: "Papelería",
    cost: 6,
    price: 25,
    stock: 120,
    reorder: 30,
    active: true,
  },
  {
    id: "sku-005",
    sku: "SKU-005",
    name: "Vela aromática",
    category: "Hogar",
    cost: 65,
    price: 165,
    stock: 0,
    reorder: 8,
    active: true,
  },
];

// ------------------------------
// Componentes UI (Tailwind)
// ------------------------------
const Card = ({ className = "", children }) => (
  <div
    className={
      "rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl " +
      className
    }
  >
    {children}
  </div>
);

const Badge = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-white/10 text-white/90",
    success: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    warn: "bg-amber-500/15 text-amber-200 border-amber-400/20",
    danger: "bg-rose-500/15 text-rose-200 border-rose-400/20",
    info: "bg-sky-500/15 text-sky-200 border-sky-400/20",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium " +
        (tones[tone] || tones.neutral)
      }
    >
      {children}
    </span>
  );
};

const Button = ({
  variant = "primary",
  className = "",
  disabled,
  onClick,
  children,
  type = "button",
}) => {
  const variants = {
    primary:
      "bg-white text-slate-950 hover:bg-white/90 shadow-[0_10px_25px_-15px_rgba(255,255,255,0.6)]",
    ghost:
      "bg-white/5 text-white hover:bg-white/10 border border-white/10",
    danger:
      "bg-rose-500/90 text-white hover:bg-rose-500 shadow-[0_10px_25px_-15px_rgba(244,63,94,0.6)]",
    success:
      "bg-emerald-500/90 text-white hover:bg-emerald-500 shadow-[0_10px_25px_-15px_rgba(16,185,129,0.6)]",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 " +
        (variants[variant] || variants.primary) +
        " " +
        className
      }
    >
      {children}
    </button>
  );
};

const Input = React.forwardRef(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none ring-0 transition focus:border-white/20 focus:bg-white/7.5 " +
        className
      }
    />
  );
});

const Select = ({ className = "", ...props }) => (
  <select
    {...props}
    className={
      "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/7.5 " +
      className
    }
  />
);

function Modal({ open, title, subtitle, children, onClose, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl backdrop-blur-xl"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <div className="text-lg font-bold text-white">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-white/60">{subtitle}</div>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer ? (
              <div className="border-t border-white/10 p-5">{footer}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ------------------------------
// App principal
// ------------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState("pos"); // pos | inventory | reports

  const [products, setProducts] = useLocalStorage("rp_products_v1", demoProducts);
  const [sales, setSales] = useLocalStorage("rp_sales_v1", []);

  // POS state
  const [cart, setCart] = useState([]); // {productId, qty, unitPrice}
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState("cash"); // cash | card
  const [cashGiven, setCashGiven] = useState("");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (kind, title, message) => {
    setToast({ kind, title, message, id: uid() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // Inventory modals
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState("create"); // create | update
  const [editItem, setEditItem] = useState(null);

  // Reports filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeName, setStoreName] = useLocalStorage(
    "rp_store_name_v1",
    "El regalo perfecto, S.A."
  );
  const [clerkName, setClerkName] = useLocalStorage("rp_clerk_name_v1", "Caja 1");

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.active && p.stock <= p.reorder).length;
  }, [products]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter((p) => {
      const hay = `${p.sku} ${p.name} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeProducts, search]);

  const cartLines = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return cart
      .map((c) => {
        const p = map.get(c.productId);
        if (!p) return null;
        const unit = c.unitPrice ?? p.price;
        const lineTotal = unit * c.qty;
        const lineProfit = (unit - p.cost) * c.qty;
        return {
          ...c,
          product: p,
          unit,
          lineTotal,
          lineProfit,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const totals = useMemo(() => {
    const subtotal = cartLines.reduce((a, l) => a + l.lineTotal, 0);
    const profit = cartLines.reduce((a, l) => a + l.lineProfit, 0);
    const items = cartLines.reduce((a, l) => a + l.qty, 0);
    return { subtotal, profit, items };
  }, [cartLines]);

  const change = useMemo(() => {
    const given = Number(cashGiven || 0);
    return payMethod === "cash" ? given - totals.subtotal : 0;
  }, [cashGiven, payMethod, totals.subtotal]);

  // ------------------------------
  // Acciones POS
  // ------------------------------
  const addToCart = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (!p.active) {
      notify("warn", "Producto inactivo", "Activa el producto para venderlo.");
      return;
    }
    if (p.stock <= 0) {
      notify(
        "danger",
        "Sin stock",
        "Este producto no tiene stock disponible."
      );
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        const desired = next[idx].qty + 1;
        if (desired > p.stock) {
          notify(
            "warn",
            "Stock insuficiente",
            `Solo hay ${p.stock} unidades disponibles.`
          );
          return prev;
        }
        next[idx] = { ...next[idx], qty: desired };
        return next;
      }
      return [...prev, { productId, qty: 1, unitPrice: p.price }];
    });
  };

  const setQty = (productId, qty) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const safe = clamp(qty, 1, p.stock);
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId ? { ...c, qty: safe } : c
      )
    );
  };

  const removeLine = (productId) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven("");
    setPayMethod("cash");
  };

  const checkout = () => {
    if (cartLines.length === 0) {
      notify("warn", "Carrito vacío", "Agrega productos para registrar una venta.");
      return;
    }
    // Validar stock
    for (const line of cartLines) {
      if (line.qty > line.product.stock) {
        notify(
          "danger",
          "Stock cambió",
          `"${line.product.name}" tiene solo ${line.product.stock} en stock.`
        );
        return;
      }
    }
    // Validar efectivo
    if (payMethod === "cash") {
      const given = Number(cashGiven || 0);
      if (!Number.isFinite(given) || given < totals.subtotal) {
        notify(
          "warn",
          "Efectivo insuficiente",
          "Ingresa el monto recibido para calcular el cambio."
        );
        return;
      }
    }

    const sale = {
      id: uid(),
      at: Date.now(),
      clerk: clerkName,
      method: payMethod,
      items: cartLines.map((l) => ({
        productId: l.productId,
        sku: l.product.sku,
        name: l.product.name,
        qty: l.qty,
        unit: l.unit,
        total: l.lineTotal,
        profit: l.lineProfit,
      })),
      subtotal: totals.subtotal,
      profit: totals.profit,
      cashGiven: payMethod === "cash" ? Number(cashGiven || 0) : null,
      change: payMethod === "cash" ? change : null,
    };

    // Simulación de transacción/robustez (RNSF-02/03):
    // aplicamos una actualización atómica: 1) descontar stock 2) registrar venta.
    try {
      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, { ...p }]));
        for (const it of sale.items) {
          const p = map.get(it.productId);
          if (!p) continue;
          p.stock = Math.max(0, p.stock - it.qty);
        }
        return Array.from(map.values());
      });
      setSales((prev) => [sale, ...prev]);
      notify(
        "success",
        "Venta registrada",
        `Total: ${fmtMoney(sale.subtotal)} • ${sale.method === "cash" ? `Cambio: ${fmtMoney(sale.change)}` : "Tarjeta"}`
      );
      clearCart();
    } catch {
      notify(
        "danger",
        "Error",
        "Ocurrió un problema al registrar la venta. Intenta de nuevo."
      );
    }
  };

  // ------------------------------
  // Acciones Inventario
  // ------------------------------
  const openCreate = () => {
    setEditMode("create");
    setEditItem({
      id: uid(),
      sku: "SKU-" + Math.random().toString(10).slice(2, 5),
      name: "",
      category: "General",
      cost: 0,
      price: 0,
      stock: 0,
      reorder: 0,
      active: true,
    });
    setEditOpen(true);
  };

  const openUpdate = (p) => {
    setEditMode("update");
    setEditItem({ ...p });
    setEditOpen(true);
  };

  const saveProduct = () => {
    const p = editItem;
    if (!p) return;
    const nameOk = p.name?.trim().length >= 2;
    const skuOk = p.sku?.trim().length >= 3;
    const priceOk = Number(p.price) >= 0;
    const costOk = Number(p.cost) >= 0;
    if (!nameOk || !skuOk || !priceOk || !costOk) {
      notify(
        "warn",
        "Datos incompletos",
        "Verifica SKU, nombre, costo y precio."
      );
      return;
    }

    setProducts((prev) => {
      const existsSku = prev.some(
        (x) => x.sku.toLowerCase() === p.sku.toLowerCase() && x.id !== p.id
      );
      if (existsSku) {
        notify(
          "danger",
          "SKU duplicado",
          "Ya existe un producto con ese SKU."
        );
        return prev;
      }
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...p, cost: Number(p.cost), price: Number(p.price) };
        return next;
      }
      return [...prev, { ...p, cost: Number(p.cost), price: Number(p.price) }];
    });

    notify(
      "success",
      editMode === "create" ? "Producto creado" : "Producto actualizado",
      p.name
    );
    setEditOpen(false);
  };

  // RUF-09: eliminar productos sin stock y sin reposición
  const archiveIfEligible = (p) => {
    if (p.stock === 0 && (p.reorder ?? 0) === 0) {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, active: false } : x))
      );
      notify("success", "Producto desactivado", "Se ocultará en ventas.");
    } else {
      notify(
        "warn",
        "No cumple condiciones",
        "Solo se puede desactivar si stock=0 y reposición=0."
      );
    }
  };

  const resetDemo = () => {
    setProducts(demoProducts);
    setSales([]);
    clearCart();
    notify("info", "Datos restablecidos", "Se cargaron productos de ejemplo.");
  };

  // ------------------------------
  // Reportes
  // ------------------------------
  const filteredSales = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return sales.filter((s) => {
      if (from != null && s.at < from) return false;
      if (to != null && s.at > to) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  const todayKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);

  const todaySales = useMemo(() => {
    const start = new Date(todayKey).getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;
    return sales.filter((s) => s.at >= start && s.at <= end);
  }, [sales, todayKey]);

  const salesSummary = useMemo(() => {
    const list = filteredSales;
    const total = list.reduce((a, s) => a + s.subtotal, 0);
    const profit = list.reduce((a, s) => a + s.profit, 0);
    const count = list.length;
    const items = list.reduce(
      (a, s) => a + s.items.reduce((b, it) => b + it.qty, 0),
      0
    );
    return { total, profit, count, items };
  }, [filteredSales]);

  const productPerformance = useMemo(() => {
    // Agrega por producto: qty y profit
    const agg = new Map();
    for (const s of filteredSales) {
      for (const it of s.items) {
        const key = it.productId;
        const prev = agg.get(key) || { qty: 0, profit: 0, revenue: 0 };
        agg.set(key, {
          qty: prev.qty + it.qty,
          profit: prev.profit + it.profit,
          revenue: prev.revenue + it.total,
        });
      }
    }
    const mapP = new Map(products.map((p) => [p.id, p]));
    const rows = Array.from(agg.entries()).map(([id, v]) => {
      const p = mapP.get(id);
      return {
        id,
        sku: p?.sku || "—",
        name: p?.name || "Producto eliminado",
        qty: v.qty,
        revenue: v.revenue,
        profit: v.profit,
      };
    });
    rows.sort((a, b) => b.profit - a.profit);
    const top = rows.slice(0, 5);
    const bottom = rows
      .slice()
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 5);
    return { rows, top, bottom };
  }, [filteredSales, products]);

  const exportToday = () => {
    const rows = [
      ["id", "fecha", "cajero", "metodo", "total", "utilidad"],
      ...todaySales.map((s) => [
        s.id,
        fmtDateTime(s.at),
        s.clerk,
        s.method,
        s.subtotal,
        s.profit,
      ]),
    ];
    downloadCSV(`ventas_hoy_${todayKey}.csv`, rows);
  };

  const exportRange = () => {
    const label = `${dateFrom || "inicio"}_${dateTo || "fin"}`;
    const rows = [
      ["id", "fecha", "cajero", "metodo", "total", "utilidad"],
      ...filteredSales.map((s) => [
        s.id,
        fmtDateTime(s.at),
        s.clerk,
        s.method,
        s.subtotal,
        s.profit,
      ]),
    ];
    downloadCSV(`ventas_${label}.csv`, rows);
  };

  const exportProducts = () => {
    const rows = [
      [
        "sku",
        "nombre",
        "categoria",
        "costo",
        "precio",
        "stock",
        "reorden",
        "activo",
      ],
      ...products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.cost,
        p.price,
        p.stock,
        p.reorder,
        p.active ? "SI" : "NO",
      ]),
    ];
    downloadCSV("inventario_productos.csv", rows);
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Background />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight md:text-2xl">
                  {storeName}
                </h1>
                {lowStockCount > 0 ? (
                  <Badge tone="warn">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {lowStockCount} bajo stock
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Stock OK
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-white/60">
                Prototipo POS + Inventario • Bajo costo • Operación rápida
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
            <Button variant="ghost" onClick={resetDemo}>
              <RefreshCcw className="h-4 w-4" />
              Restablecer demo
            </Button>
            <Button variant="ghost" onClick={exportProducts}>
              <FileDown className="h-4 w-4" />
              Exportar inventario
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          <Tab
            icon={ShoppingCart}
            title="Punto de venta"
            desc="Registrar ventas y cobros"
            active={activeTab === "pos"}
            onClick={() => setActiveTab("pos")}
          />
          <Tab
            icon={Package}
            title="Inventario"
            desc="Altas, bajas y stock"
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
          />
          <Tab
            icon={BarChart3}
            title="Reportes"
            desc="Ventas y utilidades"
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
          />
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === "pos" ? (
            <POS
              products={products}
              filteredProducts={filteredProducts}
              cartLines={cartLines}
              totals={totals}
              search={search}
              setSearch={setSearch}
              addToCart={addToCart}
              setQty={setQty}
              removeLine={removeLine}
              clearCart={clearCart}
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              cashGiven={cashGiven}
              setCashGiven={setCashGiven}
              change={change}
              checkout={checkout}
              notify={notify}
            />
          ) : null}

          {activeTab === "inventory" ? (
            <Inventory
              products={products}
              setProducts={setProducts}
              openCreate={openCreate}
              openUpdate={openUpdate}
              archiveIfEligible={archiveIfEligible}
            />
          ) : null}

          {activeTab === "reports" ? (
            <Reports
              todayKey={todayKey}
              todaySales={todaySales}
              exportToday={exportToday}
              dateFrom={dateFrom}
              dateTo={dateTo}
              setDateFrom={setDateFrom}
              setDateTo={setDateTo}
              salesSummary={salesSummary}
              productPerformance={productPerformance}
              exportRange={exportRange}
            />
          ) : null}
        </div>
      </div>

      {/* Modales */}
      <Modal
        open={editOpen}
        title={editMode === "create" ? "Nuevo producto" : "Editar producto"}
        subtitle="Gestión de stock (RUF-01)"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/55">
              Tip: Mantén el SKU único para facilitar la selección durante la venta.
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button variant="success" onClick={saveProduct}>
                <CheckCircle2 className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </div>
        }
      >
        {editItem ? (
          <ProductForm item={editItem} setItem={setEditItem} />
        ) : null}
      </Modal>

      <Modal
        open={settingsOpen}
        title="Configuración" 
        subtitle="Preferencias del prototipo (no funcional)"
        onClose={() => setSettingsOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold">Nombre de la tienda</div>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            <div className="mt-1 text-xs text-white/55">
              Se muestra en el encabezado.
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold">Cajero / Terminal</div>
            <Input value={clerkName} onChange={(e) => setClerkName(e.target.value)} />
            <div className="mt-1 text-xs text-white/55">
              Se guarda en ventas como responsable.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">
              <ShieldCheck className="h-3.5 w-3.5" />
              Seguridad
            </Badge>
            <Badge tone="neutral">
              <Database className="h-3.5 w-3.5" />
              Transaccional
            </Badge>
            <Badge tone="neutral">
              <RefreshCcw className="h-3.5 w-3.5" />
              Recuperación
            </Badge>
          </div>
          <p className="text-sm text-white/70">
            Este prototipo simula principios no funcionales: control de acceso (conceptual),
            registro de transacciones y actualizaciones atómicas de inventario al registrar
            una venta.
          </p>
        </div>
      </Modal>

      {/* Toast */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="fixed bottom-4 left-1/2 z-[60] w-[min(560px,calc(100%-2rem))] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {toast.kind === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : toast.kind === "danger" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : toast.kind === "warn" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{toast.title}</div>
                  <div className="mt-0.5 text-sm text-white/70">
                    {toast.message}
                  </div>
                </div>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setToast(null)}
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Key shortcuts */}
      <KeyboardHelp notify={notify} />
    </div>
  );

  // --- helpers ---
  function ProductForm({ item, setItem }) {
    const set = (patch) => setItem((prev) => ({ ...prev, ...patch }));
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-semibold">SKU</div>
          <Input value={item.sku} onChange={(e) => set({ sku: e.target.value })} />
          <div className="mt-1 text-xs text-white/55">
            Identificador para búsqueda rápida.
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Categoría</div>
          <Input
            value={item.category}
            onChange={(e) => set({ category: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1 text-sm font-semibold">Nombre del producto</div>
          <Input value={item.name} onChange={(e) => set({ name: e.target.value })} />
        </div>

        <div>
          <div className="mb-1 text-sm font-semibold">Costo (MXN)</div>
          <Input
            type="number"
            value={item.cost}
            onChange={(e) => set({ cost: e.target.value })}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Precio (MXN)</div>
          <Input
            type="number"
            value={item.price}
            onChange={(e) => set({ price: e.target.value })}
          />
        </div>

        <div>
          <div className="mb-1 text-sm font-semibold">Stock</div>
          <Input
            type="number"
            value={item.stock}
            onChange={(e) => set({ stock: Number(e.target.value) })}
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Punto de reorden</div>
          <Input
            type="number"
            value={item.reorder}
            onChange={(e) => set({ reorder: Number(e.target.value) })}
          />
          <div className="mt-1 text-xs text-white/55">
            Para alertas de bajo stock.
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.active}
              onChange={(e) => set({ active: e.target.checked })}
            />
            <span className="text-sm">Producto activo (visible en ventas)</span>
          </label>
        </div>
      </div>
    );
  }
}

function Tab({ icon: Icon, title, desc, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition " +
        (active
          ? "bg-white text-slate-950"
          : "bg-transparent text-white hover:bg-white/5")
      }
    >
      <div
        className={
          "grid h-9 w-9 place-items-center rounded-xl border transition " +
          (active
            ? "border-white/40 bg-white/90"
            : "border-white/10 bg-white/5 group-hover:border-white/15")
        }
      >
        <Icon className={"h-4 w-4 " + (active ? "text-slate-950" : "")} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold">{title}</div>
        <div className={"truncate text-xs " + (active ? "text-slate-700" : "text-white/60")}>
          {desc}
        </div>
      </div>
    </button>
  );
}

function POS({
  products,
  filteredProducts,
  cartLines,
  totals,
  search,
  setSearch,
  addToCart,
  setQty,
  removeLine,
  clearCart,
  payMethod,
  setPayMethod,
  cashGiven,
  setCashGiven,
  change,
  checkout,
  notify,
}) {
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      // Ctrl/Cmd + K => focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Enter => checkout
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        checkout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkout]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: products */}
      <Card className="lg:col-span-2">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black">Punto de venta</div>
            <div className="mt-1 text-sm text-white/60">
              Selección rápida de artículos (RUF-04) y registro de ventas (RUF-02).
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU, nombre o categoría (Ctrl+K)"
                className="pl-9"
              />
            </div>
            <Button variant="ghost" onClick={() => notify("info", "Atajos", "Ctrl+K buscar • Ctrl+Enter cobrar")}
            >
              <ScanLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((p) => {
              const low = p.stock <= p.reorder;
              const out = p.stock <= 0;
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => addToCart(p.id)}
                  disabled={out}
                  className={
                    "group relative overflow-hidden rounded-2xl border p-4 text-left transition " +
                    (out
                      ? "border-white/10 bg-white/5 opacity-60"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/7.5")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">
                        {p.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                          {p.sku}
                        </span>
                        <span className="text-xs text-white/60">{p.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">{fmtMoney(p.price)}</div>
                      <div className="mt-1 text-xs text-white/55">
                        Utilidad: {fmtMoney(p.price - p.cost)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {out ? (
                        <Badge tone="danger">Sin stock</Badge>
                      ) : low ? (
                        <Badge tone="warn">Bajo stock</Badge>
                      ) : (
                        <Badge tone="success">Disponible</Badge>
                      )}
                    </div>
                    <div className="text-xs text-white/60">Stock: {p.stock}</div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  </div>
                </motion.button>
              );
            })}
          </div>
          {filteredProducts.length === 0 ? (
            <div className="mt-8 text-center text-sm text-white/60">
              No hay productos que coincidan con tu búsqueda.
            </div>
          ) : null}
        </div>
      </Card>

      {/* Right: cart */}
      <Card>
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-black">Carrito</div>
              <div className="mt-1 text-sm text-white/60">
                Control de stock en cada venta.
              </div>
            </div>
            <Badge tone={totals.items > 0 ? "info" : "neutral"}>
              <ShoppingCart className="h-3.5 w-3.5" />
              {totals.items} artículos
            </Badge>
          </div>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-auto p-5">
          {cartLines.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <Receipt className="h-6 w-6 text-white/70" />
              <div className="text-sm font-semibold">Agrega productos</div>
              <div className="text-xs text-white/60">
                Tip: Busca por SKU para una selección más rápida.
              </div>
            </div>
          ) : null}

          {cartLines.map((l) => (
            <div
              key={l.productId}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    {l.product.name}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {l.product.sku} • {fmtMoney(l.unit)} c/u
                  </div>
                </div>
                <button
                  onClick={() => removeLine(l.productId)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(l.productId, l.qty - 1)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                    aria-label="Menos"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="min-w-[44px] text-center text-sm font-bold">
                    {l.qty}
                  </div>
                  <button
                    onClick={() => setQty(l.productId, l.qty + 1)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                    aria-label="Más"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black">{fmtMoney(l.lineTotal)}</div>
                  <div className="mt-0.5 text-xs text-white/55">
                    Utilidad: {fmtMoney(l.lineProfit)}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-white/55">
                Stock disponible: {l.product.stock}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t border-white/10 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Total</span>
              <span className="text-lg font-black">{fmtMoney(totals.subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-white/60">
              <span>Utilidad estimada</span>
              <span>{fmtMoney(totals.profit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayMethod("cash")}
              className={
                "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition " +
                (payMethod === "cash"
                  ? "border-white/30 bg-white text-slate-950"
                  : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <Banknote className="h-4 w-4" />
              Efectivo
            </button>
            <button
              onClick={() => setPayMethod("card")}
              className={
                "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition " +
                (payMethod === "card"
                  ? "border-white/30 bg-white text-slate-950"
                  : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <CreditCard className="h-4 w-4" />
              Tarjeta
            </button>
          </div>

          {payMethod === "cash" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm font-bold">Efectivo recibido</div>
              <Input
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="Ingresa el monto"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                <span>Cambio</span>
                <span className={change < 0 ? "text-rose-200" : ""}>
                  {fmtMoney(change)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Cobro con tarjeta seleccionado.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="flex-1" onClick={clearCart}>
              Limpiar
            </Button>
            <Button variant="primary" className="flex-1" onClick={checkout}>
              <CheckCircle2 className="h-4 w-4" />
              Cobrar
            </Button>
          </div>

          <div className="text-xs text-white/50">
            Ctrl+Enter para cobrar. Validaciones evitan vender sin stock.
          </div>
        </div>
      </Card>
    </div>
  );
}

function Inventory({ products, setProducts, openCreate, openUpdate, archiveIfEligible }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive | low

  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = products;
    if (filter === "active") list = list.filter((p) => p.active);
    if (filter === "inactive") list = list.filter((p) => !p.active);
    if (filter === "low") list = list.filter((p) => p.active && p.stock <= p.reorder);
    if (!qq) return list;
    return list.filter((p) => `${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(qq));
  }, [products, q, filter]);

  const adjustStock = (id, delta) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black">Inventario</div>
            <div className="mt-1 text-sm text-white/60">
              Altas, bajas y modificaciones (RUF-01). Desactivar sin stock (RUF-09).
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" className="pl-9" />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="low">Bajo stock</option>
              </Select>
            </div>
            <Button variant="success" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs text-white/70">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Costo</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Reorden</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {view.map((p) => {
                  const low = p.stock <= p.reorder && p.active;
                  return (
                    <tr key={p.id} className="border-t border-white/10">
                      <td className="p-3">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                          {p.sku}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold">{p.name}</div>
                        <div className="text-xs text-white/55">Utilidad: {fmtMoney(p.price - p.cost)}</div>
                      </td>
                      <td className="p-3 text-white/80">{p.category}</td>
                      <td className="p-3 text-white/80">{fmtMoney(p.cost)}</td>
                      <td className="p-3 text-white/80">{fmtMoney(p.price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => adjustStock(p.id, -1)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10" aria-label="-1">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[28px] text-center font-bold">{p.stock}</span>
                          <button onClick={() => adjustStock(p.id, +1)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10" aria-label="+1">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {low ? <div className="mt-1 text-xs text-amber-200">Bajo stock</div> : null}
                      </td>
                      <td className="p-3 text-white/80">{p.reorder}</td>
                      <td className="p-3">
                        {p.active ? (
                          <Badge tone={low ? "warn" : "success"}>{low ? "Alerta" : "Activo"}</Badge>
                        ) : (
                          <Badge tone="neutral">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="ghost" className="px-3 py-1.5" onClick={() => openUpdate(p)}>
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5"
                            onClick={() => archiveIfEligible(p)}
                          >
                            Desactivar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {view.length === 0 ? (
            <div className="mt-6 text-center text-sm text-white/60">
              No se encontraron productos.
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">Regla de baja (RUF-09)</div>
            <div className="mt-1 text-sm text-white/60">
              Un producto puede desactivarse si: <span className="font-semibold">stock=0</span> y <span className="font-semibold">reposición=0</span>.
            </div>
          </div>
          <Badge tone="info">
            <Filter className="h-3.5 w-3.5" />
            Depuración de inventario
          </Badge>
        </div>
      </Card>
    </div>
  );
}

function Reports({
  todayKey,
  todaySales,
  exportToday,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  salesSummary,
  productPerformance,
  exportRange,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black">Reportes</div>
            <div className="mt-1 text-sm text-white/60">
              Listados de ventas por día (RUF-05), entre fechas (RUF-06) y ranking por beneficio (RUF-07/08).
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={exportRange}>
              <FileDown className="h-4 w-4" />
              Exportar rango
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white/80">Rango de fechas</div>
                <Badge tone="neutral">
                  <Calendar className="h-3.5 w-3.5" />
                  Filtro
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs text-white/60">Desde</div>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <div className="mb-1 text-xs text-white/60">Hasta</div>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
              <div className="mt-3 text-xs text-white/55">
                Si dejas vacío, se consideran todas las ventas.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold text-white/80">Resumen del rango</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Metric label="Ventas" value={String(salesSummary.count)} />
                <Metric label="Artículos" value={String(salesSummary.items)} />
                <Metric label="Ingresos" value={fmtMoney(salesSummary.total)} />
                <Metric label="Utilidad" value={fmtMoney(salesSummary.profit)} />
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs text-white/70">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.rows.length === 0 && salesSummary.count === 0 ? (
                  <tr>
                    <td className="p-4 text-sm text-white/60" colSpan={4}>
                      No hay ventas en el rango seleccionado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold">Ventas de hoy</div>
                <div className="mt-1 text-xs text-white/55">{todayKey}</div>
              </div>
              <Button variant="ghost" onClick={exportToday}>
                <FileDown className="h-4 w-4" />
                Exportar hoy
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="# ventas" value={String(todaySales.length)} />
              <Metric
                label="Total"
                value={fmtMoney(todaySales.reduce((a, s) => a + s.subtotal, 0))}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-white/10 p-5">
          <div className="text-lg font-black">Ranking por beneficio</div>
          <div className="mt-1 text-sm text-white/60">
            Productos con mayor y menor utilidad (RUF-07/08).
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold">
              <TrendingUp className="h-4 w-4" />
              Top 5
            </div>
            <div className="space-y-2">
              {productPerformance.top.map((r) => (
                <Row key={r.id} name={r.name} meta={`${r.sku} • ${r.qty} uds`} value={fmtMoney(r.profit)} tone="success" />
              ))}
              {productPerformance.top.length === 0 ? (
                <div className="text-sm text-white/60">Sin datos en el rango.</div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold">
              <TrendingDown className="h-4 w-4" />
              Bottom 5
            </div>
            <div className="space-y-2">
              {productPerformance.bottom.map((r) => (
                <Row key={r.id} name={r.name} meta={`${r.sku} • ${r.qty} uds`} value={fmtMoney(r.profit)} tone="warn" />
              ))}
              {productPerformance.bottom.length === 0 ? (
                <div className="text-sm text-white/60">Sin datos en el rango.</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-extrabold">Exportar</div>
            <div className="mt-1 text-sm text-white/60">
              Descarga CSV para abrir en Excel/Sheets.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}

function Row({ name, meta, value, tone = "neutral" }) {
  const toneClass =
    tone === "success" ? "text-emerald-200" : tone === "warn" ? "text-amber-200" : "text-white";
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold">{name}</div>
        <div className="mt-0.5 text-xs text-white/55">{meta}</div>
      </div>
      <div className={"text-sm font-black " + toneClass}>{value}</div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.14),transparent_45%),radial-gradient(circle_at_60%_90%,rgba(244,63,94,0.12),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.2),rgba(2,6,23,0.9))]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  );
}

function KeyboardHelp({ notify }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "?" && (e.shiftKey || e.key === "?")) {
        notify(
          "info",
          "Ayuda",
          "Atajos: Ctrl+K buscar • Ctrl+Enter cobrar • En Inventario: usa Nuevo para altas"
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notify]);
  return null;
}
