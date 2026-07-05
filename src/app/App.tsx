import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, Stethoscope, FileText, Globe,
  Settings, Bell, Search, ChevronRight, TrendingUp, TrendingDown,
  Plus, Eye, Edit2, Trash2, X, LogOut, Menu, Briefcase,
  Plane, UserCheck, AlertCircle, CheckCircle, Clock, Save,
  ChevronLeft, ChevronDown, Passport,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL      = "https://zqiceeuhgkfnskrxbmvr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWNlZXVoZ2tmbnNrcnhibXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTA4MzQsImV4cCI6MjA5NjQ4NjgzNH0.m1RlNq4bVX1o-XeVz_qGtnbTad8UNAmGh1Q_c37Fe4Q"; // ← আপনার anon key

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "dashboard" | "candidate" | "medical" | "mofa" | "visa" | "takamul" | "passport" | "setting";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    FIT: "bg-green-100 text-green-700", UNFIT: "bg-red-100 text-red-700",
    "N/A": "bg-gray-100 text-gray-500", NEW: "bg-blue-100 text-blue-700",
    USED: "bg-purple-100 text-purple-700", EXPIRED: "bg-orange-100 text-orange-700",
    APPROVED: "bg-green-100 text-green-700", PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700", PROCESSING: "bg-blue-100 text-blue-700",
    PASSED: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700",
    SCHEDULED: "bg-blue-100 text-blue-700", OFFICE: "bg-green-100 text-green-700",
    MEDICAL: "bg-yellow-100 text-yellow-700", MOFA: "bg-purple-100 text-purple-700",
    EMBASSY: "bg-cyan-100 text-cyan-700", AGENCY: "bg-pink-100 text-pink-700",
    CANDIDATE: "bg-red-100 text-red-700", POLICE: "bg-orange-100 text-orange-700",
    TAKAMUL: "bg-teal-100 text-teal-700", COURIER: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) => (
  <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, footer }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label, children }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const inp = "w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

