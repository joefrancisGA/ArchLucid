import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { INTERNAL_OPS_ROOT_PATH } from "@/lib/internal-ops-route-paths";
import { AGENT_MODEL_CATALOG_PAGE_TITLE } from "@/lib/agent-model-catalog-page-copy";

/** Internal Operations trail for agent model catalog (ING). */
export function AgentModelCatalogBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="agent-model-catalog-page-breadcrumb"
      items={[
        { label: "Internal", href: INTERNAL_OPS_ROOT_PATH },
        { label: AGENT_MODEL_CATALOG_PAGE_TITLE },
      ]}
    />
  );
}
