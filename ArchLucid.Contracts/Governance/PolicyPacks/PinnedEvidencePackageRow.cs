namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>
///     Wave-6 suggestion 51/55: extractor package id and provider pinned on the run at create time.
/// </summary>
public sealed record PinnedEvidencePackageRow(
    string Provider,
    Guid PackageId,
    DateTime? CollectionUtc);