// ─── Candidate Search Input ───────────────────────────────────────────────────
const CandidateSearch = ({ value, onChange, onSelect }: any) => {
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q) { setResults([]); return; }
    const { data } = await sb.from("candidates")
      .select("id, name, passport_no, sl")
      .eq("is_deleted", false)
      .or(`name.ilike.%${q}%,passport_no.ilike.%${q}%`)
      .limit(8);
    setResults(data || []);
    setOpen(true);
  }, []);

  return (
    <div className="relative">
      <input className={inp} value={value} onChange={e => { onChange(e.target.value); search(e.target.value); }} placeholder="নাম বা পাসপোর্ট নম্বর..." />
      {open && results.length > 0 && (
        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map(c => (
            <div key={c.id} className="px-3 py-2 hover:bg-muted/40 cursor-pointer text-sm" onClick={() => { onSelect(c); setOpen(false); onChange(c.name); }}>
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs ml-2">{c.passport_no}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TablePage wrapper ────────────────────────────────────────────────────────
const TablePage = ({ title, subtitle, actions, children, onSearch }: any) => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onSearch && (
          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card text-sm text-muted-foreground w-52">
            <Search size={13} />
            <input placeholder="Search..." className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full" onChange={e => onSearch(e.target.value)} />
          </div>
        )}
        {actions}
      </div>
    </div>
    <div className="bg-card rounded-xl border border-border overflow-hidden">{children}</div>
  </div>
);

const Th = ({ children }: any) => (
  <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{children}</th>
);
const Td = ({ children, mono }: any) => (
  <td className={`px-5 py-3 ${mono ? "font-mono text-xs text-muted-foreground" : "text-sm"}`}>{children}</td>
);

// ─── PAGINATION ───────────────────────────────────────────────────────────────
const Pagination = ({ page, total, pageSize, onChange }: any) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
      <span>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft size={13} /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = Math.max(1, page - 2) + i;
          if (p > totalPages) return null;
          return <button key={p} onClick={() => onChange(p)} className={`px-2.5 py-1 rounded text-xs ${p === page ? "bg-primary text-white" : "hover:bg-muted"}`}>{p}</button>;
        })}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight size={13} /></button>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [kpis, setKpis] = useState({ candidates: 0, medFit: 0, visaApproved: 0, mofaTotal: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [medChart, setMedChart] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: cTotal }, { count: fitCount }, { count: vApproved }, { count: mCount }, { data: recentCands }] = await Promise.all([
        sb.from("candidates").select("id", { count: "exact", head: true }).eq("is_deleted", false),
        sb.from("medicals").select("id", { count: "exact", head: true }).eq("status", "FIT"),
        sb.from("visas").select("id", { count: "exact", head: true }).eq("status", "APPROVED"),
        sb.from("mofas").select("id", { count: "exact", head: true }),
        sb.from("candidates").select("id, sl, name, passport_no, country, created_at").eq("is_deleted", false).order("created_at", { ascending: false }).limit(5),
      ]);
      setKpis({ candidates: cTotal ?? 0, medFit: fitCount ?? 0, visaApproved: vApproved ?? 0, mofaTotal: mCount ?? 0 });
      setRecent(recentCands || []);

      // Medical status chart
      const statuses = ["FIT", "UNFIT", "PENDING", "EXPIRED", "NEW", "USED", "N/A"];
      const counts = await Promise.all(statuses.map(s =>
        sb.from("medicals").select("id", { count: "exact", head: true }).eq("status", s)
      ));
      setMedChart(statuses.map((s, i) => ({ name: s, value: counts[i].count ?? 0 })).filter(x => x.value > 0));
    };
    load();
  }, []);

  const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#f97316", "#3b82f6", "#a855f7", "#6b7280"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Candidates" value={kpis.candidates} icon={Users} color="bg-blue-500" />
        <StatCard label="Medical FIT" value={kpis.medFit} icon={Stethoscope} color="bg-green-500" />
        <StatCard label="Visa Approved" value={kpis.visaApproved} icon={Globe} color="bg-indigo-500" />
        <StatCard label="MOFA Records" value={kpis.mofaTotal} icon={FileText} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-1">Medical Status Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Current breakdown of all medical records</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={medChart} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                {medChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
            {medChart.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-mono font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-1">Quick Links</h3>
          <p className="text-xs text-muted-foreground mb-4">Jump to modules</p>
          <div className="space-y-2">
            {[
              { label: "Add Candidate", icon: Users, page: "candidate" },
              { label: "Medical Records", icon: Stethoscope, page: "medical" },
              { label: "MOFA Applications", icon: FileText, page: "mofa" },
              { label: "Visa Status", icon: Globe, page: "visa" },
              { label: "Takamul / Skill Test", icon: CheckCircle, page: "takamul" },
              { label: "Passport Tracker", icon: AlertCircle, page: "passport" },
            ].map(({ label, icon: Icon, page }) => (
              <button key={page} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-sm text-left">
                <Icon size={15} className="text-primary" />
                <span className="text-foreground">{label}</span>
                <ChevronRight size={13} className="ml-auto text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">সাম্প্রতিক Candidates</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["SL", "Name", "Passport No", "Country", "Date Added"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {recent.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <Td mono>{c.sl ?? "—"}</Td>
                  <Td><span className="font-medium text-foreground">{c.name}</span></Td>
                  <Td mono>{c.passport_no}</Td>
                  <Td><span className="text-muted-foreground">{c.country ?? "—"}</span></Td>
                  <Td mono>{fmtDate(c.created_at)}</Td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">No data found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── CANDIDATE PAGE ───────────────────────────────────────────────────────────
const CandidatePage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    let q = sb.from("candidates")
      .select(`id, sl, name, passport_no, country, received_date, created_at, is_deleted, agents:agent(id, full_name, "CODE")`, { count: "exact" })
      .eq("is_deleted", false)
      .order("sl", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (search) q = q.or(`name.ilike.%${search}%,passport_no.ilike.%${search}%`);
    const { data, count } = await q;
    setRows(data || []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    sb.from("agents").select(`id, full_name, "CODE"`).then(({ data }) => setAgents(data || []));
  }, []);

  const openAdd = () => { setEditing(null); setForm({ country: "", received_date: "", passport_no: "", name: "", agent: "" }); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, agent: r.agents?.id ?? "" }); setModal(true); };

  const save = async () => {
    const payload = { name: form.name, passport_no: form.passport_no, country: form.country, received_date: form.received_date || null, agent: form.agent || null, updated_at: new Date().toISOString() };
    if (editing) await sb.from("candidates").update(payload).eq("id", editing.id);
    else await sb.from("candidates").insert({ ...payload, is_deleted: false });
    setModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Soft delete this candidate?")) return;
    await sb.from("candidates").update({ is_deleted: true }).eq("id", id);
    load();
  };

  return (
    <TablePage title="Candidates" subtitle="Manage all registered worker candidates" onSearch={(v: string) => { setSearch(v); setPage(1); }}
      actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"><Plus size={13} /> Add Candidate</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["SL", "Name", "Passport No", "Country", "Agent", "Received", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
              : rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <Td mono>{r.sl ?? "—"}</Td>
                <Td><span className="font-medium text-foreground">{r.name}</span></Td>
                <Td mono>{r.passport_no}</Td>
                <Td><span className="text-muted-foreground">{r.country ?? "—"}</span></Td>
                <Td><span className="text-muted-foreground">{r.agents?.full_name ?? "—"}</span></Td>
                <Td mono>{fmtDate(r.received_date)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600"><Edit2 size={13} /></button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Candidate" : "Add Candidate"}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={save} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name *"><input className={inp} value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Passport No *"><input className={inp} value={form.passport_no ?? ""} onChange={e => setForm({ ...form, passport_no: e.target.value })} /></Field>
          <Field label="Country"><input className={inp} value={form.country ?? ""} onChange={e => setForm({ ...form, country: e.target.value })} /></Field>
          <Field label="Received Date"><input type="date" className={inp} value={form.received_date ?? ""} onChange={e => setForm({ ...form, received_date: e.target.value })} /></Field>
          <Field label="Agent"><select className={inp} value={form.agent ?? ""} onChange={e => setForm({ ...form, agent: e.target.value })}>
            <option value="">— Select Agent —</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name} ({a.CODE})</option>)}
          </select></Field>
        </div>
      </Modal>
    </TablePage>
  );
};

