using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Scoping;

/// <summary>Tenant-scoped GUIDs for Workspace B (synthetic regulated / AI governance scenario) under <see cref="ScopeIds"/> defaults.</summary>
public static class DemoRegulatedScenarioWorkspaceIds
{
    /// <summary>Row <c>dbo.TenantWorkspaces.Id</c> for Workspace B demo catalog.</summary>
    public static Guid WorkspaceRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.Workspace", tenantId.ToString("N"));
    }

    /// <summary>Row <c>dbo.Projects.Id</c> used as <c>ScopeContext.ProjectId</c> for seeded regulated runs.</summary>
    public static Guid ProjectScopeRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.DefaultProjectScope", tenantId.ToString("N"));
    }

    /// <summary>Authority row <c>dbo.Runs.RunId</c> for the committed synthetic regulated review.</summary>
    public static Guid AuthorityRunId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.AuthorityRun", tenantId.ToString("N"));
    }

    /// <summary>Stable architecture request identifier for SQL <c>ImportedArchitectureRequests.RequestId</c>.</summary>
    public static string ArchitectureRequestId(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant
            ? "req-meridian-alpine-patient-risk-governance-demo"
            : $"req-meridian-alpine-regulated-{tenantId:N}";
    }

    /// <summary><c>dbo.RunExportRecords.ExportRecordId</c> (<c>N</c> format string in rows).</summary>
    public static Guid ExportRecordId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.ExportRecord", tenantId.ToString("N"));
    }

    /// <summary>Artifact bundle for the seeded regulated run.</summary>
    public static Guid ArtifactBundleId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.ArtifactBundle", authorityRunId.ToString("N"));
    }

    /// <summary>Primary synthesized board packet artifact placeholder.</summary>
    public static Guid RegulatedDeliverableArtifactId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.RegulatedScenario.RegulatedArtifact", authorityRunId.ToString("N"));
    }

    private static Guid DeriveGuid(string purpose, string segment)
    {
        StringBuilder builder = new();
        builder.Append(purpose);
        builder.Append('\u001e');
        builder.Append(segment);
        byte[] utf8 = Encoding.UTF8.GetBytes(builder.ToString());
        using SHA256 sha = SHA256.Create();
        byte[] hash = sha.ComputeHash(utf8);
        Span<byte> digestPrefix = stackalloc byte[16];

        hash.AsSpan(0, 16).CopyTo(digestPrefix);

        return new Guid(digestPrefix, bigEndian: true);
    }
}
