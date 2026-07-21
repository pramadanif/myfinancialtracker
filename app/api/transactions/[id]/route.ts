import { NextRequest, NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/lib/transactions";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const transaction = await updateTransaction(params.id, body);
    return NextResponse.json(transaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengupdate transaksi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTransaction(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus transaksi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
