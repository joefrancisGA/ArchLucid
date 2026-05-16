using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Bootstrap;

/// <summary>Deterministic scope + run identifiers for Workspace A (<c>/reviews/{runId}</c> marketing anchors).</summary>
internal static class ProductTourDemoIds
{
    /// <summary>Returns the seeded architecture review authority run identifier for <paramref name="tenantId"/>.</summary>
    /// <remarks>Stable for <see cref="ScopeIds.DefaultTenant"/> (<c>b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf</c>).</remarks>
    internal static Guid AuthorityRunId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.AuthorityRun", tenantId.ToString("N"));
    }

    internal static Guid WorkspaceRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.Workspace", tenantId.ToString("N"));
    }

    internal static Guid ProjectScopeRowId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.DefaultProjectScope", tenantId.ToString("N"));
    }

    internal static string ArchitectureRequestId(Guid tenantId)
    {
        return tenantId == ScopeIds.DefaultTenant
            ? "req-northwind-product-tour-contoso-cloud"
            : $"req-northwind-product-tour-{tenantId:N}";
    }

    internal static Guid ExportRecordId(Guid tenantId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.ExportRecord", tenantId.ToString("N"));
    }

    internal static Guid ArtifactBundleId(Guid authorityRunId)
    {
        return DeriveGuid("ArchLucid.Demo.ProductTour.ArtifactBundle", authorityRunId.ToString("N"));
    }

    internal static Guid TourReportArtifactId(Guid authorityRunId)
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
