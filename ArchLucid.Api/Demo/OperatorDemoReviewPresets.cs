using ArchLucid.Application.Governance.DefaultPolicyPacks;

namespace ArchLucid.Api.Demo;

/// <summary>Hardcoded flawed architecture input for the operator one-click demo review path.</summary>
public static class OperatorDemoReviewPresets
{
    /// <summary>Built-in platform pack highlighted in the demo CTA and response.</summary>
    public const string HighlightPolicyPackDisplayName = DefaultPolicyPackCatalog.SecurityBaselineDisplayName;

    public const string SystemDisplayName = "Acme Corp HR Portal (Policy Demo)";

    public const string ArchitectureDescription =
        "Azure-hosted HR self-service portal for 12,000 employees. "
        + "App Service (public ingress, no WAF) fronting an Azure SQL database with public network access enabled. "
        + "Employee document uploads land in a storage account with anonymous blob read on the documents container. "
        + "Application settings store storage account keys; no managed identity for data-plane access. "
        + "Outbound traffic is unrestricted; no private endpoints for SQL or storage. "
        + "Diagnostic logs are disabled on App Service and SQL.";

    public static readonly string[] Constraints =
    [
        "Demonstration-only one-click review path",
        "Policy-aware governance demo — built-in Security Architecture Baseline",
        "Intentionally weak posture for teaching findings"
    ];

    public static readonly string[] RequiredCapabilities =
    [
        "Public web ingress",
        "Document upload storage",
        "Relational employee data store"
    ];
}
