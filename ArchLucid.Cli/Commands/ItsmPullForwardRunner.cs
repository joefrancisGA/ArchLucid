namespace ArchLucid.Cli.Commands;

internal sealed class ItsmPullForwardRunner
{
    private const int PullForwardTriggerThreshold = 2;

    private static readonly string[] RequiredDecisionRelativePaths =
    [
        Path.Combine("docs", "go-to-market", "GTM_BACKLOG.md"),
        Path.Combine("docs", "go-to-market", "validation", "templates", "paid-pilot-evidence-ledger.template.json"),
        Path.Combine("fixtures", "itsm", "connector-pull-forward-evidence.template.json"),
    ];

    private static readonly string[] V1OutboundSeamRelativePaths =
    [
        Path.Combine("ArchLucid.Api", "Controllers", "Integrations", "ItsmOutboundIssuesController.cs"),
        Path.Combine("ArchLucid.Api", "Controllers", "Integrations", "ItsmIntegrationHealthController.cs"),
        Path.Combine("ArchLucid.Core", "Persistence", "ApplicationPorts", "Integrations", "IItsmFindingCorrelationRepository.cs"),
    ];

    internal ItsmPullForwardReport Run(string repositoryRoot, ItsmPullForwardOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);

        if (options is null)
            throw new ArgumentNullException(nameof(options));

        List<ItsmPullForwardCheckResult> checks = new();
        checks.Add(BuildDecisionFrameworkCheck(repositoryRoot));
        checks.Add(BuildV1OutboundSeamCheck(repositoryRoot));

        int ledgerFilesScanned = ItsmPullForwardEvidenceParser.CountLedgerFiles(repositoryRoot, options);
        checks.Add(BuildEvidenceLedgerCheck(ledgerFilesScanned));

        ItsmPullForwardTriggerCounts triggers = ItsmPullForwardEvidenceParser.AggregateTriggers(repositoryRoot, options);
        checks.Add(BuildTriggerEvaluationCheck(triggers));

        ItsmPullForwardVerdict recommendation = DeriveRecommendation(triggers);
        string ledgerDirectory = ItsmPullForwardEvidenceParser.ResolveLedgerDirectory(
            repositoryRoot,
            options.LedgerDirectory);

