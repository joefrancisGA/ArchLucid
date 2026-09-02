namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Wave-5 suggestion 42: policy pack id and version pinned on the run at create time.
/// </summary>
public sealed record PinnedPolicyPackRow(string PolicyPackId, string PolicyPackVersion);
