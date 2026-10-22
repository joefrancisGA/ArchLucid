namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Wave-5 suggestion 42: policy pack id, version, and create-time enforcement settings pinned on the run.
/// </summary>
public sealed record PinnedPolicyPackRow(
    string PolicyPackId,
    string PolicyPackVersion,
    bool BlockCommitOnCritical = false,
    int? BlockCommitMinimumSeverity = null);