// ─── MEDICAL PAGE ─────────────────────────────────────────────────────────────
const MedicalPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [candSearch, setCandSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await sb.from("medicals")
      .select(`id, sl, medical_date, fit_date, status, mofa_update, created_at, candidates:candidate_id(id, name, passport_no, sl)`, { count: "exact" })
      .order("sl", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    setRows(data || []); setTotal(count ?? 0); setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ status: "N/A", mofa_update: false }); setCandSearch(""); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, candidate_id: r.candidates?.id }); setCandSearch(r.candidates?.name ?? ""); setModal(true); };

  const save = async () => {
    const payload = { candidate_id: form.candidate_id, medical_date: form.medical_date || null, fit_date: form.fit_date || null, status: form.status, mofa_update: form.mofa_update ?? false, updated_at: new Date().toISOString() };
    if (editing) await sb.from("medicals").update(payload).eq("id", editing.id);
    else await sb.from("medicals").insert(payload);
    setModal(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this medical record?")) return;
    await sb.from("medicals").delete().eq("id", id);
    load();
  };

  return (
    <TablePage title="Medical" subtitle="Track GAMCA medical examination results"
      actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"><Plus size={13} /> Add Record</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["SL", "Candidate", "Passport No", "Medical Date", "Fit Date", "Status", "MOFA Update", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
              : rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <Td mono>{r.sl}</Td>
                <Td><span className="font-medium text-foreground">{r.candidates?.name ?? "—"}</span></Td>
                <Td mono>{r.candidates?.passport_no ?? "—"}</Td>
                <Td mono>{fmtDate(r.medical_date)}</Td>
                <Td mono>{fmtDate(r.fit_date)}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td><span className={`text-xs font-medium ${r.mofa_update ? "text-green-600" : "text-muted-foreground"}`}>{r.mofa_update ? "✓ Yes" : "No"}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600"><Edit2 size={13} /></button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Medical" : "Add Medical"}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={save} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <Field label="Candidate *"><CandidateSearch value={candSearch} onChange={setCandSearch} onSelect={(c: any) => setForm({ ...form, candidate_id: c.id })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Medical Date"><input type="date" className={inp} value={form.medical_date ?? ""} onChange={e => setForm({ ...form, medical_date: e.target.value })} /></Field>
          <Field label="Fit Date"><input type="date" className={inp} value={form.fit_date ?? ""} onChange={e => setForm({ ...form, fit_date: e.target.value })} /></Field>
          <Field label="Status"><select className={inp} value={form.status ?? "N/A"} onChange={e => setForm({ ...form, status: e.target.value })}>
            {["N/A", "NEW", "FIT", "UNFIT", "USED", "EXPIRED"].map(s => <option key={s}>{s}</option>)}
          </select></Field>
          <Field label="MOFA Update"><select className={inp} value={form.mofa_update ? "true" : "false"} onChange={e => setForm({ ...form, mofa_update: e.target.value === "true" })}>
            <option value="false">No</option><option value="true">Yes</option>
          </select></Field>
        </div>
      </Modal>
    </TablePage>
  );
};

