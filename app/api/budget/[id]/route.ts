import { NextRequest, NextResponse } from "next/server";
import { deleteCategory } from "@/lib/transactions";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCategory(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