        return new ItsmPullForwardReport
        {
            RepositoryRoot = repositoryRoot,
            LedgerDirectory = ledgerDirectory,
            GeneratedUtc = DateTime.UtcNow,
            Recommendation = recommendation,
            Checks = checks,
            Triggers = triggers,
            LedgerFilesScanned = ledgerFilesScanned,
        };
    }

    internal static ItsmPullForwardCheckResult BuildApiHealthCheck(PilotPreflightStepResult probeResult)
    {
        if (probeResult.Disposition == PilotPreflightDisposition.Pass)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "V1 ITSM health probe",
                Verdict = ItsmPullForwardVerdict.Hold,
                Evidence = probeResult.Detail,
            };
        }

        return new ItsmPullForwardCheckResult
        {
            Name = "V1 ITSM health probe",
            Verdict = ItsmPullForwardVerdict.Watch,
            Evidence = probeResult.Detail,
            Resolution = probeResult.Remediation ?? "Confirm ITSM outbound settings before promising native create in pilots.",
        };
    }

    private static ItsmPullForwardCheckResult BuildDecisionFrameworkCheck(string repositoryRoot)
    {
        List<string> missing = RequiredDecisionRelativePaths
            .Where(relativePath => !File.Exists(Path.Combine(repositoryRoot, relativePath)))
            .Select(static relativePath => relativePath.Replace('\\', '/'))
            .ToList();

        if (missing.Count == 0)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "Pull-forward decision framework",
                Verdict = ItsmPullForwardVerdict.Hold,
                Evidence = "Decision doc and evidence templates are present.",
            };
        }

        return new ItsmPullForwardCheckResult
        {
            Name = "Pull-forward decision framework",
            Verdict = ItsmPullForwardVerdict.Watch,
            Evidence = $"Missing decision assets: {string.Join(", ", missing)}.",
            Resolution = "Restore GTM_BACKLOG.md (closed hold decisions) and evidence templates before running the gate.",
        };
    }

    private static ItsmPullForwardCheckResult BuildV1OutboundSeamCheck(string repositoryRoot)
    {
        List<string> missing = V1OutboundSeamRelativePaths
            .Where(relativePath => !File.Exists(Path.Combine(repositoryRoot, relativePath)))
            .Select(static relativePath => relativePath.Replace('\\', '/'))
            .ToList();

        if (missing.Count == 0)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "V1 outbound ITSM seam",
                Verdict = ItsmPullForwardVerdict.Hold,
                Evidence = "Outbound create, health, and correlation repository surfaces are present in-repo.",
            };
        }

        return new ItsmPullForwardCheckResult
        {
            Name = "V1 outbound ITSM seam",
            Verdict = ItsmPullForwardVerdict.Watch,
            Evidence = $"Missing V1 seam files: {string.Join(", ", missing)}.",
            Resolution = "Restore V1 outbound ITSM surfaces before revisiting connector pull-forward scope.",
        };
    }

    private static ItsmPullForwardCheckResult BuildEvidenceLedgerCheck(int ledgerFilesScanned)
    {
        if (ledgerFilesScanned > 0)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "Paid-pilot evidence ledgers",
                Verdict = ItsmPullForwardVerdict.Hold,
                Evidence = $"{ledgerFilesScanned} ledger file(s) scanned for connector-gap blockers.",
            };
        }

        return new ItsmPullForwardCheckResult
        {
            Name = "Paid-pilot evidence ledgers",
            Verdict = ItsmPullForwardVerdict.Watch,
            Evidence = "No paid-pilot ledger files found; market trigger counts rely on --evidence only.",
            Resolution = "Log paid pilot retros under artifacts/validation/paid-pilot-ledgers or pass --ledger-dir.",
        };
    }

    private static ItsmPullForwardCheckResult BuildTriggerEvaluationCheck(ItsmPullForwardTriggerCounts triggers)
    {
        int activated = triggers.ActivatedTriggerCount;

        if (activated >= PullForwardTriggerThreshold)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "Pull-forward trigger threshold",
                Verdict = ItsmPullForwardVerdict.PullForward,
                Evidence = BuildTriggerEvidence(triggers),
                Resolution = "Owner decision required before pulling V1.1 connector work forward.",
            };
        }

        if (activated == 1)
        {
            return new ItsmPullForwardCheckResult
            {
                Name = "Pull-forward trigger threshold",
                Verdict = ItsmPullForwardVerdict.Watch,
                Evidence = BuildTriggerEvidence(triggers),
                Resolution = "Continue HOLD; monitor for a second independent pull-forward trigger.",
            };
        }

        return new ItsmPullForwardCheckResult
        {
            Name = "Pull-forward trigger threshold",
            Verdict = ItsmPullForwardVerdict.Hold,
            Evidence = BuildTriggerEvidence(triggers),
            Resolution = "Default HOLD remains correct — do not pull V1.1 connectors forward without more evidence.",
        };
    }

    private static string BuildTriggerEvidence(ItsmPullForwardTriggerCounts triggers)
    {
        return
            $"connector-primary blockers={triggers.ConnectorPrimaryBlockerPilotCount}; "
            + $"SOW-contingent={triggers.SowContingentOnConnectorCount}; "
            + $"manual-handoff-dominates={triggers.ManualHandoffDominatesSecondReviewCount}; "
            + $"activated={triggers.ActivatedTriggerCount}/{PullForwardTriggerThreshold}.";
    }

    private static ItsmPullForwardVerdict DeriveRecommendation(ItsmPullForwardTriggerCounts triggers)
    {
        int activated = triggers.ActivatedTriggerCount;

        if (activated >= PullForwardTriggerThreshold)
            return ItsmPullForwardVerdict.PullForward;

        if (activated == 1)
            return ItsmPullForwardVerdict.Watch;

        return ItsmPullForwardVerdict.Hold;
    }
}
