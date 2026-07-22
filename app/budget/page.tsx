"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarRange, Calendar, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { formatCurrency, formatCurrencyShort, cn, getBudgetStatusColor } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProgressBar from "@/components/ui/ProgressBar";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { CATEGORY_ICON_DEFAULTS } from "@/lib/icons";
import { BudgetPeriod } from "@/types/enums";
import type { CategoryWithUsage } from "@/types";

const ICON_OPTIONS = Object.values(CATEGORY_ICON_DEFAULTS);

type BudgetTab = typeof BudgetPeriod.DAILY | typeof BudgetPeriod.WEEKLY | typeof BudgetPeriod.MONTHLY;

type BudgetCategory = CategoryWithUsage & { period: "daily" | "weekly" | "monthly" };

const TABS: { id: BudgetTab; label: string; icon: typeof CalendarDays; hint: string }[] = [
  { id: BudgetPeriod.DAILY, label: "Harian", icon: CalendarDays, hint: "Target per hari" },
  { id: BudgetPeriod.WEEKLY, label: "Mingguan", icon: CalendarRange, hint: "Target per minggu" },
  { id: BudgetPeriod.MONTHLY, label: "Bulanan", icon: Calendar, hint: "Target per bulan" },
];

const PERIOD_LABEL: Record<string, string> = {
  daily: "hari ini",
  weekly: "minggu ini",
  monthly: "bulan ini",
};

