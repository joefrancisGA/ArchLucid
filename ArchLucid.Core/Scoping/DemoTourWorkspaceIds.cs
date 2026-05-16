using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Scoping;

/// <summary>Tenant-scoped GUIDs and request keys for Workspace A (self-demo / Product Tour) seeded under <see cref="ScopeIds"/> defaults.</summary>
public static class DemoTourWorkspaceIds
{
    /// <summary>Row <c>dbo.TenantWorkspaces.Id</c> for the tour workspace.</summary>
    public static Guid WorkspaceRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.Workspace", tenantId.ToString("N"));
    }

    /// <summary>Row <c>dbo.Projects.Id</c> used as <c>ScopeContext.ProjectId</c> for seeded tour runs.</summary>
    public static Guid ProjectScopeRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.DefaultProjectScope", tenantId.ToString("N"));
    }

    /// <summary>Authority row <c>dbo.Runs.RunId</c> for the committed synthetic review.</summary>
    public static Guid AuthorityRunId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.AuthorityRun", tenantId.ToString("N"));
    }

    /// <summary>Stable architecture request identifier string for SQL <c>ImportedArchitectureRequests.RequestId</c> / tour narrative.</summary>
    public static string ArchitectureRequestId(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant
            ? "req-northwind-product-tour-contoso-cloud"
            : $"req-northwind-product-tour-{tenantId:N}";
    }

    /// <summary>Seed <c>dbo.RunExportRecords.ExportRecordId</c> (stored as <c>N</c> string).</summary>
    public static Guid ExportRecordId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.ExportRecord", tenantId.ToString("N"));
    }

    /// <summary>Artifact bundle row for the seeded tour run.</summary>
    public static Guid ArtifactBundleId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.ArtifactBundle", authorityRunId.ToString("N"));
    }

    /// <summary>Primary synthesized artifact id for the seeded tour export affordance.</summary>
    public static Guid TourReportArtifactId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.TourReportArtifact", authorityRunId.ToString("N"));
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
        Span<byte> guidBytes = stackalloc byte[16];
        hash.AsSpan(0, 16).CopyTo(guidBytes);

        return new Guid(guidBytes);
    }
}
