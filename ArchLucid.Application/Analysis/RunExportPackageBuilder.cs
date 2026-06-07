using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <inheritdoc cref="IRunExportPackageBuilder" />
public sealed class RunExportPackageBuilder(
    IAuthorityQueryService authorityQueryService,
    IArtifactQueryService artifactQueryService,
    IArtifactPackagingService artifactPackagingService) : IRunExportPackageBuilder
{
    private const string RunNotFoundProblemType = "https://archlucid.example.org/errors#run-not-found";
    private const string ManifestNotFoundProblemType = "https://archlucid.example.org/errors#manifest-not-found";

    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IArtifactQueryService _artifactQueryService =
        artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));

    private readonly IArtifactPackagingService _artifactPackagingService =
        artifactPackagingService ?? throw new ArgumentNullException(nameof(artifactPackagingService));

    /// <inheritdoc />
    public async Task<RunExportPackageResult> BuildAsync(
        ScopeContext scope,
        Guid runId,
        byte[]? renderedDiagramPng,
        CancellationToken ct)
    {
        RunDetailDto? runDetail = await _authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (runDetail is null)
            return RunExportPackageResult.NotFound(
                $"Run '{runId}' was not found.",
                RunNotFoundProblemType);

        if (runDetail.GoldenManifest is null)
            return RunExportPackageResult.NotFound(
                $"Run '{runId}' has no committed golden manifest available for export.",
                ManifestNotFoundProblemType);

        IReadOnlyList<SynthesizedArtifact> artifacts = await _artifactQueryService.GetArtifactsByManifestIdAsync(
            scope,
            runDetail.GoldenManifest.ManifestId,
            ct);

        string manifestJson = JsonSerializer.Serialize(runDetail.GoldenManifest, ExportJsonOptions);

        string? traceJson = runDetail.AuthorityTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.AuthorityTrace, ExportJsonOptions);

        ManifestDocument golden = runDetail.GoldenManifest;
        string ruleSetLine = $"{golden.RuleSetId} {golden.RuleSetVersion}".Trim();
        RunExportReadmeContext readmeContext = new()
        {
            ManifestDisplayName = string.IsNullOrWhiteSpace(golden.Metadata.Name) ? null : golden.Metadata.Name,
            ManifestHash = string.IsNullOrWhiteSpace(golden.ManifestHash) ? null : golden.ManifestHash,
            RuleSetLabel = string.IsNullOrWhiteSpace(ruleSetLine) ? null : ruleSetLine,
            RuleSetId = string.IsNullOrWhiteSpace(golden.RuleSetId) ? null : golden.RuleSetId,
            RuleSetHash = string.IsNullOrWhiteSpace(golden.RuleSetHash) ? null : golden.RuleSetHash,
            OperatorShellReviewRelativePath = $"/reviews/{runId:D}"
        };

        ArtifactPackage package = _artifactPackagingService.BuildRunExportPackage(
            runId,
            golden.ManifestId,
            artifacts,
            manifestJson,
            traceJson,
            readmeContext,
            renderedArchitectureDiagramPng: renderedDiagramPng);

        return RunExportPackageResult.Success(
            package.Content,
            package.ContentType,
            package.PackageFileName,
            golden.ManifestId);
    }
}
