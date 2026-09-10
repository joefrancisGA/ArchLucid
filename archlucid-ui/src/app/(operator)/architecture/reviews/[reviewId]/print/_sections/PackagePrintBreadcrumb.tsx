import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { PACKAGE_PRINT_PAGE_TITLE } from "@/lib/package-print-view";

export type PackagePrintBreadcrumbProps = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly backHref: string;
};

/** Core review trail for package print (APR). */
export function PackagePrintBreadcrumb(props: PackagePrintBreadcrumbProps): React.JSX.Element {
  const reviewTitle = props.reviewTitle.trim() || "Review";

  return (
    <OperatorPageBreadcrumb
      data-testid="package-print-breadcrumb"
      items={[
        { label: reviewTitle, href: props.backHref },
        { label: PACKAGE_PRINT_PAGE_TITLE },
      ]}
    />
  );
}
