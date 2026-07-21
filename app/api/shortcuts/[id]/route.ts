import { NextRequest, NextResponse } from "next/server";
import { updateShortcut, deleteShortcut } from "@/lib/transactions";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const shortcut = await updateShortcut(params.id, body);
    return NextResponse.json(shortcut);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengupdate shortcut";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteShortcut(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus shortcut";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
