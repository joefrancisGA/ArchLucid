namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>Outcome of testing whether the submitted passages occur in the cited artifacts.</summary>
public enum CitationProbeOutcome
{
    Unknown = 0,
    Untestable = 1,
    Refuted = 2,
    SurvivedWithinCitedSources = 3,
}
