import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, setCheckinMode, setPacaranMode, serializeAppSettings } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json(serializeAppSettings(settings), noStore);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (typeof body.checkinModeActive === "boolean") {
      await setCheckinMode(body.checkinModeActive);
      const settings = await getAppSettings();
      return NextResponse.json(serializeAppSettings(settings), noStore);
    }

    if (typeof body.pacaranModeActive === "boolean") {
      await setPacaranMode(body.pacaranModeActive);
      const settings = await getAppSettings();
      return NextResponse.json(serializeAppSettings(settings), noStore);
    }

    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400, ...noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan pengaturan";
    return NextResponse.json({ error: message }, { status: 400, ...noStore });
  }
}
