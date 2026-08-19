namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofEvidenceLedgerRunner
{
    private static readonly string[] RequiredFixtureRelativePaths =
    [
        Path.Combine("docs", "go-to-market", "QUOTE_TO_PROOF_PACKET.md"),
        Path.Combine("docs", "go-to-market", "validation", "PAID_PILOT_EVIDENCE_LEDGER.md"),
        Path.Combine("docs", "go-to-market", "validation", "templates", "paid-pilot-evidence-ledger.template.json"),
        Path.Combine("docs", "go-to-market", "templates", "pilot-decision-ledger.template.json"),
        Path.Combine("fixtures", "buyer-proof-evidence", "normalized-ledger.template.json"),
    ];

    internal BuyerProofEvidenceLedgerReport Run(
        string repositoryRoot,
        BuyerProofEvidenceLedgerOptions options,
        BuyerProofEvidenceLedgerRules rules)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rules);

        string proofDirectory = ResolveProofDirectory(repositoryRoot, options);
        List<BuyerProofEvidenceLedgerCheckResult> checks = new();
        checks.Add(BuildFixturePackCheck(repositoryRoot));
        checks.Add(BuildProofDirectoryCheck(proofDirectory));

        BuyerProofEvidenceLedgerContext context = BuyerProofEvidenceLedgerParser.LoadDirectory(proofDirectory);
        IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> slots =
            BuyerProofEvidenceLedgerNormalizer.NormalizeSlots(context, rules);
        checks.Add(BuildCanonicalSlotCoverageCheck(slots));

        BuyerProofEvidenceLedgerVerdict overallVerdict =
            BuyerProofEvidenceLedgerNormalizer.DeriveOverallVerdict(checks, slots);

        return new BuyerProofEvidenceLedgerReport
        {
            RepositoryRoot = repositoryRoot,
            ProofDirectory = proofDirectory,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            Checks = checks,
            NormalizedSlots = slots,
            RunId = context.RunId,
            RoiBasisStatus = context.RoiBasisStatus,
            RoiSponsorSafe = context.RoiSponsorSafe,
            SponsorPacketDisposition = context.SponsorPacketDisposition ?? context.Verdict,
        };
    }

    private static string ResolveProofDirectory(string repositoryRoot, BuyerProofEvidenceLedgerOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.ProofDirectory))
            return Path.GetFullPath(options.ProofDirectory);

        return Path.Combine(repositoryRoot, "fixtures", "buyer-proof-evidence", "sample-proof-pack");
    }

    private static BuyerProofEvidenceLedgerCheckResult BuildFixturePackCheck(string repositoryRoot)
    {
        List<string> missing = new();

        foreach (string relativePath in RequiredFixtureRelativePaths)
        {
            string absolutePath = Path.Combine(repositoryRoot, relativePath);

            if (!File.Exists(absolutePath))
                missing.Add(relativePath.Replace('\\', '/'));
        }

        if (missing.Count == 0)
        {
            return new BuyerProofEvidenceLedgerCheckResult
            {
                Name = "Buyer-proof fixture pack",
                Verdict = BuyerProofEvidenceLedgerVerdict.Pass,
                Evidence = $"All {RequiredFixtureRelativePaths.Length} required buyer-proof ledger assets are present.",
            };
        }

        return new BuyerProofEvidenceLedgerCheckResult
        {
            Name = "Buyer-proof fixture pack",
            Verdict = BuyerProofEvidenceLedgerVerdict.Fail,
            Evidence = $"Missing buyer-proof assets: {string.Join(", ", missing)}.",
            Resolution = "Restore docs/templates from the repository before normalizing buyer-proof evidence ledgers.",
        };
    }

    private static BuyerProofEvidenceLedgerCheckResult BuildProofDirectoryCheck(string proofDirectory)
    {
        if (Directory.Exists(proofDirectory))
        {
            return new BuyerProofEvidenceLedgerCheckResult
            {
                Name = "Proof directory",
                Verdict = BuyerProofEvidenceLedgerVerdict.Pass,
                Evidence = $"Proof directory exists at {proofDirectory}.",
            };
        }

        return new BuyerProofEvidenceLedgerCheckResult
        {
            Name = "Proof directory",
            Verdict = BuyerProofEvidenceLedgerVerdict.Fail,
            Evidence = "Proof directory is missing.",
            Resolution = "Create fixtures/buyer-proof-evidence/sample-proof-pack or pass --proof-dir.",
        };
    }

    private static BuyerProofEvidenceLedgerCheckResult BuildCanonicalSlotCoverageCheck(
        IReadOnlyList<BuyerProofEvidenceLedgerSlotStatus> slots)
    {
        int completeCount = slots.Count(static slot => slot.NormalizedStatus == "Complete");
        int requiredFailCount = slots.Count(static slot =>
            slot.RequiredForSponsorSend && slot.Verdict == BuyerProofEvidenceLedgerVerdict.Fail);

        if (requiredFailCount > 0)
        {
            return new BuyerProofEvidenceLedgerCheckResult
            {
                Name = "Canonical proof-completion slots",
                Verdict = BuyerProofEvidenceLedgerVerdict.Fail,
                Evidence = $"{requiredFailCount} sponsor-send slot(s) failed normalization ({completeCount}/{slots.Count} complete).",
                Resolution = "Resolve failed slots before external sponsor circulation.",
            };
        }

        if (completeCount == slots.Count)
        {
            return new BuyerProofEvidenceLedgerCheckResult
            {
                Name = "Canonical proof-completion slots",
                Verdict = BuyerProofEvidenceLedgerVerdict.Pass,
                Evidence = $"All {slots.Count} canonical proof-completion slots normalized to Complete.",
            };
        }

        return new BuyerProofEvidenceLedgerCheckResult
        {
            Name = "Canonical proof-completion slots",
            Verdict = BuyerProofEvidenceLedgerVerdict.Warn,
            Evidence = $"{completeCount}/{slots.Count} slots Complete; optional slots may remain Partial or Missing.",
            Resolution = "Export optional proof-package completeness and paid-pilot ledger rows when available.",
        };
    }
}
