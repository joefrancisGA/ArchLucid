using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

/// <summary>Result of <see cref="IDecisionReceiptService.BuildForRunAsync" /> with distinct export outcomes.</summary>
public sealed record DecisionReceiptRunBuildResult
{
    public required DecisionReceiptRunBuildOutcome Outcome { get; init; }

    public DecisionReceiptDocument? Receipt { get; init; }

    public string? BlockReasonCode { get; init; }

    public string? BlockReason { get; init; }
}
