namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     Cites the change-log rows used to resolve older vs newer pack content for a compounding ledger.
/// </summary>
public sealed class PolicyPackCompoundingEvidenceChangeLogCitation
{
    public required Guid ChangeLogId { get; init; }

    public required string ChangeType { get; init; }

    public required string SummaryText { get; init; }

    public required DateTime ChangedUtc { get; init; }
}
