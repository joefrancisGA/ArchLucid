using System.Globalization;
using System.Text;

using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Builds a sponsor-facing Markdown summary for a single architecture run (read-only projection).
/// </summary>
/// <remarks>
///     Computed deltas (wall-clock, findings-by-severity, audit rows, LLM calls, top-severity evidence chain) are
///     resolved by <see cref = "IPilotRunDeltaComputer"/> so this builder and <see cref = "SponsorOnePagerPdfBuilder"/>
///     stay in lockstep — the same numbers appear in the Markdown sibling and in the sponsor PDF wrapper.
///     A sponsor-safe proof-status block (<see cref = "SponsorSafeProofStatusMarkdownFormatter"/>) is emitted immediately after
///     the prose preface — it reuses <see cref = "PilotBuyerSafeEvidenceGateEvaluator"/> and <see cref = "PilotProofPackageCompletenessMapper"/> only.
///     The review-cycle delta section uses the same <see cref = "ValueReportSnapshot"/> as the tenant value-report DOCX
///     (default 30-day UTC window ending now; see <c>ValueReportController</c>).
/// </remarks>
public sealed class FirstValueReportBuilder(
    IRunDetailQueryService runDetailQuery,
    IPilotRunDeltaComputer deltaComputer,
    ValueReportBuilder valueReportBuilder,
    IScopeContextProvider scopeProvider,
    IExecutionProvenanceFooterRenderer executionProvenanceFooter,
    IConfiguration configuration,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    ITenantFirstValueReportBrandingRepository tenantFirstValueReportBrandingRepository,
    IPilotBaselineRepository pilotBaselineRepository,
    ILogger<FirstValueReportBuilder> logger) : IFirstValueReportBuilder
{
    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions = publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    /// <summary>Sponsor-facing banner appended above any computed line for runs that match the demo seed.</summary>
    private const string DemoTenantBanner = "_demo tenant — replace before publishing._";

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    private readonly IPilotRunDeltaComputer _deltaComputer = deltaComputer ?? throw new ArgumentNullException(nameof(deltaComputer));

    private readonly IExecutionProvenanceFooterRenderer _executionProvenanceFooter =
        executionProvenanceFooter ?? throw new ArgumentNullException(nameof(executionProvenanceFooter));

    private readonly ITenantFirstValueReportBrandingRepository _tenantFirstValueReportBrandingRepository =
        tenantFirstValueReportBrandingRepository ?? throw new ArgumentNullException(nameof(tenantFirstValueReportBrandingRepository));

    private readonly IPilotBaselineRepository _pilotBaselineRepository =
        pilotBaselineRepository ?? throw new ArgumentNullException(nameof(pilotBaselineRepository));

    private readonly ILogger<FirstValueReportBuilder> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IRunDetailQueryService _runDetailQuery = runDetailQuery ?? throw new ArgumentNullException(nameof(runDetailQuery));
    private readonly IScopeContextProvider _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly ValueReportBuilder _valueReportBuilder = valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    /// <summary>
    ///     Returns Markdown, or <see langword="null"/> when the run does not exist.
    ///     When the run exists but is not committed, returns Markdown that states the gap explicitly.
    /// </summary>
    public async Task<String?> BuildMarkdownAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(apiBaseForLinks);
        FirstValueReportBuildResult? built = await BuildReportAsync(runId, apiBaseForLinks, cancellationToken);
        return built?.Markdown;
    }

    /// <summary>
    ///     Returns Markdown plus evidence classification for PDF watermarks, or <see langword="null"/> when the run does not exist.
    /// </summary>
    public async Task<FirstValueReportBuildResult?> BuildReportAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(apiBaseForLinks);
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));
        string baseUrl = string.IsNullOrWhiteSpace(apiBaseForLinks) ? "http://localhost:5000" : apiBaseForLinks.Trim().TrimEnd('/');
        ArchitectureRunDetail? detail = await _runDetailQuery.GetRunDetailAsync(runId, cancellationToken);
        if (detail is null)
        {
            _logger.LogInformationFirstValueReportRunNotFound(runId);
            return null;
        }

        PilotRunDeltas deltas = await _deltaComputer.ComputeAsync(detail, cancellationToken);
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot valueWindowSnapshot =
            await _valueReportBuilder.BuildAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, start, end, cancellationToken);
        PilotBaselineRecord? scorecardBaselines =
            await _pilotBaselineRepository.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        ArchitectureRun run = detail.Run;
        GoldenManifest? manifest = detail.Manifest;
        PilotBuyerSafeEvidenceGateResult buyerSafeGate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, valueWindowSnapshot);
        FirstValueEvidenceCompletenessLevel evidenceCompleteness = FirstValueEvidenceCompletenessClassifier.Classify(buyerSafeGate);
        SponsorSafeProofDisposition sponsorSafeDisposition = SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(buyerSafeGate);
        ProofPackageCompletenessResponse proofCompleteness =
            PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, buyerSafeGate, valueWindowSnapshot, scorecardBaselines);
        StringBuilder sb = new();
        sb.AppendLine("# ArchLucid — first value report (pilot)");
        sb.AppendLine();
        TenantFirstValueReportBrandingForExport? tenantBranding =
            await TryResolveTenantBrandingAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        AppendTenantFirstValueBrandingMarkdown(sb, tenantBranding);
        sb.AppendLine(
            "This one-page summary is generated from committed run data in ArchLucid. The **computed deltas** below replace the legacy baseline placeholders for the numbers ArchLucid can derive on its own; the qualitative baseline table at the bottom is still operator-filled. See repository `docs/PILOT_ROI_MODEL.md` §4 for the full metric catalog.");
        sb.AppendLine();
        AppendSponsorFirstPageStatusBlock(sb, detail, sponsorSafeDisposition, proofCompleteness, deltas, run);
        SponsorSafeProofStatusMarkdownFormatter.AppendMarkdownSection(sb, sponsorSafeDisposition, buyerSafeGate, proofCompleteness, deltas, run);
        SponsorArtifactEvidenceBadgeMarkdownFormatter.AppendMarkdownSection(
            sb,
            deltas,
            proofCompleteness,
            valueWindowSnapshot,
            ResolveSavingsPricingBasisForBadges(proofCompleteness, valueWindowSnapshot, deltas),
            ResolveCostEvidenceFreshnessForBadges(proofCompleteness, deltas));
        SponsorEvidenceBasisVerdictMarkdownFormatter.AppendMarkdownSection(sb, proofCompleteness, deltas, run);
        if (run.RealModeFellBackToSimulator)
        {
            sb.AppendLine(_executionProvenanceFooter.BuildYellowSimulatorSubstitutionCallout());
            sb.AppendLine();
        }

        if (deltas.IsDemoTenant)
        {
            sb.AppendLine("> " + DemoTenantBanner +
                          " The numbers below come from the seeded Contoso Retail Modernization dataset and MUST NOT be quoted as a real-customer outcome.");
            sb.AppendLine();
        }

        FirstValueEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(sb, evidenceCompleteness);
        PilotBuyerSafeEvidenceGateMarkdownFormatter.AppendMarkdownSection(sb, buyerSafeGate);
        AppendRunSection(sb, run, manifest, baseUrl);
        AppendProofPackageContractSection(sb, deltas, proofCompleteness, manifest, run);
        AppendComputedDeltasSection(sb, deltas);
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(sb, valueWindowSnapshot);
        RoiEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(sb, valueWindowSnapshot);
        RoiMetricSourceMarkdownFormatter.AppendMarkdownSection(
            sb,
            RoiMetricSourceCatalogBuilder.Build(valueWindowSnapshot));

        if (proofCompleteness.RoiBaselineInputs is not null)
            PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(sb, proofCompleteness.RoiBaselineInputs);
        AppendFindingFeedbackMarkdownSection(sb, valueWindowSnapshot);
        AppendFindingsSection(sb, deltas);
        AppendElapsedSection(sb, deltas);
        AppendDecisionTraceSection(sb, detail, runId, baseUrl);
        AppendEvidenceChainSection(sb, deltas);
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proofCompleteness, run);
        AppendBaselinePlaceholderTable(sb);
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine(_executionProvenanceFooter.BuildFooterMarkdown(BuildProvenanceInput(run, deltas)));
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("**Sponsor narrative (canonical):** repository `docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md` (not served by this HTTP endpoint).");
        sb.AppendLine();
        sb.AppendLine($"*Generated from run `{run.RunId}`.*");
        sb.AppendLine();
        string ui = _publicSiteOptions.CurrentValue.BaseUrl.Trim().TrimEnd('/');
        sb.AppendLine("## Return to ArchLucid (authoritative state)");
        sb.AppendLine();
        sb.AppendLine($"- Operator review UI: {ui}/reviews/{run.RunId}");
        sb.AppendLine($"- Pilot scorecard: {ui}/scorecard");
        sb.AppendLine($"- API anchor (authenticated): {baseUrl}/v1/architecture/run/{run.RunId}");
        return new FirstValueReportBuildResult(
            sb.ToString(),
            evidenceCompleteness,
            SponsorProofReadinessClassifier.Classify(deltas, buyerSafeGate),
            tenantBranding,
            proofCompleteness);
    }

    private async Task<TenantFirstValueReportBrandingForExport?> TryResolveTenantBrandingAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TenantFirstValueReportBrandingRow? raw =
            await _tenantFirstValueReportBrandingRepository.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);
        if (raw is null)
            return null;

        return FirstValueReportBrandingSanitizer.TryBuildExportModel(raw.BrandingLogoUrl, raw.BrandingCompanyName);
    }

    private static void AppendTenantFirstValueBrandingMarkdown(
        StringBuilder sb,
        TenantFirstValueReportBrandingForExport? tenantBranding)
    {
        if (tenantBranding is null)
            return;

        if (!string.IsNullOrWhiteSpace(tenantBranding.CompanyDisplayName))
        {
            sb.AppendLine($"> Prepared for: {tenantBranding.CompanyDisplayName}");
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(tenantBranding.LogoHttpsUrl))
        {
            sb.AppendLine($"![Tenant logo]({tenantBranding.LogoHttpsUrl})");
            sb.AppendLine();
        }
    }

    private static void AppendSponsorFirstPageStatusBlock(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        sb.AppendLine("## Sponsor first-page status");
        sb.AppendLine();
        sb.AppendLine(
            "Read this block before forwarding the packet. It summarizes the evidence basis, quality posture, ROI basis, top findings, deferred buyer requirements, and next action without adding new claims.");
        sb.AppendLine();
        sb.AppendLine("| Question | Sponsor-safe answer |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Evidence source | {FormatSponsorEvidenceSource(proof)} |");
        sb.AppendLine($"| Quality disposition | {FormatSponsorQualityDisposition(proof)} |");
        sb.AppendLine($"| ROI basis status | {FormatSponsorRoiBasis(proof)} |");
        sb.AppendLine($"| LLM call basis | {FormatSponsorLlmCallBasis(deltas, proof)} |");
        sb.AppendLine($"| Top findings | {FormatSponsorTopFindings(detail)} |");
        sb.AppendLine($"| Deferred buyer requirements | {FormatSponsorDeferredBuyerRequirements()} |");
        sb.AppendLine($"| Recommended next action | {FormatSponsorNextAction(disposition, proof, deltas, run)} |");
        sb.AppendLine();
    }

    private static string FormatSponsorEvidenceSource(ProofPackageCompletenessResponse proof)
    {
        if (proof.DemoTenantWarningRequired)
            return "**Demo-derived** — illustrative sample output; do not present as buyer outcome.";

        return proof.BuyerSafeRedactionProfile.Length > 0
            ? $"**{EscapeMarkdownTableCell(proof.BuyerSafeRedactionProfile)}** — tenant-scoped persisted proof fields."
            : "**Tenant evidence** — persisted proof fields available; redaction profile not labeled.";
    }

    private static string FormatSponsorQualityDisposition(ProofPackageCompletenessResponse proof)
    {
        return proof.AgentOutputPilotStrictEvidenceSatisfied
            ? "PilotStrict posture satisfied — no rejecting trace/faithfulness signals attested for this run."
            : "**HOLD** — PilotStrict posture failed; do not use sponsor-safe real-mode wording yet.";
    }

    private static string FormatSponsorLlmCallBasis(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof)
    {
        if (!proof.LlmCallCountResolved)
            return "**Not attested** — execution trace query failed; do not cite an LLM call count.";

        return $"**{deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture)}** trace row(s) for this run (zero may be valid when simulator substitution applies — see quality disposition).";
    }

    private static string FormatSponsorRoiBasis(ProofPackageCompletenessResponse proof)
    {
        string label = EscapeMarkdownTableCell(proof.RoiConfidenceLabel);
        string inputsSummary = proof.RoiBaselineInputs is null
            ? string.Empty
            : $" Per-field inputs: {EscapeMarkdownTableCell(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(proof.RoiBaselineInputs))}.";

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Strong
            && proof.RoiBaselineInputs?.ProjectedDollarClaimsSponsorSafe == true)
            return $"**{proof.RoiEvidenceConfidence}** — {label}.{inputsSummary}";

        string fallback = proof.RoiBaselineInputs?.SponsorSafeFallbackCopy.Length > 0
            ? EscapeMarkdownTableCell(proof.RoiBaselineInputs.SponsorSafeFallbackCopy)
            : "use qualitative wording or estimate labels until buyer baselines are collected";

        return $"**{proof.RoiEvidenceConfidence}** — {label}; {fallback}.{inputsSummary}";
    }

    private static string FormatSponsorTopFindings(ArchitectureRunDetail detail)
    {
        List<ArchitectureFinding> topFindings = detail.Results
            .SelectMany(static r => r.Findings)
            .Select(static (Finding, Index) => new { Finding, Index })
            .Where(static f => !f.Finding.IsMuted)
            .OrderByDescending(static f => f.Finding.Severity)
            .ThenBy(static f => f.Index)
            .Take(3)
            .Select(static f => f.Finding)
            .ToList();

        if (topFindings.Count == 0)
            return "No active findings recorded in this package.";

        return string.Join(
            "<br />",
            topFindings.Select(static f => $"{f.Severity}: {EscapeMarkdownTableCell(TruncateSponsorFinding(f.Message))}"));
    }

    private static string FormatSponsorDeferredBuyerRequirements()
        => "SOC 2 CPA report, external third-party pen-test summary, public reference customer, and live commerce/Marketplace publication remain deferred scope; do not imply they exist.";

    private static string FormatSponsorNextAction(
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        if (disposition == SponsorSafeProofDisposition.Sendable)
            return "Send sponsor packet after human redaction review and qualitative baseline confirmation.";

        if (proof.DemoTenantWarningRequired || deltas.IsDemoTenant)
            return "Use this only as a demo walkthrough; run the same path on buyer evidence before sponsor send.";

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied || run.RealModeFellBackToSimulator)
            return "Hold sponsor send; resolve AI quality/simulator disclosure before forwarding.";

        return "Review caveats, collect missing ROI/evidence fields, then regenerate the packet.";
    }

    private static string TruncateSponsorFinding(string value)
    {
        string trimmed = value.Trim();

        if (trimmed.Length <= 96)
            return trimmed;

        return string.Concat(trimmed.AsSpan(0, 93), "...");
    }

    private static string EscapeMarkdownTableCell(string value)
        => value.Replace("|", "\\|", StringComparison.Ordinal).Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal).Trim();

    private ExecutionProvenanceFooterInput BuildProvenanceInput(ArchitectureRun run, PilotRunDeltas deltas)
    {
        string hostMode = _configuration["AgentExecution:Mode"]?.Trim() ?? "Simulator";
        string? hostDeployment = _configuration["AzureOpenAI:DeploymentName"]?.Trim();
        return new ExecutionProvenanceFooterInput(run.RealModeFellBackToSimulator, run.PilotAoaiDeploymentSnapshot, hostMode, hostDeployment,
            deltas.LlmCallCount);
    }

    private static void AppendRunSection(StringBuilder sb, ArchitectureRun run, GoldenManifest? manifest, string baseUrl)
    {
        sb.AppendLine("## Architecture review identity");
        sb.AppendLine();
        sb.AppendLine(
            "Each architecture review is tracked as one run for support, API access, and traceability. Use the review package language with sponsors; keep the run id in support notes.");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Support run id | `{run.RunId}` |");
        sb.AppendLine($"| Status | `{run.Status}` |");
        sb.AppendLine($"| Request id | `{run.RequestId}` |");
        sb.AppendLine($"| Created (UTC) | `{run.CreatedUtc:O}` |");
        sb.AppendLine(
            $"| Completed (UTC) | `{(run.CompletedUtc is null ? "(pending)" : run.CompletedUtc.Value.ToString("O", CultureInfo.InvariantCulture))}` |");
        if (manifest is null)
        {
            sb.AppendLine("| Committed manifest | _(not available — run may not be committed yet)_ |");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"| System | `{manifest.SystemName}` |");
        sb.AppendLine($"| Manifest version | `{manifest.Metadata.ManifestVersion}` |");
        sb.AppendLine($"| Commit snapshot (UTC) | `{manifest.Metadata.CreatedUtc:O}` |");
        sb.AppendLine("| Environment (capture) | _(from original architecture request — add during pilot)_ |");
        sb.AppendLine();
        sb.AppendLine("### Evidence links");
        sb.AppendLine();
        sb.AppendLine($"- [Run detail JSON]({baseUrl}/v1/architecture/run/{run.RunId}) (`GET /v1/architecture/run/{{runId}}`)");
        sb.AppendLine(
            $"- [Decision nodes]({baseUrl}/v1/architecture/run/{run.RunId}/decisions) (`GET /v1/architecture/run/{{runId}}/decisions`) — after commit");
        sb.AppendLine();
    }

    private static void AppendProofPackageContractSection(
        StringBuilder sb,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse c,
        GoldenManifest? manifest,
        ArchitectureRun run)
    {
        sb.AppendLine("## Buyer-safe proof package contract");
        sb.AppendLine();
        sb.AppendLine(
            "Use this section as the completeness check before sending the report to a sponsor. Persisted evidence is stronger than model narrative; missing rows should be called out rather than edited by hand.");
        sb.AppendLine();
        sb.AppendLine("| Required proof field | Status in this report |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(
            $"| Non-demo / external-share discipline | {(c.DemoTenantWarningRequired ? "**FAILED — non-negotiable demo warning.** Replace seeded identifiers before any sponsor-facing circulation." : "Pass — operator identifiers only per loaded tenant scope.")} |");
        sb.AppendLine($"| Support run id | {FormatProofStatus(c.SupportRunIdPresent)} |");
        sb.AppendLine($"| Committed manifest + status | {FormatProofStatus(c is { CommittedManifestPresent: true, RunInCommittedStatus: true })} |");
        sb.AppendLine($"| Committed manifest timestamp (UTC) | {FormatCommittedManifestTimestampProofCell(deltas, c, manifest)} |");
        sb.AppendLine($"| Artifact descriptor count | {FormatArtifactDescriptorsProofCell(c)} |");
        sb.AppendLine($"| Time to committed manifest | {FormatProofStatus(c.TimeToCommittedManifestResolved)} |");
        sb.AppendLine($"| Findings by severity | {FormatProofStatus(c.FindingsBySeverityPresent)} |");
        sb.AppendLine($"| Top finding evidence-chain pointer | {FormatTopFindingEvidenceProofCell(deltas)} |");
        sb.AppendLine($"| Audit-row count or lower bound | {FormatProofStatus(c.AuditRowsPresentOrLowerBound)} |");
        sb.AppendLine($"| LLM-call count | {FormatLlmCallCountProofCell(deltas, c)} |");
        sb.AppendLine($"| ROI evidence confidence | **{c.RoiEvidenceConfidence}** — {c.RoiConfidenceLabel} |");

        if (c.RoiBaselineInputs is not null)
        {
            sb.AppendLine(
                $"| ROI baseline inputs (per field) | {EscapeMarkdownTableCell(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(c.RoiBaselineInputs))} |");
            sb.AppendLine(
                $"| Projected dollar claims sponsor-safe | {(c.RoiBaselineInputs.ProjectedDollarClaimsSponsorSafe ? "Yes" : "**No** — do not lead with projected USD savings")} |");
        }

        sb.AppendLine($"| Buyer-safe redaction profile | {c.BuyerSafeRedactionProfile} |");
        sb.AppendLine(
            $"| PilotStrict agent-output posture | {(c.AgentOutputPilotStrictEvidenceSatisfied ? "Satisfied — no PilotStrict trace/faithfulness failures attested for this run." : "**FAILED** — PilotStrict quality gate reported rejecting signals; withhold sponsor-grade real-mode claims until traces pass.")} |");
        sb.AppendLine($"| Evidence-basis labels | {FormatEvidenceBasisLabels(c, deltas, run)} |");
        sb.AppendLine($"| Proof sendability (API mirror) | `{c.ProofSendability}` · `{c.PublishingTier}` · **{c.EvidenceCompleteness}** |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Sponsor-proof readiness (classification) | {(Enum.TryParse(c.SponsorProofReadiness, ignoreCase: false, out SponsorProofReadinessClassification readiness) ? SponsorProofReadinessClassifier.DescribeForMarkdownTable(readiness) : "**Incomplete** — classification unavailable.")} |");
        sb.AppendLine();
    }

    private static string FormatEvidenceBasisLabels(
        ProofPackageCompletenessResponse c,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(c, deltas, run);
        return SponsorEvidenceBasisLabelResolver.FormatLabelsForMarkdownTable(labels);
    }

    private static string FormatArtifactDescriptorsProofCell(ProofPackageCompletenessResponse c)
    {
        return !c.ArtifactDescriptorCountResolved ? "Missing — committed architecture manifest id absent or synthesized artifact query failed (see audit/logs rather than guessing)." : $"Present — `{c.ArtifactDescriptorCount}` descriptor(s) for this committed architecture manifest.";
    }

    private static string FormatCommittedManifestTimestampProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c, GoldenManifest? manifest)
    {
        if (!c.CommittedManifestPresent)
            return "Missing — no committed architecture manifest on this run detail.";
        if (!c.CommittedManifestTimestampResolved)
            return "Missing — `GoldenManifest.Metadata.CreatedUtc` is default / not a real commit timestamp.";
        DateTime committedUtc = deltas.ManifestCommittedUtc ?? manifest!.Metadata.CreatedUtc;
        return $"Present — `{committedUtc:O}` (`GoldenManifest.Metadata.CreatedUtc`).";
    }

    private static string FormatTopFindingEvidenceProofCell(PilotRunDeltas deltas)
    {
        if (deltas.TopFindingId is null)
            return "Not applicable — no findings on this run.";
        return deltas.TopFindingEvidenceChain is not null ? "Present" : "Explicitly unavailable — persisted finding without resolvable evidence-chain pointers (see buyer-safe gate).";
    }

    private static string FormatLlmCallCountProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c)
    {
        return !c.LlmCallCountResolved ? "Missing — execution trace query failed; count is not attested." : $"`{deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture)}` row(s) in execution traces (zero may still be valid — disclose simulator substitution separately when flagged above).";
    }

    private static string FormatProofStatus(bool present) => present ? "Present" : "Missing or not applicable; review before sponsor send";

    /// <summary>
    ///     Computed-deltas table — the single block sponsors should look at first. Every row is derived from persisted
    ///     run state via <see cref = "IPilotRunDeltaComputer"/>; see field-by-field docs on <see cref = "PilotRunDeltas"/>.
    /// </summary>
    private static void AppendFindingFeedbackMarkdownSection(StringBuilder sb, ValueReportSnapshot snapshot)
    {
        sb.AppendLine("## Finding feedback (thumbs, tenant window)");
        sb.AppendLine();
        sb.AppendLine("| Metric | Value |");
        sb.AppendLine("| --- | ---: |");
        sb.AppendLine($"| Net score (up − down) | {snapshot.FindingFeedbackNetScore.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Votes recorded | {snapshot.FindingFeedbackVoteCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine();
    }

    private static void AppendComputedDeltasSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        sb.AppendLine("## Computed deltas (from this run)");
        sb.AppendLine();
        if (deltas.IsDemoTenant)
        {
            sb.AppendLine(DemoTenantBanner);
            sb.AppendLine();
        }

        sb.AppendLine("| Metric | Value | Source |");
        sb.AppendLine("| --- | --- | --- |");
        sb.AppendLine($"| Time to committed manifest | {FormatTimeToCommit(deltas)} | `RunRecord.CreatedUtc` → `GoldenManifest.CommittedUtc` |");
        sb.AppendLine($"| Findings (total) | {deltas.FindingsBySeverity.Sum(static p => p.Value)} | `ArchitectureRunDetail.Results[*].Findings` |");
        sb.AppendLine($"| LLM calls for this run | {deltas.LlmCallCount} | `archlucid_llm_calls_per_run` (per-run trace count) |");
        sb.AppendLine($"| Audit rows for this run | {FormatAuditRowCount(deltas)} | `IAuditRepository.CountFilteredAsync(RunId)` |");
        sb.AppendLine();
    }

    private static string FormatTimeToCommit(PilotRunDeltas deltas)
    {
        return deltas.TimeToCommittedManifest is not { } wall
            ? "_(pending — no committed manifest yet)_"
            : $"**{wall:c}** (committed `{deltas.ManifestCommittedUtc:O}`)";
    }

    private static string FormatAuditRowCount(PilotRunDeltas deltas)
    {
        if (deltas.AuditRowCount == 0)
            return "0";
        return deltas.AuditRowCountTruncated
            ? $"{deltas.AuditRowCount}+ _(query cap reached — exact count is at least this many)_"
            : deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture);
    }

    private static void AppendFindingsSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        sb.AppendLine("## Findings by severity");
        sb.AppendLine();
        if (deltas.FindingsBySeverity.Count == 0)
        {
            sb.AppendLine("_(No findings on agent results for this run.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine("| Severity | Count |");
        sb.AppendLine("| --- | ---: |");
        foreach (KeyValuePair<string, int> row in deltas.FindingsBySeverity)
            sb.AppendLine($"| {row.Key} | {row.Value} |");
        sb.AppendLine();
    }

    private static void AppendElapsedSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        sb.AppendLine("## Time to committed output");
        sb.AppendLine();
        if (deltas.TimeToCommittedManifest is not { } wall)
        {
            sb.AppendLine("_(Run has no committed manifest — elapsed time not computed.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"Wall-clock from `RunRecord.CreatedUtc` to `GoldenManifest.CommittedUtc`: **{wall:c}**.");
        sb.AppendLine($"Created: `{deltas.RunCreatedUtc:O}` · Committed: `{deltas.ManifestCommittedUtc:O}`.");
        sb.AppendLine();
    }

    private static void AppendDecisionTraceSection(StringBuilder sb, ArchitectureRunDetail detail, string runId, string baseUrl)
    {
        sb.AppendLine("## Decision trace summary (top 5)");
        sb.AppendLine();
        List<DecisionTraceDto> traces = detail.DecisionTraces.Where(static _ => true).Take(5).ToList();
        if (traces.Count == 0)
        {
            sb.AppendLine("_(No decision traces on this run — typical before commit or for coordinator-only paths.)_");
            sb.AppendLine();
            return;
        }

        int index = 1;
        foreach (DecisionTraceDto trace in traces)
        {
            if (trace is RuleAuditTraceDto rule)
            {
                RuleAuditTracePayload p = rule.RuleAudit;
                sb.AppendLine(
                    $"{index}. **Rule audit** — rule set `{p.RuleSetId}` v`{p.RuleSetVersion}`; applied rules: {p.AppliedRuleIds.Count}, accepted findings: {p.AcceptedFindingIds.Count}, rejected: {p.RejectedFindingIds.Count}.");
            }
            else if (trace is RunEventTraceDto runEvent)
            {
                RunEventTracePayload p = runEvent.RunEvent;
                sb.AppendLine($"{index}. **Run event** — `{p.EventType}`: {p.EventDescription}");
            }
            else
            {
                sb.AppendLine($"{index}. **Trace** — `{trace.Kind}`");
            }

            index++;
        }

        sb.AppendLine();
        sb.AppendLine($"Full trace payloads: [GET /v1/architecture/run/{runId}]({baseUrl}/v1/architecture/run/{runId}) (`decisionTraces` array when present).");
        sb.AppendLine();
    }

    /// <summary>
    ///     Renders the top-severity finding's evidence-chain pointers (manifest version, snapshot ids, related graph
    ///     nodes, agent execution traces) so a sponsor can hand a reviewer a single ID list to trace the decision.
    /// </summary>
    private static void AppendEvidenceChainSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        sb.AppendLine("## Top-severity finding — evidence chain excerpt");
        sb.AppendLine();
        if (deltas.TopFindingId is null)
        {
            sb.AppendLine("_(No findings on this run; evidence-chain excerpt skipped.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"Selected finding: `{deltas.TopFindingId}` (severity `{deltas.TopFindingSeverity ?? "Unknown"}`).");
        sb.AppendLine();
        FindingEvidenceChainResponse? chain = deltas.TopFindingEvidenceChain;
        if (chain is null)
        {
            sb.AppendLine(
                "_(Evidence chain unavailable — the top-severity finding is not present in the persisted FindingsSnapshot, or the chain service could not resolve it. Review the full run detail JSON for an alternate selection.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine("| Pointer | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Manifest version | `{chain.ManifestVersion ?? "(none)"}` |");
        sb.AppendLine($"| Findings snapshot id | `{FormatGuid(chain.FindingsSnapshotId)}` |");
        sb.AppendLine($"| Context snapshot id | `{FormatGuid(chain.ContextSnapshotId)}` |");
        sb.AppendLine($"| Graph snapshot id | `{FormatGuid(chain.GraphSnapshotId)}` |");
        sb.AppendLine($"| Decision trace id | `{FormatGuid(chain.DecisionTraceId)}` |");
        sb.AppendLine($"| Golden manifest id | `{FormatGuid(chain.GoldenManifestId)}` |");
        sb.AppendLine($"| Related graph nodes | {chain.RelatedGraphNodeIds.Count} |");
        sb.AppendLine($"| Agent execution traces | {chain.AgentExecutionTraceIds.Count} |");
        sb.AppendLine();
    }

    private static string FormatGuid(Guid? id)
    {
        return id is null ? "(none)" : id.Value.ToString("D");
    }

    private static void AppendBaselinePlaceholderTable(StringBuilder sb)
    {
        sb.AppendLine("## Qualitative baseline (operator-filled)");
        sb.AppendLine();
        sb.AppendLine(
            "Use this table for the qualitative metrics ArchLucid cannot derive on its own. The numeric metrics (time-to-commit, findings counts, audit rows, LLM calls) are now in the **Computed deltas** section above.");
        sb.AppendLine();
        sb.AppendLine("| Pilot metric (see PILOT_ROI_MODEL.md) | Baseline (before) | During pilot | Notes |");
        sb.AppendLine("| --- | --- | --- | --- |");
        sb.AppendLine("| Time to reviewable artifact package |  |  |  |");
        sb.AppendLine("| Manual preparation effort |  |  |  |");
        sb.AppendLine("| Decision traceability (qualitative) |  |  |  |");
        sb.AppendLine("| Reviewer / sponsor confidence |  |  |  |");
        sb.AppendLine();
    }

    private static string ResolveSavingsPricingBasisForBadges(
        ProofPackageCompletenessResponse proof,
        ValueReportSnapshot snapshot,
        PilotRunDeltas deltas)
    {
        bool hasUploadedCostEvidence = proof.RoiConfidenceLabel.Contains("uploaded", StringComparison.OrdinalIgnoreCase)
            || proof.RoiConfidenceLabel.Contains("extractor", StringComparison.OrdinalIgnoreCase);

        return ExecutiveRoiSavingsPricingBasis.Resolve(
            1.0m,
            hasUploadedCostEvidence,
            hasHeuristicCostEvidence: !hasUploadedCostEvidence
                && proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low
                && !deltas.IsDemoTenant);
    }

    private static string ResolveCostEvidenceFreshnessForBadges(
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas)
    {
        if (deltas.IsDemoTenant || proof.DemoTenantWarningRequired)
            return RoiCostEvidenceFreshness.Missing;

        if (proof.RoiConfidenceLabel.Contains("uploaded", StringComparison.OrdinalIgnoreCase)
            || proof.RoiConfidenceLabel.Contains("extractor", StringComparison.OrdinalIgnoreCase))
            return RoiCostEvidenceFreshness.Fresh;

        return RoiCostEvidenceFreshness.Missing;
    }
}
