using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <inheritdoc cref="IRunExportPackageBuilder" />
public sealed class RunExportPackageBuilder(
    IRunExportAuthorityMaterialLoader exportAuthorityMaterialLoader,
    IArtifactQueryService artifactQueryService,
    IArtifactPackagingService artifactPackagingService) : IRunExportPackageBuilder
{
    private const string RunNotFoundProblemType = "https://archlucid.example.org/errors#run-not-found";
    private const string ManifestNotFoundProblemType = "https://archlucid.example.org/errors#manifest-not-found";

    private readonly IRunExportAuthorityMaterialLoader _exportAuthorityMaterialLoader =
        exportAuthorityMaterialLoader ?? throw new ArgumentNullException(nameof(exportAuthorityMaterialLoader));

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
        RunExportAuthorityMaterialLoadResult materialResult =
            await _exportAuthorityMaterialLoader.LoadAsync(scope, runId, ct);

        if (!materialResult.RunFound)
            return RunExportPackageResult.NotFound(
                $"Run '{runId}' was not found.",
                RunNotFoundProblemType);

        if (!materialResult.ManifestFound || materialResult.Material is null)
            return RunExportPackageResult.NotFound(
                $"Run '{runId}' has no committed golden manifest available for export.",
                ManifestNotFoundProblemType);

        RunExportAuthorityMaterial material = materialResult.Material;

        IReadOnlyList<SynthesizedArtifact> artifacts = await _artifactQueryService.GetArtifactsByManifestIdAsync(
            scope,
            material.ManifestId,
            ct);

        ArtifactPackage package = _artifactPackagingService.BuildRunExportPackage(
            runId,
            material.ManifestId,
            artifacts,
            material.ManifestJson,
            material.TraceJson,
            material.ReadmeContext,
            renderedArchitectureDiagramPng: renderedDiagramPng);

        return RunExportPackageResult.Success(
            package.Content,
            package.ContentType,
            package.PackageFileName,
            material.ManifestId);
    }
}
