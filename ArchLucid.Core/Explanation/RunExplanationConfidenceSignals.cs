namespace ArchLucid.Core.Explanation;

/// <summary>Faithfulness inputs for sponsor-safe explanation disposition (#20).</summary>
public sealed record RunExplanationConfidenceSignals(
    double? FaithfulnessSupportRatio,
    bool DeterministicFallbackUsed,
    string? FaithfulnessWarning,
    int? CitationCount);
