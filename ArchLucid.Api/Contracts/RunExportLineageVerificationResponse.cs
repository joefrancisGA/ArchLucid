using ArchLucid.Application.Analysis;

namespace ArchLucid.Api.Contracts;

/// <summary>HTTP contract for <c>GET …/runs/{runId}/export/verify</c> (ADR 0040 / TB-307).</summary>
public sealed class RunExportLineageVerificationResponse
{
    public string Status
    {
        get;
        init;
    } = null!;

    public Guid RunId
    {
        get;
        init;
    }

    public Guid ManifestId
    {
        get;
        init;
    }

    public string? CommittedManifestHash
    {
        get;
        init;
    }

    public string? RecomputedManifestHash
    {
        get;
        init;
    }

    public string? Detail
    {
        get;
        init;
    }

    public static RunExportLineageVerificationResponse From(RunExportLineageVerificationResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new RunExportLineageVerificationResponse
        {
            Status = result.Status.ToString(),
            RunId = result.RunId,
            ManifestId = result.ManifestId,
            CommittedManifestHash = result.CommittedHash,
            RecomputedManifestHash = result.RecomputedHash,
            Detail = result.Detail
        };
    }
}