// ─── MOFA PAGE ────────────────────────────────────────────────────────────────
const MofaPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [candSearch, setCandSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await sb.from("mofas")
      .select(`id, sl, application_number, trade, aplication_date, med_update, candidates:candidate(id, name, passport_no, sl), agencies:agency(uuid, name)`, { count: "exact" })
      .order("sl", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    setRows(data || []); setTotal(count ?? 0); setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { sb.from("agency").select("uuid, name, rl").then(({ data }) => setAgencies(data || [])); }, []);

  const openAdd = () => { setEditing(null); setForm({ med_update: false }); setCandSearch(""); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, candidate: r.candidates?.id, agency: r.agencies?.uuid }); setCandSearch(r.candidates?.name ?? ""); setModal(true); };

  const save = async () => {
    const payload = { candidate: form.candidate, application_number: form.application_number || null, trade: form.trade || null, aplication_date: form.aplication_date || null, agency: form.agency || null, med_update: form.med_update ?? false, updated_at: new Date().toISOString() };
    if (editing) await sb.from("mofas").update(payload).eq("id", editing.id);
    else await sb.from("mofas").insert(payload);
    setModal(false); load();
  };

  return (
    <TablePage title="MOFA" subtitle="Ministry of Foreign Affairs attestation tracking"
      actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"><Plus size={13} /> Add MOFA</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["SL", "Candidate", "Passport No", "App Number", "Trade", "Agency", "Date", "Med Update", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
              : rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <Td mono>{r.sl}</Td>
                <Td><span className="font-medium text-foreground">{r.candidates?.name ?? "—"}</span></Td>
                <Td mono>{r.candidates?.passport_no ?? "—"}</Td>
                <Td mono>{r.application_number ?? "—"}</Td>
                <Td><span className="text-muted-foreground">{r.trade ?? "—"}</span></Td>
                <Td><span className="text-muted-foreground">{r.agencies?.name ?? "—"}</span></Td>
                <Td mono>{fmtDate(r.aplication_date)}</Td>
                <Td><span className={`text-xs font-medium ${r.med_update ? "text-green-600" : "text-muted-foreground"}`}>{r.med_update ? "✓ Yes" : "No"}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600"><Edit2 size={13} /></button>
                    <button onClick={async () => { if (confirm("Delete?")) { await sb.from("mofas").delete().eq("id", r.id); load(); } }} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit MOFA" : "Add MOFA"}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={save} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <Field label="Candidate *"><CandidateSearch value={candSearch} onChange={setCandSearch} onSelect={(c: any) => setForm({ ...form, candidate: c.id })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Application Number"><input className={inp} value={form.application_number ?? ""} onChange={e => setForm({ ...form, application_number: e.target.value })} /></Field>
          <Field label="Trade"><input className={inp} value={form.trade ?? ""} onChange={e => setForm({ ...form, trade: e.target.value })} /></Field>
          <Field label="Application Date"><input type="date" className={inp} value={form.aplication_date ?? ""} onChange={e => setForm({ ...form, aplication_date: e.target.value })} /></Field>
          <Field label="Agency"><select className={inp} value={form.agency ?? ""} onChange={e => setForm({ ...form, agency: e.target.value })}>
            <option value="">— Select —</option>
            {agencies.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
          </select></Field>
          <Field label="Med Update"><select className={inp} value={form.med_update ? "true" : "false"} onChange={e => setForm({ ...form, med_update: e.target.value === "true" })}>
            <option value="false">No</option><option value="true">Yes</option>
          </select></Field>
        </div>
      </Modal>
    </TablePage>
  );
};