export default function BudgetPage() {
  const router = useRouter();
  const { version, notifyDataChange } = useDataRefresh();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [activeTab, setActiveTab] = useState<BudgetTab>(BudgetPeriod.WEEKLY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    iconName: "circle-dollar-sign",
    budgetPeriod: BudgetPeriod.WEEKLY as BudgetTab,
    dailyBudget: "",
    weeklyBudget: "",
    monthlyBudget: "",
  });

  const fetchBudget = () => {
    fetch("/api/budget", { cache: "no-store" }).then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { fetchBudget(); }, [version]);

  const getBudgetPeriod = (cat: BudgetCategory) =>
    cat.budgetPeriod ||
    (cat.period === "daily" ? BudgetPeriod.DAILY : cat.period === "weekly" ? BudgetPeriod.WEEKLY : BudgetPeriod.MONTHLY);

  const tabCategories = categories.filter((cat) => getBudgetPeriod(cat) === activeTab);
  const totalSpent = tabCategories.reduce((s, c) => s + (c.spent || 0), 0);
  const totalBudget = tabCategories.reduce((s, c) => s + (c.budget || 0), 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleSaveBudget = async (cat: BudgetCategory) => {
    const value = parseInt(editValue, 10);
    if (isNaN(value) || value < 0) return;

    setSaving(true);
    const body =
      cat.period === "daily"
        ? { id: cat.id, dailyBudget: value }
        : cat.period === "weekly"
          ? { id: cat.id, weeklyBudget: value }
          : { id: cat.id, monthlyBudget: value };

    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEditingId(null);
    setSaving(false);
    fetchBudget();
    notifyDataChange();
    router.refresh();
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    setSaving(true);
    const body = {
      name: newCategory.name.trim(),
      iconName: newCategory.iconName,
      type: newCategory.budgetPeriod === BudgetPeriod.MONTHLY ? "MONTHLY_FIXED" : "DAILY_RECURRING",
      budgetPeriod: newCategory.budgetPeriod,
      dailyBudget: newCategory.budgetPeriod === BudgetPeriod.DAILY && newCategory.dailyBudget
        ? parseInt(newCategory.dailyBudget, 10) : null,
      weeklyBudget: newCategory.budgetPeriod === BudgetPeriod.WEEKLY && newCategory.weeklyBudget
        ? parseInt(newCategory.weeklyBudget, 10) : null,
      monthlyBudget: newCategory.budgetPeriod === BudgetPeriod.MONTHLY && newCategory.monthlyBudget
        ? parseInt(newCategory.monthlyBudget, 10) : null,
    };

    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setShowAddForm(false);
      setNewCategory({
        name: "",
        iconName: "circle-dollar-sign",
        budgetPeriod: activeTab,
        dailyBudget: "",
        weeklyBudget: "",
        monthlyBudget: "",
      });
      fetchBudget();
      notifyDataChange();
      router.refresh();
    }
  };

  const handleDelete = async (cat: BudgetCategory) => {
    if (!confirm(`Hapus kategori "${cat.name}"?\n\nTransaksi lama tetap ada, kategori di transaksi jadi kosong.`)) return;

    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/budget/${cat.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
      if (editingId === cat.id) setEditingId(null);
      fetchBudget();
      notifyDataChange();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kategori");
    } finally {
      setDeletingId(null);
    }
  };

  const activeMeta = TABS.find((t) => t.id === activeTab)!;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md safe-area-top border-b border-border-light/80">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-base font-bold text-text-primary">Budget</h1>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex rounded-2xl bg-background-secondary p-1 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = categories.filter((c) => getBudgetPeriod(c) === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setShowAddForm(false); setEditingId(null); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-text-secondary"
                  )}
                >
                  <Icon size={14} strokeWidth={2} />
                  {tab.label}
                  <span className={cn(
                    "text-2xs px-1.5 py-px rounded-full min-w-[18px] text-center",
                    activeTab === tab.id ? "bg-primary-50 text-primary" : "text-text-tertiary"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark p-4 text-white shadow-button">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 opacity-90">
                <ActiveIcon size={14} strokeWidth={2} />
                <span className="text-2xs font-semibold uppercase tracking-widest">
                  Total {activeMeta.label}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1.5 tabular-nums tracking-tight">
                {formatCurrencyShort(totalSpent)}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                dari {formatCurrencyShort(totalBudget)} · {PERIOD_LABEL[activeTab === BudgetPeriod.DAILY ? "daily" : activeTab === BudgetPeriod.WEEKLY ? "weekly" : "monthly"]}
              </p>
            </div>
            <div className={cn(
              "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tabular-nums",
              totalPct >= 100 ? "bg-status-danger/20 text-white" : totalPct > 80 ? "bg-amber-400/20" : "bg-white/15"
            )}>
              {totalPct}%
            </div>
          </div>
          {totalBudget > 0 && (
            <div className="relative mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Add form */}
        {showAddForm ? (
          <div className="surface-card p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Kategori {activeMeta.label} Baru</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-text-tertiary font-medium">Batal</button>
            </div>

            <Input
              label="Nama kategori"
              placeholder="Contoh: Jajan"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              autoFocus
            />

            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Ikon</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, iconName: icon })}
                    className={cn(
                      "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border-2 transition-all",
                      newCategory.iconName === icon ? "border-primary bg-primary-50" : "border-border-light bg-white"
                    )}
                  >
                    <DynamicIcon name={icon} size="sm" className={newCategory.iconName === icon ? "text-primary" : "text-text-secondary"} />
                  </button>
                ))}
              </div>
            </div>

            {activeTab === BudgetPeriod.DAILY && (
              <Input label="Target harian (Rp)" type="number" placeholder="50000" value={newCategory.dailyBudget} onChange={(e) => setNewCategory({ ...newCategory, dailyBudget: e.target.value, budgetPeriod: BudgetPeriod.DAILY })} />
            )}
            {activeTab === BudgetPeriod.WEEKLY && (
              <Input label="Target mingguan (Rp)" type="number" placeholder="350000" value={newCategory.weeklyBudget} onChange={(e) => setNewCategory({ ...newCategory, weeklyBudget: e.target.value, budgetPeriod: BudgetPeriod.WEEKLY })} />
            )}
            {activeTab === BudgetPeriod.MONTHLY && (
              <Input label="Target bulanan (Rp)" type="number" placeholder="800000" value={newCategory.monthlyBudget} onChange={(e) => setNewCategory({ ...newCategory, monthlyBudget: e.target.value, budgetPeriod: BudgetPeriod.MONTHLY })} />
            )}

            <Button fullWidth onClick={handleAddCategory} disabled={saving || !newCategory.name.trim()}>
              {saving ? "Menyimpan..." : "Simpan Kategori"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setNewCategory((p) => ({ ...p, budgetPeriod: activeTab })); setShowAddForm(true); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-primary/30
                       text-primary font-semibold text-sm bg-primary-50/50 active:bg-primary-50 transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tambah Kategori {activeMeta.label}
          </button>
        )}

        {/* Category list */}
        {tabCategories.length > 0 ? (
          <div className="space-y-2.5">
            {tabCategories.map((cat) => {
              const pct = (cat.budget ?? 0) > 0 ? Math.round(((cat.spent || 0) / (cat.budget ?? 1)) * 100) : 0;
              const statusColor = getBudgetStatusColor(pct);
              const isEditing = editingId === cat.id;

              return (
                <div key={cat.id} className="surface-card overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <DynamicIcon name={cat.iconName} size="md" className="text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{cat.name}</p>
                            <p className="text-2xs text-text-tertiary mt-0.5">{PERIOD_LABEL[cat.period]}</p>
                          </div>
                          {(cat.budget ?? 0) > 0 && !isEditing && (
                            <span className={cn(
                              "shrink-0 text-2xs font-bold px-2 py-0.5 rounded-full tabular-nums",
                              statusColor === "status-danger" && "bg-status-danger-light text-status-danger",
                              statusColor === "status-warning" && "bg-status-warning-light text-status-warning",
                              statusColor === "status-safe" && "bg-status-safe-light text-status-safe",
                            )}>
                              {pct}%
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2.5 flex items-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border border-border bg-white text-sm font-semibold tabular-nums"
                              autoFocus
                              placeholder="Target"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveBudget(cat)}
                              disabled={saving}
                              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95"
                            >
                              <Check size={16} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="w-9 h-9 rounded-xl bg-background-secondary text-text-secondary flex items-center justify-center"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-baseline justify-between gap-2">
                            <p className="text-xs text-text-secondary tabular-nums">
                              <span className="font-semibold text-text-primary">{formatCurrencyShort(cat.spent || 0)}</span>
                              {" / "}
                              {formatCurrency(cat.budget || 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setEditingId(cat.id); setEditValue(String(cat.budget || 0)); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-primary-50 hover:text-primary transition-colors"
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            disabled={deletingId === cat.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:bg-status-danger-light hover:text-status-danger transition-colors disabled:opacity-40"
                            aria-label={`Hapus ${cat.name}`}
                          >
                            {deletingId === cat.id ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-status-danger/30 border-t-status-danger animate-spin" />
                            ) : (
                              <Trash2 size={15} strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing && (cat.budget ?? 0) > 0 && (
                      <div className="mt-3">
                        <ProgressBar
                          value={cat.spent || 0}
                          max={cat.budget ?? 0}
                          showValues={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !showAddForm ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-background-secondary flex items-center justify-center mx-auto mb-3">
              <ActiveIcon size={24} className="text-text-tertiary" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-text-primary">Belum ada kategori {activeMeta.label.toLowerCase()}</p>
            <p className="text-xs text-text-secondary mt-1">{activeMeta.hint}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
