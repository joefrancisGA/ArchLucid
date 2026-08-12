"use client";

import { Download } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildStaticCtoDemoRecapPayload } from "@/lib/buyer/buyer-cto-demo-recap";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showError, showSuccess } from "@/lib/toast";

export function CtoDemoLeaveBehindExportButton(): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const onDownload = useCallback(async () => {
    setBusy(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const payload = buildStaticCtoDemoRecapPayload(typeof window !== "undefined" ? window.location.origin : "");
      const dateLabel = new Date().toISOString().slice(0, 10);
      const container = document.createElement("div");
      container.id = "cto-demo-leave-behind-print-target";
      container.setAttribute("aria-hidden", "true");
      container.className = "sr-only fixed left-[-9999px] top-0 w-[720px] bg-white p-8 text-neutral-900";
      container.innerHTML = `
        <h1 style="font-size:20px;margin:0 0 8px;">ArchLucid — Claims Intake Modernization</h1>
        <p style="margin:0 0 12px;font-size:14px;">Signed and committed · ${dateLabel}</p>
        <p style="margin:0 0 8px;font-size:13px;"><strong>Verdict:</strong> ${payload.riskPosture}</p>
        <p style="margin:0 0 8px;font-size:13px;"><strong>Findings:</strong> ${payload.findingsCount}</p>
        <p style="margin:0 0 8px;font-size:13px;"><strong>Time to value:</strong> ~${payload.firstValueMinutes} min</p>
        <p style="margin:12px 0 0;font-size:12px;color:#444;">All findings are derived from policy packs applied to your architecture brief. Audit log is append-only.</p>
        <p style="margin:8px 0 0;font-size:11px;color:#666;">Generated from ArchLucid showcase · ${SHOWCASE_STATIC_DEMO_RUN_ID}</p>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
      document.body.removeChild(container);

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;

      pdf.addImage(imageData, "PNG", (pageWidth - width) / 2, 24, width, height);
      pdf.save(`ArchLucid-Claims-Intake-Review-${dateLabel}.pdf`);
      showSuccess("PDF downloaded.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "PDF generation failed.";

      showError("Download recap", message);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => void onDownload()}
      data-testid="cto-demo-leave-behind-export"
    >
      <Download className="mr-1 h-3.5 w-3.5" aria-hidden />
      {busy ? "Generating…" : "Download recap (PDF)"}
    </Button>
  );
}
