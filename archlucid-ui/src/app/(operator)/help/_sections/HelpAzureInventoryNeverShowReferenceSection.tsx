import Link from "next/link";

import {
  AZURE_INVENTORY_NEVER_SHOW_HELP_CATALOG_HEADING,
  AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_HEADING,
  AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_ITEMS,
  AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_PATH,
  AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_TOGGLE,
  AZURE_INVENTORY_NEVER_SHOW_HELP_INTRO,
  AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_BODY,
  AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_HEADING,
  AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID,
  AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_TITLE,
  AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_BODY,
  AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_HEADING,
  listAzureInventoryNeverShowCatalogArmTypesForHelp,
  listAzureInventoryNeverShowLastSegmentsForHelp,
  listAzureInventoryNeverShowSqlDatabaseNamesForHelp,
} from "@/lib/infra-evidence/azure-inventory-never-show-help-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const listClassName = cn(
  "m-0 list-none space-y-1 p-0",
  HELP_PAGE_LAYOUT.readingBody,
  OPERATOR_TYPOGRAPHY.helper,
);

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

export function HelpAzureInventoryNeverShowReferenceSection({
  readingBodyClass,
}: {
  readonly readingBodyClass: string;
}) {
  const catalogArmTypes = listAzureInventoryNeverShowCatalogArmTypesForHelp();
  const lastSegments = listAzureInventoryNeverShowLastSegmentsForHelp();
  const sqlDatabaseNames = listAzureInventoryNeverShowSqlDatabaseNamesForHelp();

  return (
    <section
      aria-labelledby={AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID}
      className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      data-testid="help-azure-inventory-never-show-reference"
    >
      <HelpSectionHeading id={AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID}>
        {AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_TITLE}
      </HelpSectionHeading>
      <p className={readingBodyClass} data-testid="help-azure-inventory-never-show-intro">
        {AZURE_INVENTORY_NEVER_SHOW_HELP_INTRO}
      </p>

      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_INVENTORY_NEVER_SHOW_HELP_CATALOG_HEADING}</h3>
      <ul className={listClassName} data-testid="help-azure-inventory-never-show-catalog">
        {catalogArmTypes.map((armType) => (
          <li key={armType}>
            <code className="text-sm text-al-text-secondary">{armType}</code>
          </li>
        ))}
      </ul>

      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_HEADING}</h3>
      <p className={readingBodyClass}>{AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_BODY}</p>
      <ul className={listClassName} data-testid="help-azure-inventory-never-show-last-segments">
        {lastSegments.map((segment) => (
          <li key={segment}>
            <code className="text-sm text-al-text-secondary">{segment}</code>
          </li>
        ))}
      </ul>

      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_HEADING}</h3>
      <p className={readingBodyClass}>{AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_BODY}</p>
      <ul className={listClassName} data-testid="help-azure-inventory-never-show-sql-names">
        {sqlDatabaseNames.map((databaseName) => (
          <li key={databaseName}>
            <code className="text-sm text-al-text-secondary">{databaseName}</code>
          </li>
        ))}
      </ul>

      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_HEADING}</h3>
      <ul className={cn("m-0 list-disc pl-5", readingBodyClass)} data-testid="help-azure-inventory-never-show-conditional">
        {AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className={readingBodyClass} data-testid="help-azure-inventory-never-show-diagrams">
        {AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_TOGGLE}{" "}
        <Link className={OPERATOR_LINK.inline} href={AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_PATH}>
          Open inventory diagrams
        </Link>
        .
      </p>
    </section>
  );
}