// ─── VISA PAGE ────────────────────────────────────────────────────────────────
const VisaPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [candSearch, setCandSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await sb.from("visas")
      .select(`id, visa_sl, visa_type, status, issue_date, expiry_date, flight_date, iqamah_number, candidates:candidate_id(id, name, passport_no), agencies:agency(uuid, name)`, { count: "exact" })
      .order("visa_sl", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    setRows(data || []); setTotal(count ?? 0); setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { sb.from("agency").select("uuid, name").then(({ data }) => setAgencies(data || [])); }, []);

  const openAdd = () => { setEditing(null); setForm({ status: "PENDING" }); setCandSearch(""); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, candidate_id: r.candidates?.id, agency: r.agencies?.uuid }); setCandSearch(r.candidates?.name ?? ""); setModal(true); };

  const save = async () => {
    const payload = { candidate_id: form.candidate_id, visa_type: form.visa_type || null, status: form.status, issue_date: form.issue_date || null, expiry_date: form.expiry_date || null, flight_date: form.flight_date || null, iqamah_number: form.iqamah_number || null, agency: form.agency || null, updated_at: new Date().toISOString() };
    if (editing) await sb.from("visas").update(payload).eq("id", editing.id);
    else await sb.from("visas").insert(payload);
    setModal(false); load();
  };

  return (
    <TablePage title="Visa" subtitle="Work visa applications and approvals"
      actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"><Plus size={13} /> Add Visa</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["SL", "Candidate", "Passport No", "Type", "Status", "Issue Date", "Expiry", "Flight Date", "Agency", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
              : rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <Td mono>{r.visa_sl}</Td>
                <Td><span className="font-medium text-foreground">{r.candidates?.name ?? "—"}</span></Td>
                <Td mono>{r.candidates?.passport_no ?? "—"}</Td>
                <Td><span className="text-muted-foreground">{r.visa_type ?? "—"}</span></Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td mono>{fmtDate(r.issue_date)}</Td>
                <Td mono>{fmtDate(r.expiry_date)}</Td>
                <Td mono>{fmtDate(r.flight_date)}</Td>
                <Td><span className="text-muted-foreground">{r.agencies?.name ?? "—"}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600"><Edit2 size={13} /></button>
                    <button onClick={async () => { if (confirm("Delete?")) { await sb.from("visas").delete().eq("id", r.id); load(); } }} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Visa" : "Add Visa"}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={save} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <Field label="Candidate *"><CandidateSearch value={candSearch} onChange={setCandSearch} onSelect={(c: any) => setForm({ ...form, candidate_id: c.id })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Visa Type"><input className={inp} value={form.visa_type ?? ""} onChange={e => setForm({ ...form, visa_type: e.target.value })} /></Field>
          <Field label="Status"><select className={inp} value={form.status ?? "PENDING"} onChange={e => setForm({ ...form, status: e.target.value })}>
            {["PENDING", "APPROVED", "REJECTED", "EXPIRED", "USED"].map(s => <option key={s}>{s}</option>)}
          </select></Field>
          <Field label="Issue Date"><input type="date" className={inp} value={form.issue_date ?? ""} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></Field>
          <Field label="Expiry Date"><input type="date" className={inp} value={form.expiry_date ?? ""} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></Field>
          <Field label="Flight Date"><input type="date" className={inp} value={form.flight_date ?? ""} onChange={e => setForm({ ...form, flight_date: e.target.value })} /></Field>
          <Field label="Iqamah Number"><input className={inp} value={form.iqamah_number ?? ""} onChange={e => setForm({ ...form, iqamah_number: e.target.value })} /></Field>
          <Field label="Agency"><select className={inp} value={form.agency ?? ""} onChange={e => setForm({ ...form, agency: e.target.value })}>
            <option value="">— Select —</option>
            {agencies.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
          </select></Field>
        </div>
      </Modal>
    </TablePage>
  );
};

