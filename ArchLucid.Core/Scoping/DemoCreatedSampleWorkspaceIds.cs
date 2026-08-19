namespace ArchLucid.Core.Scoping;

/// <summary>
/// Tenant-scoped GUIDs for the born-governed <strong>created</strong> architecture package sample
/// (Northwind Copilot RAG platform) seeded in the default demo scope.
/// </summary>
public static class DemoCreatedSampleWorkspaceIds
{
    /// <summary>Buyer-facing slug for static showcase payloads and registry deep links.</summary>
    public const string ShowcaseRunSlug = "northwind-copilot-rag-platform";

    /// <summary>Authority row <c>dbo.Runs.RunId</c> for the committed synthetic created package.</summary>
    public static Guid AuthorityRunId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.CreatedSample.AuthorityRun", tenantId.ToString("N"));
    }

    /// <summary>Stable architecture request identifier for SQL <c>ImportedArchitectureRequests.RequestId</c>.</summary>
    public static string ArchitectureRequestId(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant
            ? "req-northwind-copilot-rag-created-sample"
            : $"req-northwind-copilot-rag-created-{tenantId:N}";
    }

    /// <summary><c>dbo.RunExportRecords.ExportRecordId</c> (<c>N</c> format string in rows).</summary>
    public static Guid ExportRecordId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.CreatedSample.ExportRecord", tenantId.ToString("N"));
    }

    /// <summary>Artifact bundle for the seeded created sample run.</summary>
    public static Guid ArtifactBundleId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.CreatedSample.ArtifactBundle", authorityRunId.ToString("N"));
    }

    /// <summary>Primary synthesized export artifact for the created sample.</summary>
    public static Guid CreatedPackageArtifactId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.CreatedSample.CreatedPackageArtifact", authorityRunId.ToString("N"));
    }

    private static Guid DeriveGuid(string purpose, string segment) =>
        StableShaKeyedGuidDerivation.GuidFromPurposeSeparatorAndSegmentUtf8Keyed(purpose, segment);
}
