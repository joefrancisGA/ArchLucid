namespace ArchLucid.Cli.Commands;

/// <summary>Inline Terraform ordering (see <c>docs/library/REFERENCE_SAAS_STACK_ORDER.md</c>).</summary>
internal static class DeploymentEvidenceTerraformReference
{
    internal const string DocumentationRelativePath = "docs/library/REFERENCE_SAAS_STACK_ORDER.md";

    internal static IReadOnlyList<string> DefaultApplyOrderRoots()
    {
        return
        [
            "infra/terraform-pilot — canonical profile (outputs + validation; no resources).",
            "infra/terraform-private",
            "infra/terraform-keyvault",
            "infra/terraform-sql-failover",
            "infra/terraform-storage",
            "infra/terraform-servicebus",
            "infra/terraform-logicapps",
            "infra/terraform-openai",
            "infra/terraform-entra",
            "infra/terraform-container-apps",
            "infra/terraform-edge",
            "infra/terraform",
            "infra/terraform-monitoring",
            "infra/terraform-orchestrator"
        ];
    }
}
