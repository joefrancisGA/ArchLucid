using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Tenant-scoped identifiers for the Contoso Retail Modernization demo seed. The SQL schema uses
///     global primary keys on several demo tables (for example <c>dbo.Runs.RunId</c>, <c>dbo.AgentTasks.TaskId</c>),
///     so a second self-service tenant in the same catalog cannot reuse the same keys as another tenant.
///     <see cref="ScopeIds.DefaultTenant"/> keeps the historical canonical constants so local dev URLs stay stable.
/// </summary>
public readonly record struct ContosoRetailDemoIds(
    string RequestId,
    Guid AuthorityRunBaselineId,
    Guid AuthorityRunHardenedId,
    string RunBaseline,
    string RunHardened,
    string ManifestBaseline,
    string ManifestHardened,
    string ApprovalRequest,
    string PromotionRecord,
    string ActivationDev,
    string ActivationTest,
    string ExportRecord,
    string TaskBaseline,
    string TaskHardened,
    string ResultBaseline,
    string ResultHardened,
    string TraceBaseline,
    string TraceHardened)
{
    /// <summary>Builds stable per-tenant keys and deterministic run GUIDs for idempotent re-seeding.</summary>
    public static ContosoRetailDemoIds ForTenant(Guid tenantId)
    {
        if (tenantId == ScopeIds.DefaultTenant)
            return CanonicalSingleCatalog();
        string t = tenantId.ToString("N");
        string suffix = t.Length >= 12 ? t[..12] : t;
        Guid baselineRun = DeriveDemoRunGuid(tenantId, "baseline");
        Guid hardenedRun = DeriveDemoRunGuid(tenantId, "hardened");
        return new ContosoRetailDemoIds($"req-contoso-demo-{suffix}", baselineRun, hardenedRun, baselineRun.ToString("N"), hardenedRun.ToString("N"),
            $"contoso-baseline-v1-{suffix}", $"contoso-hardened-v1-{suffix}", $"apr-demo-{suffix}", $"promo-demo-{suffix}", $"act-demo-dev-{suffix}",
            $"act-demo-test-{suffix}", $"export-demo-bl-{suffix}", $"task-baseline-demo-topo-{suffix}", $"task-hardened-demo-topo-{suffix}",
            $"result-baseline-demo-topo-{suffix}", $"result-hardened-demo-topo-{suffix}", $"trace-baseline-demo-{suffix}", $"trace-hardened-demo-{suffix}");
    }

    /// <summary>Historical single-tenant keys (development default scope) documented in <c>docs/TRUSTED_BASELINE.md</c>.</summary>
    private static ContosoRetailDemoIds CanonicalSingleCatalog()
    {
        return new ContosoRetailDemoIds(ContosoRetailDemoIdentifiers.RequestContoso, ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            ContosoRetailDemoIdentifiers.AuthorityRunHardenedId, ContosoRetailDemoIdentifiers.RunBaseline, ContosoRetailDemoIdentifiers.RunHardened,
            ContosoRetailDemoIdentifiers.ManifestBaseline, ContosoRetailDemoIdentifiers.ManifestHardened, ContosoRetailDemoIdentifiers.ApprovalRequest,
            ContosoRetailDemoIdentifiers.PromotionRecord, ContosoRetailDemoIdentifiers.ActivationDev, ContosoRetailDemoIdentifiers.ActivationTest,
            ContosoRetailDemoIdentifiers.ExportRecord, "task-baseline-demo-topo", "task-hardened-demo-topo", "result-baseline-demo-topo",
            "result-hardened-demo-topo", "trace-baseline-demo-001", "trace-hardened-demo-001");
    }

    /// <summary>Authority <c>dbo.Runs.RunId</c> for the trial ecommerce welcome sample (per-tenant).</summary>
    public static Guid TrialWelcomeAuthorityRunId(Guid tenantId)
    {
        return DeriveDemoRunGuid(tenantId, "trial-welcome");
    }

    /// <summary>Stable <c>ArchitectureRequests.RequestId</c> for the welcome sample.</summary>
    public static string TrialWelcomeRequestId(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant ? "request-contoso-trial-welcome" : $"req-trial-welcome-{DemoSuffix12(tenantId)}";
    }

    /// <summary>Committed manifest version key for the welcome sample.</summary>
    public static string TrialWelcomeManifestVersion(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant ? "contoso-online-store-welcome-v1" : $"contoso-online-store-welcome-v1-{DemoSuffix12(tenantId)}";
    }

    /// <summary>Agent task / result identifiers for the welcome sample (global string PKs).</summary>
    public static (string TopoTask, string CostTask, string CompTask, string TopoResult, string CostResult, string CompResult) TrialWelcomeAgentKeys(
        Guid tenantId)
    {
        string suffix = tenantId == ScopeIds.DefaultTenant ? "canonical" : DemoSuffix12(tenantId);

        return (
            $"task-trial-welcome-topo-{suffix}",
            $"task-trial-welcome-cost-{suffix}",
            $"task-trial-welcome-comp-{suffix}",
            $"result-trial-welcome-topo-{suffix}",
            $"result-trial-welcome-cost-{suffix}",
            $"result-trial-welcome-comp-{suffix}");
    }

    private static string DemoSuffix12(Guid tenantId)
    {
        string t = tenantId.ToString("N");

        return t.Length >= 12 ? t[..12] : t;
    }

    private static Guid DeriveDemoRunGuid(Guid tenantId, string role)
    {
        return GuidFromUtf8("ArchLucid.ContosoRetail.Demo.Run", tenantId.ToString("N"), role);
    }

    private static Guid GuidFromUtf8(string purpose, params string[] segments)
    {
        StringBuilder builder = new();
        builder.Append(purpose);
        foreach (string segment in segments)
        {
            builder.Append('\u001e');
            builder.Append(segment);
        }

        byte[] utf8 = Encoding.UTF8.GetBytes(builder.ToString());
        using SHA256 sha = SHA256.Create();
        byte[] hash = sha.ComputeHash(utf8);
        Span<byte> guidBytes = stackalloc byte[16];
        hash.AsSpan(0, 16).CopyTo(guidBytes);
        return new Guid(guidBytes);
    }
}
