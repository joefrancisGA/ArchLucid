namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerCheckResult
{
    public string Name { get; init; } = string.Empty;

    public BuyerProofEvidenceLedgerVerdict Verdict { get; init; }

    public string Evidence { get; init; } = string.Empty;

    public string? Resolution { get; init; }
}
