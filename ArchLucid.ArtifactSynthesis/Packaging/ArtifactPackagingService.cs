using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>
///     Packages <see cref="SynthesizedArtifact" /> instances into single-file exports, manifest-scoped ZIP bundles,
///     or full run-export ZIP packages containing the manifest JSON and an optional decision trace.
/// </summary>
/// <remarks>
///     Entry names are sanitized with <see cref="FileNameSanitizer" /> and made unique within each archive.
///     Reserved names (<c>bundle-index.json</c>, <c>package-metadata.json</c>, etc.) are prefixed with
///     <c>artifact-</c> to avoid collisions.
/// </remarks>
public partial class ArtifactPackagingService(IArtifactContentTypeResolver contentTypeResolver) : IArtifactPackagingService
{
    private static readonly JsonSerializerOptions JsonWriteIndented = new() { WriteIndented = true };

#pragma warning disable IDE0028 // Simplify collection initialization
    private static readonly HashSet<string> BundleReservedEntryNames = new(StringComparer.OrdinalIgnoreCase)
#pragma warning restore IDE0028 // Simplify collection initialization
    {
        "bundle-index.json", "package-metadata.json"
    };

#pragma warning disable IDE0028 // Simplify collection initialization
    private static readonly HashSet<string> RunExportReservedEntryNames = new(StringComparer.OrdinalIgnoreCase)
#pragma warning restore IDE0028 // Simplify collection initialization
    {
        "manifest.json", "decision-trace.json", "README.txt", "package-metadata.json", "export-manifest.json"
    };

    public ArtifactFileExport BuildSingleFileExport(SynthesizedArtifact artifact)
    {
        ArgumentNullException.ThrowIfNull(artifact);

        return new ArtifactFileExport
        {
            FileName = FileNameSanitizer.Sanitize(artifact.Name),
            ContentType = contentTypeResolver.Resolve(artifact),
            Content = Encoding.UTF8.GetBytes(artifact.Content)
        };
    }

    public ArtifactPackage BuildBundlePackage(
        Guid manifestId,
        IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        ArgumentNullException.ThrowIfNull(artifacts);

        using MemoryStream memoryStream = new();

        using (ZipArchive archive = new(memoryStream, ZipArchiveMode.Create, true))
        {
            HashSet<string> usedEntryNames = new(StringComparer.OrdinalIgnoreCase);

            foreach (SynthesizedArtifact artifact in artifacts.OrderBy(x => x.Name, StringComparer.OrdinalIgnoreCase))
            {
                string safe =
                    AvoidReservedEntryName(FileNameSanitizer.Sanitize(artifact.Name), BundleReservedEntryNames);
                string entryName = AllocateUniqueEntryName(safe, usedEntryNames);
                WriteTextEntry(archive, entryName, artifact.Content);
            }

            WriteBundleIndex(archive, artifacts);
            WritePackageMetadata(
                archive,
                new { CreatedUtc = TimeProvider.System.UtcNowDateTime(), ManifestId = manifestId, ArtifactCount = artifacts.Count });
        }

        return new ArtifactPackage
        {
            PackageFileName = $"artifact-bundle-{manifestId:N}.zip", Content = memoryStream.ToArray()
        };
    }
}