// ─── TAKAMUL PAGE ─────────────────────────────────────────────────────────────
const TakamulPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [candSearch, setCandSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await sb.from("takamul")
      .select(`id, trade, test_center, test_date, result, result_date, certificate_no, issue_date, expiry_date, status, candidates:candidate_id(id, name, passport_no, sl)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    setRows(data || []); setTotal(count ?? 0); setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ status: "PENDING", result: "PENDING" }); setCandSearch(""); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r, candidate_id: r.candidates?.id }); setCandSearch(r.candidates?.name ?? ""); setModal(true); };

  const save = async () => {
    const payload = { candidate_id: form.candidate_id, trade: form.trade || null, test_center: form.test_center || null, test_date: form.test_date || null, result: form.result, result_date: form.result_date || null, certificate_no: form.certificate_no || null, issue_date: form.issue_date || null, expiry_date: form.expiry_date || null, status: form.status, updated_at: new Date().toISOString() };
    if (editing) await sb.from("takamul").update(payload).eq("id", editing.id);
    else await sb.from("takamul").insert(payload);
    setModal(false); load();
  };

  return (
    <TablePage title="Takamul / Skill Test" subtitle="Trade test and certification tracking"
      actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"><Plus size={13} /> Add Takamul</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Candidate", "Passport No", "Trade", "Test Center", "Test Date", "Result", "Certificate No", "Expiry", "Status", "Actions"].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
              : rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <Td><span className="font-medium text-foreground">{r.candidates?.name ?? "—"}</span></Td>
                <Td mono>{r.candidates?.passport_no ?? "—"}</Td>
                <Td><span className="font-medium">{r.trade ?? "—"}</span></Td>
                <Td><span className="text-muted-foreground">{r.test_center ?? "—"}</span></Td>
                <Td mono>{fmtDate(r.test_date)}</Td>
                <Td><StatusBadge status={r.result} /></Td>
                <Td mono>{r.certificate_no ?? "—"}</Td>
                <Td mono>{fmtDate(r.expiry_date)}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600"><Edit2 size={13} /></button>
                    <button onClick={async () => { if (confirm("Delete?")) { await sb.from("takamul").delete().eq("id", r.id); load(); } }} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Takamul" : "Add Takamul"}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={save} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <Field label="Candidate *"><CandidateSearch value={candSearch} onChange={setCandSearch} onSelect={(c: any) => setForm({ ...form, candidate_id: c.id })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trade *"><input className={inp} value={form.trade ?? ""} onChange={e => setForm({ ...form, trade: e.target.value })} placeholder="MASON / DRIVER..." /></Field>
          <Field label="Test Center"><input className={inp} value={form.test_center ?? ""} onChange={e => setForm({ ...form, test_center: e.target.value })} /></Field>
          <Field label="Test Date"><input type="date" className={inp} value={form.test_date ?? ""} onChange={e => setForm({ ...form, test_date: e.target.value })} /></Field>
          <Field label="Result"><select className={inp} value={form.result ?? "PENDING"} onChange={e => setForm({ ...form, result: e.target.value })}>
            {["PENDING", "PASS", "FAIL", "ABSENT"].map(s => <option key={s}>{s}</option>)}
          </select></Field>
          <Field label="Certificate No"><input className={inp} value={form.certificate_no ?? ""} onChange={e => setForm({ ...form, certificate_no: e.target.value })} /></Field>
          <Field label="Issue Date"><input type="date" className={inp} value={form.issue_date ?? ""} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></Field>
          <Field label="Expiry Date"><input type="date" className={inp} value={form.expiry_date ?? ""} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></Field>
          <Field label="Status"><select className={inp} value={form.status ?? "PENDING"} onChange={e => setForm({ ...form, status: e.target.value })}>
            {["PENDING", "SCHEDULED", "PASSED", "FAILED", "EXPIRED", "USED"].map(s => <option key={s}>{s}</option>)}
          </select></Field>
        </div>
      </Modal>
    </TablePage>
  );
};

// ─── PASSPORT PAGE ────────────────────────────────────────────────────────────
const LOCS = ["OFFICE", "MEDICAL", "MOFA", "EMBASSY", "AGENCY", "CANDIDATE", "POLICE", "TAKAMUL", "COURIER", "OTHER"];
const LOC_ICONS: Record<string, string> = { OFFICE: "🏢", MEDICAL: "🏥", MOFA: "📑", EMBASSY: "🏛️", AGENCY: "🤝", CANDIDATE: "👤", POLICE: "🚔", TAKAMUL: "📋", COURIER: "📦", OTHER: "📌" };

const PassportPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [histModal, setHistModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [histTitle, setHistTitle] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ location: "OFFICE" });
  const [candSearch, setCandSearch] = useState("");
  const [filterLoc, setFilterLoc] = useState("");
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    // All candidates LEFT JOIN passport_tracking
    const { data: cands } = await sb.from("candidates").select("id, sl, name, passport_no").eq("is_deleted", false).order("sl", { ascending: false });
    const ids = (cands || []).map(c => c.id);
    const { data: tracks } = ids.length ? await sb.from("passport_tracking").select("*").in("candidate_id", ids) : { data: [] };
    const trackMap: Record<string, any> = {};
    (tracks || []).forEach(t => trackMap[t.candidate_id] = t);
    let merged = (cands || []).map(c => ({ ...c, tracking: trackMap[c.id] || null }));
    if (filterLoc === "__none__") merged = merged.filter(r => !r.tracking);
    else if (filterLoc) merged = merged.filter(r => r.tracking?.location === filterLoc);
    setTotal(merged.length);
    setRows(merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    setLoading(false);
  }, [page, filterLoc]);

  useEffect(() => { load(); }, [load]);

  const openMove = (r: any) => {
    setEditing(r);
    setForm({ location: r.tracking?.location ?? "OFFICE", held_by: r.tracking?.held_by ?? "", phone: r.tracking?.phone ?? "", received_date: new Date().toISOString().split("T")[0], expected_return: "", notes: "" });
    setCandSearch(r.name);
    setModal(true);
  };

  const saveMove = async () => {
    const payload = { candidate_id: editing.id, location: form.location, held_by: form.held_by || null, phone: form.phone || null, received_date: form.received_date || null, expected_return: form.expected_return || null, notes: form.notes || null, updated_at: new Date().toISOString() };
    if (editing.tracking) await sb.from("passport_tracking").update(payload).eq("id", editing.tracking.id);
    else await sb.from("passport_tracking").insert(payload);
    await sb.from("passport_movements").insert({ candidate_id: editing.id, from_location: editing.tracking?.location ?? null, to_location: form.location, movement_date: form.received_date, held_by: form.held_by || null, phone: form.phone || null, notes: form.notes || null });
    setModal(false); load();
  };

  const openHistory = async (r: any) => {
    setHistTitle(r.name);
    const { data } = await sb.from("passport_movements").select("*").eq("candidate_id", r.id).order("movement_date", { ascending: false });
    setHistory(data || []);
    setHistModal(true);
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Passport Tracker</h2>
          <p className="text-sm text-muted-foreground">সব প্রার্থীর পাসপোর্ট physical location</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="px-3 py-2 border border-border rounded-lg bg-card text-xs text-foreground" value={filterLoc} onChange={e => { setFilterLoc(e.target.value); setPage(1); }}>
            <option value="">সব</option>
            <option value="__none__">⚠️ Untracked</option>
            {LOCS.map(l => <option key={l} value={l}>{LOC_ICONS[l]} {l}</option>)}
          </select>
        </div>
      </div>

      {/* Location stat pills */}
      <div className="flex gap-2 flex-wrap">
        {LOCS.map(l => (
          <button key={l} onClick={() => { setFilterLoc(filterLoc === l ? "" : l); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterLoc === l ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
            {LOC_ICONS[l]} {l}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["SL", "Candidate", "Passport No", "Location", "Held By", "Phone", "Received", "Expected Return", "Actions"].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">Loading...</td></tr>
                : rows.map(r => {
                const t = r.tracking;
                let retDisplay: any = "—";
                if (t?.expected_return) {
                  const exp = new Date(t.expected_return); const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
                  retDisplay = diff < 0 ? <span className="text-red-500 font-medium">⚠️ {fmtDate(t.expected_return)}</span>
                    : diff <= 3 ? <span className="text-amber-500 font-medium">⏰ {fmtDate(t.expected_return)}</span>
                    : fmtDate(t.expected_return);
                }
                return (
                  <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${!t ? "bg-amber-50/50" : ""}`}>
                    <Td mono>{r.sl ?? "—"}</Td>
                    <Td><span className="font-medium text-foreground">{r.name}</span></Td>
                    <Td mono>{r.passport_no}</Td>
                    <Td>{t ? <StatusBadge status={t.location} /> : <span className="text-xs text-muted-foreground italic">Not tracked</span>}</Td>
                    <Td><span className="text-muted-foreground">{t?.held_by ?? "—"}</span></Td>
                    <Td mono>{t?.phone ?? "—"}</Td>
                    <Td mono>{t ? fmtDate(t.received_date) : "—"}</Td>
                    <Td>{retDisplay}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openMove(r)} className={`p-1.5 rounded text-xs font-medium ${t ? "hover:bg-yellow-50 text-muted-foreground hover:text-yellow-600" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                          {t ? <Edit2 size={13} /> : <Plus size={13} />}
                        </button>
                        {t && <button onClick={() => openHistory(r)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600"><Eye size={13} /></button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Move Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={`${editing?.tracking ? "📍 সরান" : "+ Track"} — ${editing?.name ?? ""}`}
        footer={<><button onClick={() => setModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button><button onClick={saveMove} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90">Save</button></>}>
        <Field label="Location *">
          <div className="grid grid-cols-5 gap-1.5">
            {LOCS.map(l => (
              <button key={l} onClick={() => setForm({ ...form, location: l })}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center text-xs transition-colors ${form.location === l ? "bg-primary/10 border-primary text-primary font-medium" : "border-border hover:bg-muted text-muted-foreground"}`}>
                <span className="text-lg">{LOC_ICONS[l]}</span>
                <span className="leading-tight">{l}</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="কার কাছে"><input className={inp} value={form.held_by ?? ""} onChange={e => setForm({ ...form, held_by: e.target.value })} /></Field>
          <Field label="ফোন"><input className={inp} value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="তারিখ *"><input type="date" className={inp} value={form.received_date ?? ""} onChange={e => setForm({ ...form, received_date: e.target.value })} /></Field>
          <Field label="ফেরত আসবে"><input type="date" className={inp} value={form.expected_return ?? ""} onChange={e => setForm({ ...form, expected_return: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="নোট"><input className={inp} value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal open={histModal} onClose={() => setHistModal(false)} title={`📜 Movement History — ${histTitle}`}>
        {history.length === 0 ? <p className="text-center text-muted-foreground py-6">No movement history</p>
          : <div className="space-y-3">
            {history.map((m, i) => (
              <div key={m.id} className="flex gap-3">
                <div className="text-xl">{LOC_ICONS[m.to_location] ?? "📌"}</div>
                <div className="flex-1 border-b border-border pb-3">
                  <div className="text-sm font-medium">{m.from_location ? `${LOC_ICONS[m.from_location]} ${m.from_location} → ` : ""}<strong>{LOC_ICONS[m.to_location]} {m.to_location}</strong></div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {m.held_by && `👤 ${m.held_by}  `}{m.phone && `📞 ${m.phone}  `}
                    {m.notes && <><br />💬 {m.notes}</>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">📅 {fmtDate(m.movement_date)}</div>
                </div>
              </div>
            ))}
          </div>}
      </Modal>
    </div>
  );
};

// ─── SETTING PAGE ─────────────────────────────────────────────────────────────
const SettingPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div><h2 className="text-lg font-semibold text-foreground">Settings</h2><p className="text-sm text-muted-foreground mt-0.5">Manage company and system preferences</p></div>
    {[
      { title: "Supabase Configuration", fields: [{ label: "Project URL", value: SUPABASE_URL }, { label: "Anon Key", value: "Set in source code" }] },
      { title: "Company Information", fields: [{ label: "Company Name", value: "Manpower ERP" }, { label: "Country", value: "Bangladesh" }] },
    ].map(section => (
      <div key={section.title} className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground text-sm">{section.title}</h3></div>
        <div className="p-5 space-y-4">
          {section.fields.map(f => (
            <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label className="text-sm text-muted-foreground w-48 flex-shrink-0">{f.label}</label>
              <input defaultValue={f.value} className="flex-1 px-3 py-2 border border-border rounded-lg bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
const navItems: { id: Page; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "candidate", label: "Candidates", icon: Users },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "mofa", label: "MOFA", icon: FileText },
  { id: "visa", label: "Visa", icon: Globe },
  { id: "takamul", label: "Takamul", icon: CheckCircle },
  { id: "passport", label: "Passport", icon: AlertCircle },
  { id: "setting", label: "Settings", icon: Settings },
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "candidate": return <CandidatePage />;
      case "medical": return <MedicalPage />;
      case "mofa": return <MofaPage />;
      case "visa": return <VisaPage />;
      case "takamul": return <TakamulPage />;
      case "passport": return <PassportPage />;
      case "setting": return <SettingPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col bg-[#0f172a] transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Briefcase size={15} className="text-white" /></div>
          <div><p className="text-sm font-semibold text-white leading-tight">CoreSync ERP</p><p className="text-[10px] text-white/40 font-mono">v1.0.0</p></div>
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest px-2 pb-2">Main Menu</p>
          {navItems.slice(0, 7).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${page === id ? "bg-primary text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/8"}`}>
              <Icon size={15} />{label}
              {page === id && <ChevronRight size={13} className="ml-auto opacity-60" />}
            </button>
          ))}
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest px-2 pt-4 pb-2">Admin</p>
          {navItems.slice(7).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${page === id ? "bg-primary text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/8"}`}>
              <Icon size={15} />{label}
              {page === id && <ChevronRight size={13} className="ml-auto opacity-60" />}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/8 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">AD</div>
            <div className="min-w-0"><p className="text-sm font-medium text-white truncate">Admin</p><p className="text-[10px] text-white/40 truncate">Super Admin</p></div>
            <LogOut size={13} className="ml-auto text-white/30 hover:text-white/60" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center px-5 gap-4 flex-shrink-0">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{navItems.find(n => n.id === page)?.label}</h1>
            <p className="text-[11px] text-muted-foreground font-mono">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell size={17} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold cursor-pointer">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">{renderPage()}</main>
      </div>
    </div>
  );
}
