namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleRunner
{
    private const string OfflineCitationIntegrityManifestRelative =
        "fixtures/citation-integrity/offline-release-train-manifest.v1.json";

    private const string OfflineTenantIsolationManifestRelative =
        "fixtures/tenant-isolation/offline-release-train-manifest.v1.json";

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

        List<PilotReadinessBundleSlotResult> slots = new(capacity: 8);

        slots.Add(await RunBuyerProofEvidenceLedgerSlotAsync(repositoryRoot, options, cancellationToken));
        slots.Add(await RunReturnTriggerTelemetrySlotAsync(repositoryRoot, options, cancellationToken));
        slots.Add(await RunDecisionOwnerScoreboardSlotAsync(repositoryRoot, options, cancellationToken));
        slots.Add(await RunFrontierAiBaselineSlotAsync(repositoryRoot, options, cancellationToken));
        slots.Add(await RunCitationIntegritySlotAsync(repositoryRoot, options, httpClient, rawArgs, cancellationToken));
        slots.Add(await RunTenantIsolationSlotAsync(repositoryRoot, options, httpClient, config, cancellationToken));
        slots.Add(await RunItsmPullForwardSlotAsync(repositoryRoot, options, httpClient, cancellationToken));
        slots.Add(await RunShipGateEvidenceSlotAsync(repositoryRoot, options, httpClient, config, rawArgs, cancellationToken));

        return new PilotReadinessBundleReport
        {
            RepositoryRoot = repositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            RunId = string.IsNullOrWhiteSpace(options.RunId) ? null : options.RunId.Trim(),
            OverallVerdict = PilotReadinessBundleVerdictRollup.FromSlots(slots),
            Slots = slots,
        };
    }

    private static async Task<PilotReadinessBundleSlotResult> RunBuyerProofEvidenceLedgerSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        CancellationToken cancellationToken)
    {
        BuyerProofEvidenceLedgerOptions childOptions = new()
        {
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(childOptions.RulesPath);
        BuyerProofEvidenceLedgerRunner runner = new();
        BuyerProofEvidenceLedgerReport report = runner.Run(repositoryRoot, childOptions, rules);
        string artifactKey = BuyerProofEvidenceLedgerOutputPaths.ResolveArtifactKey(report);
        BuyerProofEvidenceLedgerOutputResolution outputPaths =
            BuyerProofEvidenceLedgerOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        BuyerProofEvidenceLedgerReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteBuyerProofAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.BuyerProofEvidenceLedger,
            "Buyer-proof evidence ledger",
            PilotReadinessBundleVerdictMapper.FromBuyerProof(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; {finalReport.NormalizedSlots.Count} normalized slot(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunReturnTriggerTelemetrySlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        CancellationToken cancellationToken)
    {
        ReturnTriggerTelemetryOptions childOptions = new()
        {
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        ReturnTriggerTelemetryRules rules = ReturnTriggerTelemetryRulesLoader.Load(childOptions.RulesPath);
        ReturnTriggerTelemetryRunner runner = new();
        ReturnTriggerTelemetryReport report = runner.Run(repositoryRoot, childOptions, rules);
        string artifactKey = ReturnTriggerTelemetryOutputPaths.ResolveArtifactKey(report);
        ReturnTriggerTelemetryOutputResolution outputPaths =
            ReturnTriggerTelemetryOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        ReturnTriggerTelemetryReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteReturnTriggerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.ReturnTriggerTelemetry,
            "Return-trigger telemetry",
            PilotReadinessBundleVerdictMapper.FromReturnTrigger(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; ledger `{finalReport.LedgerDirectory}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunDecisionOwnerScoreboardSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        CancellationToken cancellationToken)
    {
        DecisionOwnerScoreboardOptions childOptions = new()
        {
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(childOptions.RulesPath);
        DecisionOwnerScoreboardRunner runner = new();
        DecisionOwnerScoreboardReport report = runner.Run(repositoryRoot, childOptions, rules);
        string artifactKey = DecisionOwnerScoreboardOutputPaths.ResolveArtifactKey(report);
        DecisionOwnerScoreboardOutputResolution outputPaths =
            DecisionOwnerScoreboardOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        DecisionOwnerScoreboardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath,
            outputPaths.SponsorMarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteDecisionOwnerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.DecisionOwnerScoreboard,
            "Decision-owner scoreboard",
            PilotReadinessBundleVerdictMapper.FromDecisionOwner(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; {finalReport.Rows.Count} ledger row(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath,
            finalReport.SponsorMarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunFrontierAiBaselineSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        CancellationToken cancellationToken)
    {
        FrontierAiBaselineOptions childOptions = new()
        {
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(repositoryRoot, childOptions);
        string artifactKey = FrontierAiBaselineOutputPaths.ResolveArtifactKey(report);
        FrontierAiBaselineOutputResolution outputPaths =
            FrontierAiBaselineOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        FrontierAiBaselineReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteFrontierAiAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.FrontierAiBaseline,
            "Frontier-AI baseline",
            PilotReadinessBundleVerdictMapper.FromFrontierAi(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; scoreboard `{finalReport.ScoreboardPath}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunCitationIntegritySlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        HttpClient? httpClient,
        string[] rawArgs,
        CancellationToken cancellationToken)
    {
        CitationIntegrityOptions childOptions = new()
        {
            IncludeApi = bundleOptions.IncludeApi,
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
            ManifestPath = bundleOptions.IncludeApi
                ? null
                : Path.Combine(repositoryRoot, OfflineCitationIntegrityManifestRelative),
        };
        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(childOptions.RulesPath);
        CitationIntegrityRunner runner = new();
        CitationIntegrityReport report;

        if (childOptions.IncludeApi)
        {
            if (httpClient is null)
                throw new InvalidOperationException("Citation integrity live API mode requires a configured HTTP client.");

            report = await runner.RunWithApiAsync(repositoryRoot, httpClient, childOptions, rules, cancellationToken);
        }
        else
        {
            report = runner.RunOffline(repositoryRoot, childOptions, rules);
        }

        string artifactKey = CitationIntegrityOutputPaths.ResolveArtifactKey(report);
        CitationIntegrityOutputResolution outputPaths =
            CitationIntegrityOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        CitationIntegrityReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteCitationAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = childOptions.IncludeApi ? "live-api" : "offline-fixture";

        return BuildSlotResult(
            PilotReadinessBundleSlots.CitationIntegrity,
            "Citation integrity",
            PilotReadinessBundleVerdictMapper.FromCitation(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; mode {modeLabel}; {finalReport.RunsWithFailIssues} run(s) with FAIL issues.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunTenantIsolationSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        HttpClient? httpClient,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        CancellationToken cancellationToken)
    {
        TenantIsolationNegativeTestOptions childOptions = new()
        {
            RunId = bundleOptions.RunId,
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
            ManifestPath = string.IsNullOrWhiteSpace(bundleOptions.RunId)
                ? Path.Combine(repositoryRoot, OfflineTenantIsolationManifestRelative)
                : null,
        };
        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report;

        if (!string.IsNullOrWhiteSpace(childOptions.RunId))
        {
            if (httpClient is null)
                throw new InvalidOperationException("Tenant-isolation live API mode requires a configured HTTP client.");

            (string tenantId, string workspaceId, string projectId) =
                TenantIsolationNegativeTestRunner.ResolveAlternateScope(childOptions);

            string baseUrl = httpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            using HttpClient alternateClient = CliAuthorizedHttpClient.Create(baseUrl, config);
            CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);

            report = await runner.RunLiveAsync(
                repositoryRoot,
                httpClient,
                alternateClient,
                childOptions,
                cancellationToken);
        }
        else
        {
            report = runner.RunOffline(repositoryRoot, childOptions);
        }

        string artifactKey = TenantIsolationNegativeTestOutputPaths.ResolveArtifactKey(report);
        TenantIsolationNegativeTestOutputResolution outputPaths =
            TenantIsolationNegativeTestOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        TenantIsolationNegativeTestReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteTenantIsolationAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = finalReport.LiveApiMode ? "live-api" : "offline-fixture";

        return BuildSlotResult(
            PilotReadinessBundleSlots.TenantIsolationNegativeTest,
            "Tenant-isolation negative test",
            PilotReadinessBundleVerdictMapper.FromTenantIsolation(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; mode {modeLabel}; {finalReport.Probes.Count} probe(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunItsmPullForwardSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        HttpClient? httpClient,
        CancellationToken cancellationToken)
    {
        ItsmPullForwardOptions childOptions = new()
        {
            IncludeApi = bundleOptions.IncludeApi,
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        ItsmPullForwardRunner runner = new();
        ItsmPullForwardReport report = runner.Run(repositoryRoot, childOptions);

        if (childOptions.IncludeApi)
        {
            if (httpClient is null)
                throw new InvalidOperationException("ITSM pull-forward live API mode requires a configured HTTP client.");

            string baseUrl = httpClient.BaseAddress!.ToString().Trim().TrimEnd('/');
            PilotPreflightRunner preflightRunner = new(httpClient);
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
            ItsmPullForwardOutputPaths.Resolve(childOptions, repositoryRoot, artifactKey);
        ItsmPullForwardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteItsmPullForwardAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = childOptions.IncludeApi ? "live-api" : "offline-ledger";

        return BuildSlotResult(
            PilotReadinessBundleSlots.ItsmPullForwardGate,
            "ITSM pull-forward gate",
            PilotReadinessBundleVerdictMapper.FromItsmPullForward(finalReport),
            $"Recommendation {finalReport.Recommendation}; mode {modeLabel}; {finalReport.Triggers.ActivatedTriggerCount} activated trigger(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static async Task<PilotReadinessBundleSlotResult> RunShipGateEvidenceSlotAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions bundleOptions,
        HttpClient? httpClient,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string[] rawArgs,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(bundleOptions.RunId))
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

        if (httpClient is null)
            throw new InvalidOperationException("Ship-gate evidence requires a configured HTTP client.");

        ShipGateEvidenceOptions childOptions = new()
        {
            RunId = bundleOptions.RunId.Trim(),
            UiBaseUrl = bundleOptions.UiBaseUrl,
            SuppressDefaultArtifacts = bundleOptions.SuppressDefaultArtifacts,
        };
        ShipGateUiBaseUrlResolution uiOrigin = ShipGateUiBaseUrlResolver.Resolve(rawArgs, config);
        ShipGateEvidenceRunner runner = new(httpClient, config);
        ShipGateEvidenceReport report = await runner.RunAsync(
            childOptions.RunId,
            uiOrigin.BaseUrl,
            uiOrigin.Source,
            childOptions.ToTenantIsolationOptions(),
            childOptions.SkipClaimLint,
            cancellationToken);
        ShipGateEvidenceOutputResolution outputPaths =
            ShipGateEvidenceOutputPaths.Resolve(childOptions, repositoryRoot, report.RunId);
        ShipGateEvidenceReport finalReport = report.WithOutputMetadata(
            repositoryRoot,
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteShipGateAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.ShipGateEvidence,
            "Ship-gate evidence",
            PilotReadinessBundleVerdictMapper.FromShipGate(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; run `{finalReport.RunId}`; {finalReport.Gates.Count} gate(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }

    private static PilotReadinessBundleSlotResult BuildSlotResult(
        string slotKey,
        string displayName,
        PilotReadinessBundleSlotVerdict verdict,
        string evidence,
        string? jsonArtifactPath,
        string? markdownArtifactPath,
        string? sponsorMarkdownArtifactPath = null) =>
        new()
        {
            SlotKey = slotKey,
            DisplayName = displayName,
            Verdict = verdict,
            Evidence = evidence,
            JsonArtifactPath = jsonArtifactPath,
            MarkdownArtifactPath = markdownArtifactPath,
            SponsorMarkdownArtifactPath = sponsorMarkdownArtifactPath,
        };
}
