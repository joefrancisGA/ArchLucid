import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Downloads sponsor ROI board pack from GET /v1/roi/sponsor-report/board-pack. */
export async function downloadSponsorRoiBoardPack(options: {
  format: "md" | "pdf";
  generateNarrative?: boolean;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadSponsorRoiBoardPack is only supported in the browser.");
  }

  const params = new URLSearchParams({ format: options.format });

  if (options.generateNarrative === true) {
    params.set("generateNarrative", "true");
  }

  const path = `/api/proxy/${ApiV1Routes.roiSponsorReportBoardPack}?${params.toString()}`;
  const accept = options.format === "pdf" ? "application/pdf" : "text/markdown";

  const response = await fetch(
    path,
    mergeRegistrationScopeForProxy({ headers: { Accept: accept } }),
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.length > 0 ? text : `HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    options.format === "pdf" ? "sponsor-roi-board-pack.pdf" : "sponsor-roi-board-pack.md";
  anchor.click();
  URL.revokeObjectURL(url);
}
