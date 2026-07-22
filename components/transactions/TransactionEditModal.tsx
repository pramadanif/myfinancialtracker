"use client";

import { useState, useEffect } from "react";
import TransactionFormBody from "@/components/transactions/TransactionFormBody";
import DynamicIcon from "@/components/ui/DynamicIcon";
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
    if (amount <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }
    if (!categoryId) {
      setError("Pilih kategori");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          categoryId,
          amount,
          type: tab === "income" ? "CREDIT" : "DEBIT",
          description,
          date,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-sheet animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="sticky top-5 bg-white border-b border-border-light px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-text-primary">Edit Transaksi</h2>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8">
            <span className="text-xl leading-none text-text-tertiary">×</span>
          </button>
        </div>

        <div className="p-5 pb-10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-background-secondary mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <DynamicIcon
                name={transaction.category?.iconName || "circle-dollar-sign"}
                size="md"
                className="text-primary"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{transaction.category?.name || "Transaksi"}</p>
              <p className="text-xs text-text-tertiary">{transaction.account.name}</p>
            </div>
          </div>

          <TransactionFormBody
            tab={tab}
            onTabChange={(t) => {
              if (t === "transfer") return;
              setTab(t);
              setCategoryId("");
            }}
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
            error={error}
            loading={loading}
            submitLabel="Simpan Perubahan"
            onSubmit={handleSave}
            hideTransfer
          />
        </div>
      </div>
    </div>
  );
}
