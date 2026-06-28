namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardRunner
{
    private static readonly string[] RequiredFixtureRelativePaths =
    [
        Path.Combine("docs", "go-to-market", "templates", "pilot-decision-ledger.template.json"),
        Path.Combine("fixtures", "decision-owner-scoreboard", "scoreboard-capture.template.json"),
    ];

    internal DecisionOwnerScoreboardReport Run(
        string repositoryRoot,
        DecisionOwnerScoreboardOptions options,
        DecisionOwnerScoreboardRules rules)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rules);

        DateTime evaluationUtc = DateTime.UtcNow;
        string ledgerDirectory = ResolveLedgerDirectory(repositoryRoot, options);
        List<DecisionOwnerScoreboardCheckResult> checks = new();
        checks.Add(BuildFixturePackCheck(repositoryRoot));
        checks.Add(BuildLedgerPresenceCheck(ledgerDirectory));

        IReadOnlyList<DecisionOwnerLedgerRecord> records = DecisionOwnerScoreboardParser.LoadDirectory(ledgerDirectory);
        IReadOnlyList<DecisionOwnerScoreboardRow> rows =
            DecisionOwnerScoreboardNormalizer.BuildRows(records, rules, evaluationUtc);
        DecisionOwnerScoreboardVerdict rowVerdict =
            DecisionOwnerScoreboardNormalizer.DeriveOverallVerdict(rows, records, rules);
        checks.Add(BuildAccountabilityCoverageCheck(rows, rowVerdict));

        DecisionOwnerScoreboardVerdict overallVerdict = DeriveOverallVerdict(checks, rowVerdict);

        DecisionOwnerScoreboardReport partialReport = new()
        {
            RepositoryRoot = repositoryRoot,
            LedgerDirectory = ledgerDirectory,
            GeneratedUtc = evaluationUtc,
            OverallVerdict = overallVerdict,
            Checks = checks,
            Rows = rows,
        };

        return new DecisionOwnerScoreboardReport
        {
            RepositoryRoot = partialReport.RepositoryRoot,
            LedgerDirectory = partialReport.LedgerDirectory,
            GeneratedUtc = partialReport.GeneratedUtc,
            OverallVerdict = partialReport.OverallVerdict,
            Checks = partialReport.Checks,
            Rows = partialReport.Rows,
            OperatorMarkdown = DecisionOwnerScoreboardNormalizer.BuildOperatorMarkdown(partialReport, overallVerdict),
            SponsorMarkdown = DecisionOwnerScoreboardNormalizer.BuildSponsorMarkdown(partialReport, overallVerdict),
        };
    }

    private static string ResolveLedgerDirectory(string repositoryRoot, DecisionOwnerScoreboardOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.LedgerDirectory))
            return Path.GetFullPath(options.LedgerDirectory);

        return Path.Combine(repositoryRoot, "fixtures", "decision-owner-scoreboard", "sample-ledgers");
    }

    private static DecisionOwnerScoreboardCheckResult BuildFixturePackCheck(string repositoryRoot)
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
            return new DecisionOwnerScoreboardCheckResult
            {
                Name = "Decision-owner fixture pack",
                Verdict = DecisionOwnerScoreboardVerdict.Pass,
                Evidence = $"All {RequiredFixtureRelativePaths.Length} required decision-owner scoreboard assets are present.",
            };
        }

        return new DecisionOwnerScoreboardCheckResult
        {
            Name = "Decision-owner fixture pack",
            Verdict = DecisionOwnerScoreboardVerdict.Fail,
            Evidence = $"Missing scoreboard assets: {string.Join(", ", missing)}.",
            Resolution = "Restore docs/templates from the repository before building decision-owner scoreboards.",
        };
    }

    private static DecisionOwnerScoreboardCheckResult BuildLedgerPresenceCheck(string ledgerDirectory)
    {
        if (Directory.Exists(ledgerDirectory))
        {
            return new DecisionOwnerScoreboardCheckResult
            {
                Name = "Decision ledger directory",
                Verdict = DecisionOwnerScoreboardVerdict.Pass,
                Evidence = $"Ledger directory exists at {ledgerDirectory}.",
            };
        }

        return new DecisionOwnerScoreboardCheckResult
        {
            Name = "Decision ledger directory",
            Verdict = DecisionOwnerScoreboardVerdict.Fail,
            Evidence = "Ledger directory is missing.",
            Resolution = "Create fixtures/decision-owner-scoreboard/sample-ledgers or pass --ledger-dir.",
        };
    }

    private static DecisionOwnerScoreboardCheckResult BuildAccountabilityCoverageCheck(
        IReadOnlyList<DecisionOwnerScoreboardRow> rows,
        DecisionOwnerScoreboardVerdict rowVerdict)
    {
        if (rows.Count == 0)
        {
            return new DecisionOwnerScoreboardCheckResult
            {
                Name = "Accountability coverage",
                Verdict = DecisionOwnerScoreboardVerdict.Warn,
                Evidence = "No decision rows loaded from ledgers.",
                Resolution = "File pilot-decision-ledger.json with decisionsUnderReview and owner fields.",
            };
        }

        int resolvedCount = rows.Count(static row =>
            row.AccountabilityStatus is "owned-and-resolved" or "not-applicable");

        if (rowVerdict == DecisionOwnerScoreboardVerdict.Fail)
        {
            return new DecisionOwnerScoreboardCheckResult
            {
                Name = "Accountability coverage",
                Verdict = DecisionOwnerScoreboardVerdict.Fail,
                Evidence =
                    $"{resolvedCount}/{rows.Count} decisions resolved; unowned, overdue, or attributed-without-outcome rows present.",
                Resolution = "Assign buyer-side decision owners and record ownerOutcome before sponsor send.",
            };
        }

        if (rowVerdict == DecisionOwnerScoreboardVerdict.Warn)
        {
            return new DecisionOwnerScoreboardCheckResult
            {
                Name = "Accountability coverage",
                Verdict = DecisionOwnerScoreboardVerdict.Warn,
                Evidence = $"{resolvedCount}/{rows.Count} decisions resolved; some rows remain owned-pending.",
                Resolution = "Acceptable for self-serve pilots; complete outcomes before paid sponsor send.",
            };
        }

        return new DecisionOwnerScoreboardCheckResult
        {
            Name = "Accountability coverage",
            Verdict = DecisionOwnerScoreboardVerdict.Pass,
            Evidence = $"All {rows.Count} decision rows meet accountability completion criteria.",
        };
    }

    private static DecisionOwnerScoreboardVerdict DeriveOverallVerdict(
        IReadOnlyList<DecisionOwnerScoreboardCheckResult> checks,
        DecisionOwnerScoreboardVerdict rowVerdict)
    {
        if (checks.Any(static check => check.Verdict == DecisionOwnerScoreboardVerdict.Fail))
            return DecisionOwnerScoreboardVerdict.Fail;

        if (rowVerdict == DecisionOwnerScoreboardVerdict.Fail)
            return DecisionOwnerScoreboardVerdict.Fail;

        if (checks.Any(static check => check.Verdict == DecisionOwnerScoreboardVerdict.Warn)
            || rowVerdict == DecisionOwnerScoreboardVerdict.Warn)
        {
            return DecisionOwnerScoreboardVerdict.Warn;
        }

        return DecisionOwnerScoreboardVerdict.Pass;
    }
}
