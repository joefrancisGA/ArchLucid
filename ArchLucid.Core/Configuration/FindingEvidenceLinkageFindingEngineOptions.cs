namespace ArchLucid.Core.Configuration;

/// <summary>
///     Options for deterministic finding-to-evidence linkage checks before commit.
/// </summary>
public sealed class FindingEvidenceLinkageFindingEngineOptions
{
    public const string SectionPath = "FindingEvidenceLinkage";

    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>When true, linkage gaps surface as warnings; when false, as errors.</summary>
    public bool WarnOnly
    {
        get;
        set;
    } = true;
}
