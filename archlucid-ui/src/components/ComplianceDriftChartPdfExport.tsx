"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

import { ComplianceDriftChart } from "./ComplianceDriftChart";

async function blobToLandscapePdf(canvas: HTMLCanvasElement, fileStem: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const marginMm = 10;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pdfPageWidthMm = pdf.internal.pageSize.getWidth();
  const pdfPageHeightMm = pdf.internal.pageSize.getHeight();
  const drawableWidthMm = pdfPageWidthMm - marginMm * 2;
  const drawableHeightMm = pdfPageHeightMm - marginMm * 2;
  const imgDataUri = canvas.toDataURL("image/png", 1);
  /** jsPDF typings accept width/height; height optional when deriving aspect from image. */

  pdf.addImage(
    imgDataUri,
    "PNG",
    marginMm,
    marginMm,
    drawableWidthMm,
    Math.min(drawableHeightMm, (canvas.height / canvas.width) * drawableWidthMm),
  );
  pdf.save(`${fileStem}.pdf`);
}

type Props = {
  readonly points: ComplianceDriftTrendPoint[];
};

/**
 * Captures only the bounded drift-chart region (`html2canvas` + jsPDF landscape) — navigation chrome is excluded.
 */
export function ComplianceDriftChartPdfExport(props: Props) {
  const captureRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);

  const onExport = React.useCallback(async () => {
    const region = captureRef.current;

    if (region === null || props.points.length === 0) {
      return;
    }

    setBusy(true);

    try {
      const [{ default: html2canvas }] = await Promise.all([import("html2canvas")]);
      const canvas = await html2canvas(region, {
        scale: Math.min(window.devicePixelRatio > 1 ? 2 : 1.75, 2.5),
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      await blobToLandscapePdf(canvas, "compliance-drift-chart");
    } finally {
      setBusy(false);
    }
  }, [props.points.length]);

  return (
    <div data-testid="compliance-drift-pdf-export" className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || props.points.length === 0}
          onClick={() => {
            void onExport();
          }}
        >
          {busy ? "Preparing PDF…" : "Export drift chart as PDF"}
        </Button>
      </div>

      <div
        ref={captureRef}
        className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
      >
        <ComplianceDriftChart points={props.points} />
      </div>
    </div>
  );
}
