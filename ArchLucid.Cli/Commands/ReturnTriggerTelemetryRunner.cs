namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetryRunner
{
    private static readonly string[] RequiredFixtureRelativePaths =
    [
        Path.Combine("docs", "go-to-market", "validation", "PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md"),
        Path.Combine("docs", "go-to-market", "validation", "templates", "principal-architect-dismissal-log.template.json"),
        Path.Combine("docs", "go-to-market", "templates", "principal-architect-session.template.json"),
        Path.Combine("docs", "go-to-market", "templates", "pilot-reuse-cohort-tracker.template.json"),
        Path.Combine("fixtures", "first-session", "dismissal-trigger.template.json"),
        Path.Combine("fixtures", "principal-architect", "return-trigger-capture.template.json"),
    ];

    internal ReturnTriggerTelemetryReport Run(string repositoryRoot, ReturnTriggerTelemetryOptions options, ReturnTriggerTelemetryRules rules)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rules);

        string ledgerDirectory = ResolveLedgerDirectory(repositoryRoot, options);
        List<ReturnTriggerTelemetryCheckResult> checks = new();
        checks.Add(BuildFixturePackCheck(repositoryRoot));
        checks.Add(BuildLedgerPresenceCheck(ledgerDirectory));

        IReadOnlyList<ReturnTriggerTelemetrySessionRecord> records =
            ReturnTriggerTelemetrySessionParser.LoadDirectory(ledgerDirectory);
        ReturnTriggerTelemetryCohortMetrics metrics = ReturnTriggerTelemetryAggregator.BuildMetrics(records, rules);
        checks.Add(BuildSessionVolumeCheck(metrics, rules));
        checks.Add(BuildGuardrailsCheck(metrics, rules));

        ReturnTriggerTelemetryVerdict overallVerdict = DeriveOverallVerdict(checks, metrics, rules);
        Dictionary<string, int> returnCounts = CountField(records, static record => record.ReturnTriggerCode);
        Dictionary<string, int> dismissalCounts = CountField(records, static record => record.DismissalTriggerCode);

        return new ReturnTriggerTelemetryReport
        {
            RepositoryRoot = repositoryRoot,
            LedgerDirectory = ledgerDirectory,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            Checks = checks,
            CohortMetrics = metrics,
            ReturnTriggerCounts = returnCounts,
            DismissalTriggerCounts = dismissalCounts,
        };
    }

    private static string ResolveLedgerDirectory(string repositoryRoot, ReturnTriggerTelemetryOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.LedgerDirectory))
            return Path.GetFullPath(options.LedgerDirectory);

        return Path.Combine(repositoryRoot, "fixtures", "principal-architect", "return-trigger-sessions");
    }

    private static ReturnTriggerTelemetryCheckResult BuildFixturePackCheck(string repositoryRoot)
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
            return new ReturnTriggerTelemetryCheckResult
            {
                Name = "Return-trigger fixture pack",
                Verdict = ReturnTriggerTelemetryVerdict.Pass,
                Evidence = $"All {RequiredFixtureRelativePaths.Length} required principal-architect telemetry assets are present.",
            };
        }

        return new ReturnTriggerTelemetryCheckResult
        {
            Name = "Return-trigger fixture pack",
            Verdict = ReturnTriggerTelemetryVerdict.Fail,
            Evidence = $"Missing telemetry assets: {string.Join(", ", missing)}.",
            Resolution = "Restore docs/templates from the repository before aggregating return-trigger telemetry.",
        };
    }

    private static ReturnTriggerTelemetryCheckResult BuildLedgerPresenceCheck(string ledgerDirectory)
    {
        if (Directory.Exists(ledgerDirectory))
        {
            return new ReturnTriggerTelemetryCheckResult
            {
                Name = "Telemetry ledger directory",
                Verdict = ReturnTriggerTelemetryVerdict.Pass,
                Evidence = $"Ledger directory exists at {ledgerDirectory}.",
            };
        }

        return new ReturnTriggerTelemetryCheckResult
        {
            Name = "Telemetry ledger directory",
            Verdict = ReturnTriggerTelemetryVerdict.Warn,
            Evidence = "Ledger directory is missing.",
            Resolution = "Create fixtures/principal-architect/return-trigger-sessions or pass --ledger-dir.",
        };
    }

    private static ReturnTriggerTelemetryCheckResult BuildSessionVolumeCheck(
        ReturnTriggerTelemetryCohortMetrics metrics,
        ReturnTriggerTelemetryRules rules)
    {
        if (metrics.SessionCount >= rules.MinSessionsForMessaging)
        {
            return new ReturnTriggerTelemetryCheckResult
            {
                Name = "Session volume",
                Verdict = ReturnTriggerTelemetryVerdict.Pass,
                Evidence = $"{metrics.SessionCount} telemetry records loaded (>= {rules.MinSessionsForMessaging}).",
            };
        }

        return new ReturnTriggerTelemetryCheckResult
        {
            Name = "Session volume",
            Verdict = ReturnTriggerTelemetryVerdict.Warn,
            Evidence = $"{metrics.SessionCount} telemetry records loaded (< {rules.MinSessionsForMessaging}).",
            Resolution = "File additional principal-architect session logs before strengthening voluntary-usage claims.",
        };
    }

    private static ReturnTriggerTelemetryCheckResult BuildGuardrailsCheck(
        ReturnTriggerTelemetryCohortMetrics metrics,
        ReturnTriggerTelemetryRules rules)
    {
        ReturnTriggerTelemetryVerdict verdict = ReturnTriggerTelemetryAggregator.EvaluateGuardrails(metrics, rules);

        if (verdict == ReturnTriggerTelemetryVerdict.Pass)
        {
            return new ReturnTriggerTelemetryCheckResult
            {
                Name = "Cohort guardrails",
                Verdict = ReturnTriggerTelemetryVerdict.Pass,
                Evidence =
                    $"Positive reuse fraction {metrics.PositiveReuseFraction:P0}; top return trigger {metrics.TopReturnTriggerCode}; top dismissal trigger {metrics.TopDismissalTriggerCode}.",
            };
        }

        if (verdict == ReturnTriggerTelemetryVerdict.Fail)
        {
            return new ReturnTriggerTelemetryCheckResult
            {
                Name = "Cohort guardrails",
                Verdict = ReturnTriggerTelemetryVerdict.Fail,
                Evidence =
                    $"Positive reuse fraction {metrics.PositiveReuseFraction:P0} below {rules.Guardrails.MinPositiveReuseFraction:P0} hold threshold.",
                Resolution = "Hold external voluntary-usage claims until the next cohort improves return-trigger signals.",
            };
        }

        return new ReturnTriggerTelemetryCheckResult
        {
            Name = "Cohort guardrails",
            Verdict = ReturnTriggerTelemetryVerdict.Warn,
            Evidence = "Insufficient telemetry volume to evaluate cohort guardrails.",
            Resolution = "Continue filing per-session return-trigger and dismissal logs.",
        };
    }

    private static ReturnTriggerTelemetryVerdict DeriveOverallVerdict(
        IReadOnlyList<ReturnTriggerTelemetryCheckResult> checks,
        ReturnTriggerTelemetryCohortMetrics metrics,
        ReturnTriggerTelemetryRules rules)
    {
        if (checks.Any(static check => check.Verdict == ReturnTriggerTelemetryVerdict.Fail))
            return ReturnTriggerTelemetryVerdict.Fail;

        ReturnTriggerTelemetryVerdict guardrails = ReturnTriggerTelemetryAggregator.EvaluateGuardrails(metrics, rules);

        if (guardrails == ReturnTriggerTelemetryVerdict.Fail)
            return ReturnTriggerTelemetryVerdict.Fail;

        if (checks.Any(static check => check.Verdict == ReturnTriggerTelemetryVerdict.Warn)
            || guardrails == ReturnTriggerTelemetryVerdict.Warn)
        {
            return ReturnTriggerTelemetryVerdict.Warn;
        }

        return ReturnTriggerTelemetryVerdict.Pass;
    }

    private static Dictionary<string, int> CountField(
        IReadOnlyList<ReturnTriggerTelemetrySessionRecord> records,
        Func<ReturnTriggerTelemetrySessionRecord, string?> selector)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (ReturnTriggerTelemetrySessionRecord record in records)
        {
            string? code = selector(record);

            if (string.IsNullOrWhiteSpace(code))
                continue;

            counts.TryGetValue(code, out int current);
            counts[code] = current + 1;
        }

        return counts;
    }
}
