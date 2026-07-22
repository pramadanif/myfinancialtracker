"use client";

import { useState } from "react";
import { Plus, Trash2, Zap, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { AccountIconBox } from "@/components/ui/DynamicIcon";
import { formatCurrencyShort, cn } from "@/lib/utils";
import { CATEGORY_ICON_DEFAULTS } from "@/lib/icons";
import type { QuickShortcutWithRelations } from "@/types";
import type { Account, Category } from "@prisma/client";

const ICON_OPTIONS = Object.values(CATEGORY_ICON_DEFAULTS);

interface ShortcutManagerProps {
  shortcuts: QuickShortcutWithRelations[];
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

const emptyForm = {
  label: "",
  iconName: "zap",
  accountId: "",
  categoryId: "",
  defaultAmount: "",
};

export default function ShortcutManager({
  shortcuts,
  accounts,
  categories,
  onRefresh,
}: ShortcutManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const expenseCategories = categories.filter(
    (c) => c.type !== "INCOME" && c.type !== "TRANSFER"
  );

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, accountId: accounts[0]?.id || "" });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (shortcut: QuickShortcutWithRelations) => {
    setEditingId(shortcut.id);
    setForm({
      label: shortcut.label,
      iconName: shortcut.iconName || shortcut.category.iconName || "zap",
      accountId: shortcut.accountId,
      categoryId: shortcut.categoryId,
      defaultAmount: shortcut.defaultAmount ? String(shortcut.defaultAmount) : "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSave = async () => {
    if (!form.label.trim()) { setError("Label wajib diisi"); return; }
    if (!form.accountId) { setError("Pilih akun"); return; }
    if (!form.categoryId) { setError("Pilih kategori"); return; }

    setSaving(true);
    setError("");
    const payload = {
      label: form.label.trim(),
      iconName: form.iconName,
      accountId: form.accountId,
      categoryId: form.categoryId,
      defaultAmount: form.defaultAmount ? parseInt(form.defaultAmount, 10) : null,
    };

    try {
      const res = await fetch(
        editingId ? `/api/shortcuts/${editingId}` : "/api/shortcuts",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }
      closeForm();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shortcut: QuickShortcutWithRelations) => {
    if (!confirm(`Hapus shortcut "${shortcut.label}"?`)) return;
    setDeletingId(shortcut.id);
    try {
      const res = await fetch(`/api/shortcuts/${shortcut.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      if (editingId === shortcut.id) closeForm();
      onRefresh();
    } catch {
      alert("Gagal menghapus shortcut");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="py-3 space-y-4">
      {!showForm ? (
        <button
          type="button"
          onClick={openCreateForm}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-primary/30
                     text-primary font-semibold text-sm bg-primary-50/50 active:bg-primary-50 transition-colors"
        >
          <Plus size={18} strokeWidth={2.5} />
          Tambah Shortcut
        </button>
      ) : (
        <div className="surface-card p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              {editingId ? "Edit Shortcut" : "Shortcut Baru"}
            </h3>
            <button type="button" onClick={closeForm} className="text-xs text-text-tertiary font-medium">Batal</button>
          </div>

          <Input
            label="Nama shortcut"
            placeholder="Contoh: Kopi Pagi"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            autoFocus
          />

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Ikon</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, iconName: icon })}
                  className={cn(
                    "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border-2 transition-all",
                    form.iconName === icon ? "border-primary bg-primary-50" : "border-border-light bg-white"
                  )}
                >
                  <DynamicIcon name={icon} size="sm" className={form.iconName === icon ? "text-primary" : "text-text-secondary"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Akun</p>
            <div className="flex gap-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setForm({ ...form, accountId: account.id })}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all",
                    form.accountId === account.id ? "border-primary bg-primary-50" : "border-border-light bg-white"
                  )}
                >
                  <AccountIconBox accountName={account.name} colorTag={account.colorTag} size="sm" className="w-8 h-8" />
                  <span className={cn("text-2xs font-semibold", form.accountId === account.id ? "text-primary" : "text-text-secondary")}>
                    {account.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Kategori</p>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="form-select">
              <option value="">Pilih kategori</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Nominal default (opsional)"
            placeholder="Kosongkan jika input manual tiap kali"
            type="number"
            value={form.defaultAmount}
            onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })}
          />
          {form.defaultAmount && (
            <p className="text-2xs text-primary font-medium flex items-center gap-1 -mt-2">
              <Zap size={11} strokeWidth={2.5} />
              Bisa simpan 1-tap (tahan di Tambah Cepat)
            </p>
          )}

          {error && <p className="text-sm text-status-danger font-medium text-center">{error}</p>}

          <Button fullWidth onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Shortcut"}
          </Button>
        </div>
      )}

      {shortcuts.length > 0 ? (
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="surface-card px-3.5 py-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <DynamicIcon name={shortcut.iconName || shortcut.category.iconName} size="md" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-text-primary truncate">{shortcut.label}</p>
                  {shortcut.defaultAmount ? (
                    <span className="shrink-0 text-2xs font-bold text-primary bg-primary-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Zap size={9} strokeWidth={2.5} />1-tap
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {shortcut.account.name} · {shortcut.category.name}
                </p>
                <p className={cn("text-xs font-semibold mt-0.5 tabular-nums", shortcut.defaultAmount ? "text-primary" : "text-text-tertiary")}>
                  {shortcut.defaultAmount ? formatCurrencyShort(shortcut.defaultAmount) : "Nominal manual"}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditForm(shortcut)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-tertiary
                             hover:bg-primary-50 hover:text-primary active:scale-95 transition-all"
                  aria-label={`Edit ${shortcut.label}`}
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(shortcut)}
                  disabled={deletingId === shortcut.id}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-tertiary
                             hover:bg-status-danger-light hover:text-status-danger active:scale-95 transition-all disabled:opacity-40"
                  aria-label={`Hapus ${shortcut.label}`}
                >
                  {deletingId === shortcut.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-status-danger/30 border-t-status-danger animate-spin" />
                  ) : (
                    <Trash2 size={17} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-10 px-4">
          <div className="w-14 h-14 rounded-2xl bg-background-secondary flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-text-tertiary" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-text-primary">Belum ada shortcut</p>
          <p className="text-xs text-text-secondary mt-1">Buat shortcut untuk catat transaksi lebih cepat</p>
        </div>
      ) : null}
    </div>
  );
}
