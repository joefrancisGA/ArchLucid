namespace ArchLucid.Application.Analysis;

/// <summary>Read-only report from <see cref="IRunExportLineageVerifier" /> (ADR 0040 / TB-307).</summary>
public sealed class RunExportLineageVerificationResult
{
    public RunExportLineageVerificationStatus Status
    {
        get;
        init;
    }

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

    public string? CommittedHash
    {
        get;
        init;
    }

    public string? RecomputedHash
    {
        get;
        init;
    }

    public string? Detail
    {
        get;
        init;
    }
}
