using ArchLucid.ArtifactSynthesis.Packaging;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Pre-serialized export packaging inputs so <see cref="RunExportPackageBuilder" /> does not
///     re-serialize hydrated authority documents (M12 / TB-931).
/// </summary>
public sealed class RunExportAuthorityMaterial
{
    public required Guid ManifestId { get; init; }

    public required string ManifestJson { get; init; }

    public string? TraceJson { get; init; }

    public required RunExportReadmeContext ReadmeContext { get; init; }
}
