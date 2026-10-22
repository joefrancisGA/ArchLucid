namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardRow
{
    public string DecisionId { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string? DecisionOwner { get; init; }

    public string? LinkedFindingId { get; init; }

    public string? EvidenceChainId { get; init; }

    public string? OwnerOutcome { get; init; }

    public DateTime? OutcomeRecordedUtc { get; init; }

    public string? ItsmTicketRef { get; init; }

    public DateTime? RemediationDueUtc { get; init; }

    public bool Overdue { get; init; }

    public string AccountabilityStatus { get; init; } = string.Empty;
}
