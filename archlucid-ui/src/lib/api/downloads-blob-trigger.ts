/** Browser blob download triggers (barrel). */

export {
  fetchBrowserDownload,
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";

export { downloadTerraformAdvisoryExportZip } from "./downloads-blob-trigger-terraform";

export {
  downloadBoardPackPdf,
  downloadConsultingArchitectureReportDocx,
  downloadFirstValueReportPdf,
} from "./downloads-blob-trigger-reports";
