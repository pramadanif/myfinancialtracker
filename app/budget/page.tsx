"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDataRefresh } from "@/components/layout/DataRefreshProvider";
import { formatCurrencyShort } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProgressBar from "@/components/ui/ProgressBar";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { CATEGORY_ICON_DEFAULTS } from "@/lib/icons";
import type { CategoryWithUsage } from "@/types";

const ICON_OPTIONS = Object.values(CATEGORY_ICON_DEFAULTS);

export default function BudgetPage() {
  const router = useRouter();
  const { version } = useDataRefresh();
  const [categories, setCategories] = useState<(CategoryWithUsage & { period: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "", iconName: "circle-dollar-sign", type: "DAILY_RECURRING", weeklyBudget: "", monthlyBudget: "",
  });

  const fetchBudget = () => {
    fetch("/api/budget").then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { fetchBudget(); }, [version]);

  const handleSaveBudget = async (id: string, period: string) => {
    const value = parseInt(editValue, 10);
    if (isNaN(value)) return;

    const body = period === "weekly"
      ? { id, weeklyBudget: value }
      : { id, monthlyBudget: value };

    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEditingId(null);
    fetchBudget();
    router.refresh();
  };

  const handleAddCategory = async () => {
    const body = {
      name: newCategory.name,
      iconName: newCategory.iconName,
      type: newCategory.type,
      weeklyBudget: newCategory.type === "DAILY_RECURRING" && newCategory.weeklyBudget
        ? parseInt(newCategory.weeklyBudget, 10) : null,
      monthlyBudget: newCategory.type !== "DAILY_RECURRING" && newCategory.monthlyBudget
        ? parseInt(newCategory.monthlyBudget, 10) : null,
    };

    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowAddForm(false);
      setNewCategory({ name: "", iconName: "circle-dollar-sign", type: "DAILY_RECURRING", weeklyBudget: "", monthlyBudget: "" });
      fetchBudget();
      router.refresh();
    }
  };

  const typeLabels: Record<string, string> = {
    DAILY_RECURRING: "Harian/Mingguan",
    MONTHLY_FIXED: "Bulanan Tetap",
    LIFESTYLE: "Gaya Hidup",
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Budget & Kategori</h1>
        <Button size="sm" onClick={() => setShowAddForm(true)}>+ Kategori</Button>
      </div>

      {showAddForm && (
        <Card className="space-y-3">
          <Input label="Nama" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
          <div>
            <p className="text-sm font-medium mb-1">Icon</p>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewCategory({ ...newCategory, iconName: icon })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                    newCategory.iconName === icon ? "border-primary bg-primary-light" : "border-border"
                  }`}
                >
                  <DynamicIcon name={icon} size="sm" />
                </button>
              ))}
            </div>
          </div>
          <select value={newCategory.type} onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm">
            <option value="DAILY_RECURRING">Harian/Mingguan</option>
            <option value="MONTHLY_FIXED">Bulanan Tetap</option>
            <option value="LIFESTYLE">Gaya Hidup</option>
          </select>
          {newCategory.type === "DAILY_RECURRING" ? (
            <Input label="Budget Mingguan" type="number" value={newCategory.weeklyBudget} onChange={(e) => setNewCategory({ ...newCategory, weeklyBudget: e.target.value })} />
          ) : (
            <Input label="Budget Bulanan" type="number" value={newCategory.monthlyBudget} onChange={(e) => setNewCategory({ ...newCategory, monthlyBudget: e.target.value })} />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowAddForm(false)}>Batal</Button>
            <Button fullWidth onClick={handleAddCategory}>Simpan</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DynamicIcon name={cat.iconName} size="lg" className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{cat.name}</p>
                  <p className="text-xs text-text-secondary">{typeLabels[cat.type] || cat.type}</p>
                </div>
              </div>
              {editingId === cat.id ? (
                <div className="flex items-center gap-1">
                  <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-24 px-2 py-1 rounded-lg border border-border text-sm" autoFocus />
                  <button onClick={() => handleSaveBudget(cat.id, cat.period)} className="text-primary text-sm font-medium">Simpan</button>
                  <button onClick={() => setEditingId(null)} className="text-text-secondary text-sm">Batal</button>
                </div>
              ) : (
                <button onClick={() => { setEditingId(cat.id); setEditValue(String(cat.budget || 0)); }} className="text-xs text-primary font-medium">
                  Edit Target
                </button>
              )}
            </div>
            {(cat.budget ?? 0) > 0 && (
              <ProgressBar value={cat.spent || 0} max={cat.budget ?? 0} showValues formatValue={(v) => v.toLocaleString("id-ID")} />
            )}
            <p className="text-xs text-text-secondary mt-1">
              Terpakai: {formatCurrencyShort(cat.spent || 0)} / Target: {formatCurrencyShort(cat.budget || 0)}
              ({cat.period === "weekly" ? "minggu ini" : "bulan ini"})
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
