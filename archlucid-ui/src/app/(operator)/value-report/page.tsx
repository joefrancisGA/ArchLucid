import { ValueReportPageClient } from "./_sections/ValueReportPageClient";
import { loadValueReportPageData } from "./_sections/load-value-report-page-data";

export default async function ValueReportPage() {
  const loaded = await loadValueReportPageData();

  return <ValueReportPageClient loaded={loaded} />;
}
