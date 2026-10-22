import { NextResponse } from "next/server";

import { tryReadAzureExtractorScript } from "@/lib/load-azure-extractor-script";

export async function GET(): Promise<NextResponse> {
  const scriptText = tryReadAzureExtractorScript();

  if (scriptText === null) {
    return NextResponse.json({ error: "Extractor script is unavailable." }, { status: 404 });
  }

  return new NextResponse(scriptText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Get-ArchLucidAzurePackage.ps1"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
