using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

public interface IArtifactPackagingService
{
    ArtifactFileExport BuildSingleFileExport(SynthesizedArtifact artifact);

    ArtifactPackage BuildBundlePackage(
        Guid manifestId,
        IReadOnlyList<SynthesizedArtifact> artifacts);

    ArtifactPackage BuildRunExportPackage(
        Guid runId,
        Guid manifestId,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        string manifestJson,
        string? traceJson = null,
        RunExportReadmeContext? readmeContext = null,
        byte[]? renderedArchitectureDiagramPng = null);

    /// <summary>
    ///     Advisory Terraform ZIP placeholder (README + stub <c>.tf</c>). Live <c>aztfexport</c> wrapping remains
    ///     CLI-first until a host integration ships.
    /// </summary>
    ArtifactPackage BuildTerraformAdvisoryPlaceholderExport(Guid runId);
}
