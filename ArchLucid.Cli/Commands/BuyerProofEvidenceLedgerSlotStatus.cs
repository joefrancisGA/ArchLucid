namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerSlotStatus
{
    public string SlotId { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public BuyerProofEvidenceLedgerVerdict Verdict { get; init; }

    public string NormalizedStatus { get; init; } = string.Empty;

    public string Evidence { get; init; } = string.Empty;

    public bool RequiredForSponsorSend { get; init; }
}
