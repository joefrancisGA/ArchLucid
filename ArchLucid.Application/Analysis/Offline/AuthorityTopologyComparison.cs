namespace ArchLucid.Application.Analysis;

/// <summary>Offline observation only. No member can authorize reuse or bind a checkpoint.</summary>
internal sealed record AuthorityTopologyComparison(
    AuthorityTopologyComparisonOutcome Outcome, string Reason,
    string? BaselineFingerprint = null, string? CandidateFingerprint = null,
    bool? EngineMultisetMatches = null, bool? EngineSequenceMatches = null,
    bool? AuthorityMergeSequenceMatches = null, bool? PathEvidenceMatches = null);
