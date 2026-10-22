namespace ArchLucid.Application.Bootstrap;

/// <summary>Trial welcome ecommerce sample payloads for self-service onboarding seed.</summary>
internal static partial class TrialWelcomeWorkspaceSeed
{
    internal const string SystemName = "Retail Online Store";

    private static readonly DateTime SeedUtc = new(2025, 6, 15, 14, 30, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal const string ArchitectureBriefText =
        "Retail Online Store is retiring a decade-old monolith that still serves catalog search, cart, checkout, and payment handoff from shared VMs. "
        + "Leadership chose Azure for elastic scale ahead of peak holidays. The target exposes a React storefront on Azure Static Web Apps behind Azure Front Door with regional WAF rules, OWASP defaults, and bot management. "
        + "A Node commerce BFF runs on Azure Container Apps inside a dedicated spoke, calling catalog and order microservices that are also on Container Apps with workload identities to Azure SQL and Redis. "
        + "Checkout never persists payment cards; instead a payment adapter integrates with an external processor over private connectivity and Key Vault–backed secrets. "
        + "Customer profile data must stay in EU regions, so primary writes land in a West Europe Azure SQL failover group with geo-redundant backups, while media sits in zone-redundant storage accounts with lifecycle rules. "
        + "Observability standardizes on Application Insights with distributed tracing across Front Door, BFF, and downstream APIs, plus budget alerts tied to cost management exports. "
        + "Delivery follows a strangler pattern: extract catalog and inventory read paths first, then checkout orchestration, while legacy APIs remain behind compatibility routes until traffic drains. "
        + "Quality gates include blue/green releases for the storefront, automated failover tests for SQL, chaos drills on private link dependencies, and quarterly tabletop exercises for payment outages. "
        + "Sponsor constraints include EU residency for PII, an order-path recovery time under four hours, and elimination of any public SQL endpoints.";
}
