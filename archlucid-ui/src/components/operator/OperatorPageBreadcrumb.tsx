export type OperatorPageBreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
};

export type OperatorPageBreadcrumbProps = {
  readonly items: readonly OperatorPageBreadcrumbItem[];
  readonly className?: string;
  readonly "data-testid"?: string;
};

/** TB-2090: breadcrumbs removed system-wide — left nav and page titles are the wayfinding model. */
export function OperatorPageBreadcrumb(_props: OperatorPageBreadcrumbProps): null {
  return null;
}
