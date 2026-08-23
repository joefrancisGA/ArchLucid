using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds export ZIP JSON strings once from the slim export authority read (avoids a second
///     <see cref="JsonSerializer.Serialize" /> in the packaging builder).
/// </summary>
public sealed class RunExportAuthorityMaterialLoader(IAuthorityQueryService authorityQueryService)
    : IRunExportAuthorityMaterialLoader
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

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

        ManifestDocument golden = runDetail.GoldenManifest;
        string manifestJson = JsonSerializer.Serialize(golden, ExportJsonOptions);
        string? traceJson = runDetail.AuthorityTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.AuthorityTrace, ExportJsonOptions);

        string ruleSetLine = $"{golden.RuleSetId} {golden.RuleSetVersion}".Trim();
        RunExportReadmeContext readmeContext = new()
        {
            ManifestDisplayName = string.IsNullOrWhiteSpace(golden.Metadata.Name) ? null : golden.Metadata.Name,
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
