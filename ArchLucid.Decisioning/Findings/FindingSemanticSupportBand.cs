namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-057 / ADR 0085: per-finding semantic support band on Working career surfaces (not a commit gate).
/// </summary>
public enum FindingSemanticSupportBand
{
    Supported,
    Unchecked,
    Unsupported,
    NotScored,
}
