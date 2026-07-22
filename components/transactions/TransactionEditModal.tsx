"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import TransactionFormBody from "@/components/transactions/TransactionFormBody";
import TransactionModalShell from "@/components/transactions/TransactionModalShell";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { formatCurrency } from "@/lib/utils";
import { toISODateString } from "@/lib/dates";
import { TransactionType } from "@/types/enums";
import type { TransactionWithRelations } from "@/types";
import type { Account, Category } from "@prisma/client";

interface TransactionEditModalProps {
  transaction: TransactionWithRelations | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TransactionEditModal({
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
}: TransactionEditModalProps) {
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = !!transaction;

  const filteredCategories = categories.filter((c) => {
    if (tab === "income") return c.type === "INCOME";
    return c.type !== "INCOME" && c.type !== "TRANSFER";
  });

  useEffect(() => {
    if (!transaction) return;
    setAccountId(transaction.accountId);
    setCategoryId(transaction.categoryId || "");
    setAmount(transaction.amount);
    setDescription(transaction.description || "");
    setDate(toISODateString(new Date(transaction.date)));
    setTab(transaction.type === TransactionType.CREDIT ? "income" : "expense");
    setError("");
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    if (amount <= 0) { setError("Nominal harus lebih dari 0"); return; }
    if (!categoryId) { setError("Pilih kategori"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId, categoryId, amount,
          type: tab === "income" ? "CREDIT" : "DEBIT",
          description, date,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <TransactionModalShell
      title="Edit Transaksi"
      subtitle={transaction.category?.name}
      onClose={onClose}
      footer={
        <Button fullWidth size="lg" onClick={handleSave} disabled={loading || amount <= 0}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      }
    >
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary-50 to-white border border-primary/10 mb-5">
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <DynamicIcon name={transaction.category?.iconName || "circle-dollar-sign"} size="md" className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{transaction.category?.name}</p>
          <p className="text-xs text-text-tertiary">{transaction.account.name}</p>
        </div>
        <p className="text-sm font-bold text-text-primary tabular-nums shrink-0">
          {formatCurrency(transaction.amount)}
        </p>
      </div>

      <TransactionFormBody
        tab={tab}
        onTabChange={(t) => { if (t === "transfer") return; setTab(t); setCategoryId(""); }}
        date={date}
        onDateChange={setDate}
        accountId={accountId}
        onAccountChange={setAccountId}
        fromAccountId=""
        toAccountId=""
        onFromAccountChange={() => {}}
        onToAccountChange={() => {}}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        description={description}
        onDescriptionChange={setDescription}
        amount={amount}
        onAmountChange={setAmount}
        accounts={accounts}
        categories={filteredCategories}
        hideTransfer
      />

      {error && <p className="text-sm text-status-danger text-center font-medium mt-4">{error}</p>}
    </TransactionModalShell>
  );
}
