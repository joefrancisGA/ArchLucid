namespace ArchLucid.Core.Configuration;

/// <summary>
///     Controls whether technology-consistency findings block commit or surface as warnings only.
/// </summary>
public enum TechnologyConsistencyFindingEngineMode
{
    /// <summary>Emit <c>Warning</c> severity findings; commit blocks only when pre-commit thresholds include Warning.</summary>
    WarnOnly = 0,

    /// <summary>Emit <c>Error</c> severity findings so standard pre-commit severity thresholds can block commit.</summary>
    Enforcing = 1,
}
