using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerContext
{
    public string? RunId { get; init; }

    public string? RoiBasisStatus { get; init; }

    public bool? RoiSponsorSafe { get; init; }

    public string? SponsorPacketDisposition { get; init; }

    public string? Verdict { get; init; }

    public string? ProcurementDisposition { get; init; }

    public bool DecisionLedgerPresent { get; init; }

    public bool NoDecisionChangesConfirmed { get; init; }

    public int AttributedDecisionChangeCount { get; init; }

    public bool SponsorAcceptancePresent { get; init; }

    public bool PaidPilotLedgerPresent { get; init; }

    public bool PaidPilotBaselineConfidencePresent { get; init; }

    public bool PaidPilotDecisionChangedPresent { get; init; }

    public bool PaidPilotSponsorActionPresent { get; init; }

    public string? ProofSendability { get; init; }

    public string? EvidenceCompleteness { get; init; }

    public bool ProofPackageCompletenessPresent { get; init; }
}

internal sealed class BuyerProofEvidenceLedgerRules
{
    public int SchemaVersion { get; init; }

    public List<BuyerProofEvidenceLedgerSlotRule> CanonicalSlots { get; init; } = [];

    public List<string> RoiBasisIncompleteValues { get; init; } = [];

    public List<string> SponsorSendDispositions { get; init; } = [];

    public List<string> ProcurementPassDispositions { get; init; } = [];

    public List<string> ProofSendableValues { get; init; } = [];
}

internal sealed class BuyerProofEvidenceLedgerSlotRule
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public bool RequiredForSponsorSend { get; init; }
}

internal static class BuyerProofEvidenceLedgerRulesLoader
{
    private const string DefaultRulesFileName = "buyer_proof_evidence_ledger_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static BuyerProofEvidenceLedgerRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        BuyerProofEvidenceLedgerRules? rules = JsonSerializer.Deserialize<BuyerProofEvidenceLedgerRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Buyer-proof evidence ledger rules are missing or empty: {path}");

        if (rules.CanonicalSlots.Count == 0)
            throw new InvalidOperationException($"Buyer-proof evidence ledger rules must define canonicalSlots: {path}");

        return rules;
    }

    private static string ResolveDefaultRulesPath()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "Data", DefaultRulesFileName);

        if (File.Exists(bundled))
            return bundled;

        string repoRelative = Path.GetFullPath(
            Path.Combine(baseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", DefaultRulesFileName));

        if (File.Exists(repoRelative))
            return repoRelative;

        throw new FileNotFoundException(
            $"Buyer-proof evidence ledger rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}
