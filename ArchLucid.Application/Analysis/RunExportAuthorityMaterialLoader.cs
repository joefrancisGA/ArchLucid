using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds export ZIP JSON strings once from the slim export authority read (avoids a second
///     <see cref="JsonSerializer.Serialize" /> in the packaging builder).
/// </summary>
public sealed class RunExportAuthorityMaterialLoader(
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService)
    : IRunExportAuthorityMaterialLoader
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    /// <inheritdoc />
    public async Task<RunExportAuthorityMaterialLoadResult> LoadAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct)
    {
        RunDetailDto? runDetail = await _authorityQueryService.GetRunDetailForExportAsync(scope, runId, ct);

        if (runDetail is null)
            return RunExportAuthorityMaterialLoadResult.RunNotFound();

        if (runDetail.GoldenManifest is null)
            return RunExportAuthorityMaterialLoadResult.ManifestNotFound();

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
            AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(runDetail.Run),
            runId.ToString("D"));

        ManifestDocument golden = runDetail.GoldenManifest;
        FeasibilityVerdict? verdict = golden.FeasibilityVerdict;
        string? manifestVersion = golden.Metadata?.Version;

        DecisionReceiptRunBuildOutcome? readinessOutcome =
            ManifestDecisionReceiptExportBinder.TryGetSealedReceiptReadinessOutcome(
                golden,
                verdict,
                manifestVersion);

        if (readinessOutcome == DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete)
            return RunExportAuthorityMaterialLoadResult.SealedReceiptIncomplete();

        DecisionReceiptRunBuildResult receiptResult = ManifestDecisionReceiptExportBinder.BuildVerifiedExportReceipt(
            runId,
            golden,
            verdict!,
            manifestVersion!.Trim(),
            _manifestHashService);

        if (receiptResult.Outcome == DecisionReceiptRunBuildOutcome.SealedHashMismatch)
            return RunExportAuthorityMaterialLoadResult.SealedReceiptHashMismatch();

        if (receiptResult.Outcome != DecisionReceiptRunBuildOutcome.Success)
            return RunExportAuthorityMaterialLoadResult.SealedReceiptIncomplete();

        string manifestJson = JsonSerializer.Serialize(golden, ExportJsonOptions);
        string? traceJson = runDetail.AuthorityTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.AuthorityTrace, ExportJsonOptions);

        string ruleSetLine = $"{golden.RuleSetId} {golden.RuleSetVersion}".Trim();
        RunExportReadmeContext readmeContext = new()
        {
            ManifestDisplayName = string.IsNullOrWhiteSpace(golden.Metadata?.Name) ? null : golden.Metadata.Name,
            ManifestHash = string.IsNullOrWhiteSpace(golden.ManifestHash) ? null : golden.ManifestHash,
            RuleSetLabel = string.IsNullOrWhiteSpace(ruleSetLine) ? null : ruleSetLine,
            RuleSetId = string.IsNullOrWhiteSpace(golden.RuleSetId) ? null : golden.RuleSetId,
            RuleSetHash = string.IsNullOrWhiteSpace(golden.RuleSetHash) ? null : golden.RuleSetHash,
            PolicyAtCommitSummary = CommittedEffectiveGovernanceSnapshotExportFormatter.FormatReadmeHeadline(golden.EffectiveGovernanceAtCommit),
            PolicyAtCommitDetailLines = CommittedEffectiveGovernanceSnapshotExportFormatter.FormatReadmeDetailLines(golden.EffectiveGovernanceAtCommit),
            OperatorShellReviewRelativePath = $"/reviews/{runId:D}"
        };

        return RunExportAuthorityMaterialLoadResult.Success(
            new RunExportAuthorityMaterial
            {
                ManifestId = golden.ManifestId,
                ManifestJson = manifestJson,
                TraceJson = traceJson,
                ReadmeContext = readmeContext
            });
    }
}
