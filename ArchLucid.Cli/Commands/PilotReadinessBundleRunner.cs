using ArchLucid.Cli.Commands.PilotReadiness;

namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleRunner
{
    private const string OfflineTenantIsolationManifestRelative =
        "fixtures/tenant-isolation/offline-release-train-manifest.v1.json";

    private readonly IReadOnlyList<IPilotReadinessSlotRunner> _slotRunners;

    internal PilotReadinessBundleRunner()
        : this(CreateDefaultSlotRunners())
    {
    }

    internal PilotReadinessBundleRunner(IReadOnlyList<IPilotReadinessSlotRunner> slotRunners)
    {
        _slotRunners = slotRunners ?? throw new ArgumentNullException(nameof(slotRunners));
    }

    internal async Task<PilotReadinessBundleReport> RunAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions options,
        HttpClient? httpClient,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string[] rawArgs,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rawArgs);

        PilotReadinessSlotRunContext context = new()
        {
            RepositoryRoot = repositoryRoot,
            Options = options,
            HttpClient = httpClient,
            Config = config,
            RawArgs = rawArgs,
        };

        List<PilotReadinessBundleSlotResult> slots = new(capacity: _slotRunners.Count);

        foreach (IPilotReadinessSlotRunner slotRunner in _slotRunners)
            slots.Add(await slotRunner.RunAsync(context, cancellationToken));

        return new PilotReadinessBundleReport
        {
            RepositoryRoot = repositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            RunId = string.IsNullOrWhiteSpace(options.RunId) ? null : options.RunId.Trim(),
            OverallVerdict = PilotReadinessBundleVerdictRollup.FromSlots(slots),
            Slots = slots,
        };
    }

    private static IReadOnlyList<IPilotReadinessSlotRunner> CreateDefaultSlotRunners() =>
    [
        new BuyerProofEvidenceLedgerSlotRunner(),
        new FuncPilotReadinessSlotRunner(RunReturnTriggerTelemetrySlotAsync),
        new FuncPilotReadinessSlotRunner(RunDecisionOwnerScoreboardSlotAsync),
        new FuncPilotReadinessSlotRunner(RunFrontierAiBaselineSlotAsync),
        new CitationIntegritySlotRunner(),
        new FuncPilotReadinessSlotRunner(RunTenantIsolationSlotAsync),
        new FuncPilotReadinessSlotRunner(RunItsmPullForwardSlotAsync),
        new FuncPilotReadinessSlotRunner(RunShipGateEvidenceSlotAsync),
    ];

    private static async Task<PilotReadinessBundleSlotResult> RunReturnTriggerTelemetrySlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        ReturnTriggerTelemetryOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(childOptions.RulesPath);
        ReturnTriggerTelemetryRunner runner = new();
        ReturnTriggerTelemetryReport report = runner.Run(context.RepositoryRoot, childOptions, rules);
        string artifactKey = ReturnTriggerTelemetryOutputPaths.ResolveArtifactKey(report);
        ReturnTriggerTelemetryOutputResolution outputPaths =
            ReturnTriggerTelemetryOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        ReturnTriggerTelemetryReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteReturnTriggerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.ReturnTriggerTelemetry,
            "Return-trigger telemetry",
            PilotReadinessBundleVerdictMapper.FromReturnTrigger(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; ledger `{finalReport.LedgerDirectory}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunDecisionOwnerScoreboardSlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        DecisionOwnerScoreboardOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(childOptions.RulesPath);
        DecisionOwnerScoreboardRunner runner = new();
        DecisionOwnerScoreboardReport report = runner.Run(context.RepositoryRoot, childOptions, rules);
        string artifactKey = DecisionOwnerScoreboardOutputPaths.ResolveArtifactKey(report);
        DecisionOwnerScoreboardOutputResolution outputPaths =
            DecisionOwnerScoreboardOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        DecisionOwnerScoreboardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath,
            outputPaths.SponsorMarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteDecisionOwnerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.DecisionOwnerScoreboard,
            "Decision-owner scoreboard",
            PilotReadinessBundleVerdictMapper.FromDecisionOwner(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; {finalReport.Rows.Count} ledger row(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath,
            finalReport.SponsorMarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunFrontierAiBaselineSlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        FrontierAiBaselineOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(context.RepositoryRoot, childOptions);
        string artifactKey = FrontierAiBaselineOutputPaths.ResolveArtifactKey(report);
        FrontierAiBaselineOutputResolution outputPaths =
            FrontierAiBaselineOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        FrontierAiBaselineReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteFrontierAiAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.FrontierAiBaseline,
            "Frontier-AI baseline",
            PilotReadinessBundleVerdictMapper.FromFrontierAi(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; scoreboard `{finalReport.ScoreboardPath}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunTenantIsolationSlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        TenantIsolationNegativeTestOptions childOptions = new()
        {
            RunId = context.Options.RunId,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
            ManifestPath = string.IsNullOrWhiteSpace(context.Options.RunId)
                ? Path.Combine(context.RepositoryRoot, OfflineTenantIsolationManifestRelative)
                : null,
        };
        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report;

        if (!string.IsNullOrWhiteSpace(childOptions.RunId))
        {
            if (context.HttpClient is null)
                throw new InvalidOperationException("Tenant-isolation live API mode requires a configured HTTP client.");

            (string tenantId, string workspaceId, string projectId) =
                TenantIsolationNegativeTestRunner.ResolveAlternateScope(childOptions);

            string baseUrl = context.HttpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            using HttpClient alternateClient = CliAuthorizedHttpClient.Create(baseUrl, context.Config);
            CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);

            report = await runner.RunLiveAsync(
                context.RepositoryRoot,
                context.HttpClient,
                alternateClient,
                childOptions,
                cancellationToken);
        }
        else
        {
            report = runner.RunOffline(context.RepositoryRoot, childOptions);
        }

        string artifactKey = TenantIsolationNegativeTestOutputPaths.ResolveArtifactKey(report);
        TenantIsolationNegativeTestOutputResolution outputPaths =
            TenantIsolationNegativeTestOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        TenantIsolationNegativeTestReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteTenantIsolationAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = finalReport.LiveApiMode ? "live-api" : "offline-fixture";

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.TenantIsolationNegativeTest,
            "Tenant-isolation negative test",
            PilotReadinessBundleVerdictMapper.FromTenantIsolation(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; mode {modeLabel}; {finalReport.Probes.Count} probe(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunItsmPullForwardSlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        ItsmPullForwardOptions childOptions = new()
        {
            IncludeApi = context.Options.IncludeApi,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(context.RepositoryRoot, childOptions);

        if (childOptions.IncludeApi)
        {
            if (context.HttpClient is null)
                throw new InvalidOperationException("ITSM pull-forward live API mode requires a configured HTTP client.");

            string baseUrl = context.HttpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            PilotPreflightRunner preflightRunner = new(context.HttpClient);
            PilotPreflightReport preflightReport = await preflightRunner.RunAsync(
                baseUrl,
                [],
                new PilotPreflightOptions { IncludeItsm = true },
                cancellationToken);
            PilotPreflightStepResult? itsmStep = preflightReport.Steps.FirstOrDefault(static step => step.Name == "itsm-health");

            if (itsmStep is not null)
            {
                List<ItsmPullForwardCheckResult> checks = report.Checks.ToList();
                checks.Add(ItsmPullForwardRunner.BuildApiHealthCheck(itsmStep));
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
            else
            {
                report = new ItsmPullForwardReport
                {
                    RepositoryRoot = report.RepositoryRoot,
                    LedgerDirectory = report.LedgerDirectory,
                    BaseUrl = baseUrl,
                    GeneratedUtc = report.GeneratedUtc,
                    Recommendation = report.Recommendation,
                    Checks = report.Checks,
                    Triggers = report.Triggers,
                    LedgerFilesScanned = report.LedgerFilesScanned,
                };
            }
        }

        string artifactKey = ItsmPullForwardOutputPaths.ResolveArtifactKey(report);
        ItsmPullForwardOutputResolution outputPaths =
            ItsmPullForwardOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        ItsmPullForwardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteItsmPullForwardAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = childOptions.IncludeApi ? "live-api" : "offline-ledger";

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.ItsmPullForwardGate,
            "ITSM pull-forward gate",
            PilotReadinessBundleVerdictMapper.FromItsmPullForward(finalReport),
            $"Recommendation {finalReport.Recommendation}; mode {modeLabel}; {finalReport.Triggers.ActivatedTriggerCount} activated trigger(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunShipGateEvidenceSlotAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(context.Options.RunId))
        {
            return new PilotReadinessBundleSlotResult
            {
                SlotKey = PilotReadinessBundleSlots.ShipGateEvidence,
                DisplayName = "Ship-gate evidence",
                Verdict = PilotReadinessBundleSlotVerdict.Skipped,
                Evidence =
                    "Live ship-gate evidence requires --run-id; re-run with a representative completed first-review run id.",
            };
        }

        if (context.HttpClient is null)
            throw new InvalidOperationException("Ship-gate evidence requires a configured HTTP client.");

        ShipGateEvidenceOptions childOptions = new()
        {
            RunId = context.Options.RunId.Trim(),
            UiBaseUrl = context.Options.UiBaseUrl,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        ShipGateUiBaseUrlResolution uiOrigin = ShipGateUiBaseUrlResolver.Resolve(context.RawArgs, context.Config);
        ShipGateEvidenceRunner runner = new(context.HttpClient, context.Config);
        ShipGateEvidenceReport report = await runner.RunAsync(
            childOptions.RunId,
            uiOrigin.BaseUrl,
            uiOrigin.Source,
            childOptions.ToTenantIsolationOptions(),
            childOptions.SkipClaimLint,
            cancellationToken);
        ShipGateEvidenceOutputResolution outputPaths =
            ShipGateEvidenceOutputPaths.Resolve(childOptions, context.RepositoryRoot, report.RunId);
        ShipGateEvidenceReport finalReport = report.WithOutputMetadata(
            context.RepositoryRoot,
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteShipGateAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return PilotReadinessSlotRunnerBase.BuildSlotResult(
            PilotReadinessBundleSlots.ShipGateEvidence,
            "Ship-gate evidence",
            PilotReadinessBundleVerdictMapper.FromShipGate(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; run `{finalReport.RunId}`; {finalReport.Gates.Count} gate(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
