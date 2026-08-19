namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerReport
{
    public string RepositoryRoot { get; init; } = string.Empty;

    public string ProofDirectory { get; init; } = string.Empty;

    public DateTime GeneratedUtc { get; init; }

    public BuyerProofEvidenceLedgerVerdict OverallVerdict { get; init; }

    public IReadOnlyList<BuyerProofEvidenceLedgerCheckResult> Checks { get; init; } = [];

    public IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> NormalizedSlots { get; init; } = [];

    public string? RunId { get; init; }

    public string? RoiBasisStatus { get; init; }

    public bool? RoiSponsorSafe { get; init; }

    public string? SponsorPacketDisposition { get; init; }

    public bool AnyFail => OverallVerdict == BuyerProofEvidenceLedgerVerdict.Fail;

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }

    internal BuyerProofEvidenceLedgerReport WithOutputMetadata(
        string? jsonArtifactPath,
        string? markdownArtifactPath) =>
        new()
        {
            RepositoryRoot = RepositoryRoot,
            ProofDirectory = ProofDirectory,
            GeneratedUtc = GeneratedUtc,
            OverallVerdict = OverallVerdict,
            Checks = Checks,
            NormalizedSlots = NormalizedSlots,
            RunId = RunId,
            RoiBasisStatus = RoiBasisStatus,
            RoiSponsorSafe = RoiSponsorSafe,
            SponsorPacketDisposition = SponsorPacketDisposition,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
        };
}
