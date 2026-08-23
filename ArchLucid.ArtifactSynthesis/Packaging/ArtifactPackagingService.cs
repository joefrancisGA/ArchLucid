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
public class ArtifactPackagingService(IArtifactContentTypeResolver contentTypeResolver) : IArtifactPackagingService
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

    public ArtifactPackage BuildRunExportPackage(
        Guid runId,
        Guid manifestId,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        string manifestJson,
        string? traceJson = null,
        RunExportReadmeContext? readmeContext = null,
        byte[]? renderedArchitectureDiagramPng = null)
    {
        ArgumentNullException.ThrowIfNull(artifacts);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestJson);

        using MemoryStream memoryStream = new();

        using (ZipArchive archive = new(memoryStream, ZipArchiveMode.Create, true))
        {
            HashSet<string> usedEntryNames = new(StringComparer.OrdinalIgnoreCase);
            List<(string Path, byte[] Content)> recordedEntries = new();

            foreach (SynthesizedArtifact artifact in artifacts.OrderBy(x => x.Name, StringComparer.OrdinalIgnoreCase))
            {
                string safeName = AvoidReservedEntryName(FileNameSanitizer.Sanitize(artifact.Name),
                    RunExportReservedEntryNames);
                string relative = $"artifacts/{AllocateUniqueEntryName(safeName, usedEntryNames)}";
                RecordTextEntry(archive, recordedEntries, relative, artifact.Content);
            }

            if (renderedArchitectureDiagramPng is { Length: > 0 })
            {
                const string pngPath = "artifacts/architecture-graph.png";
                RecordBinaryEntry(archive, recordedEntries, pngPath, renderedArchitectureDiagramPng);
            }

            RecordTextEntry(archive, recordedEntries, "manifest.json", manifestJson);

            if (!string.IsNullOrWhiteSpace(traceJson))

                RecordTextEntry(archive, recordedEntries, "decision-trace.json", traceJson);

            StringBuilder readme = new StringBuilder()
                .AppendLine("ArchLucid run export package")
                .AppendLine("===========================")
                .AppendLine()
                .AppendLine($"Run ID: {runId}")
                .AppendLine($"Manifest ID: {manifestId}");

            if (readmeContext is not null)
            {
                if (!string.IsNullOrWhiteSpace(readmeContext.ManifestDisplayName))

                    readme.AppendLine($"Manifest name: {readmeContext.ManifestDisplayName}");

                if (!string.IsNullOrWhiteSpace(readmeContext.RuleSetLabel))

                    readme.AppendLine($"Rule set: {readmeContext.RuleSetLabel}");

                if (!string.IsNullOrWhiteSpace(readmeContext.PolicyAtCommitSummary))

                    readme.AppendLine($"Policy at commit: {readmeContext.PolicyAtCommitSummary}");

                if (readmeContext.PolicyAtCommitDetailLines is { Count: > 0 } detailLines)
                {
                    foreach (string line in detailLines)
                        readme.AppendLine(line);
                }

                if (!string.IsNullOrWhiteSpace(readmeContext.ManifestHash))

                    readme.AppendLine($"Manifest hash: {readmeContext.ManifestHash}");
            }

            if (!string.IsNullOrWhiteSpace(readmeContext?.OperatorShellReviewRelativePath))
            {
                readme.AppendLine();
                readme.AppendLine("Review continuity");
                readme.AppendLine("---------------");
                readme.AppendLine(
                    $"Operator shell path (when hosted): {readmeContext.OperatorShellReviewRelativePath.Trim()}");
                readme.AppendLine("Use this path after signing in to return to the live review, findings, and governance state.");
            }

            readme.AppendLine($"Artifact file count: {artifacts.Count}");
            readme.AppendLine();
            readme.AppendLine("Contents:");
            readme.AppendLine("  manifest.json             — committed GoldenManifest (JSON)");
            readme.AppendLine("  decision-trace.json       — authority decision trace when the API included one");
            readme.AppendLine("  artifacts/                — synthesized artifact files (UTF-8 text)");
            readme.AppendLine("  artifacts/architecture-graph.png — optional raster of the bundled Mermaid diagram when Mermaid CLI is enabled");
            readme.AppendLine("  package-metadata.json     — export metadata (UTC timestamp, ids, counts)");
            readme.AppendLine("  export-manifest.json      — SHA-256 checksums of every file + committed manifest hash anchor");
            readme.AppendLine("  README.txt                — this file");
            readme.AppendLine();
            readme.AppendLine(
                "Regenerate Word packages or consulting reports from the API or operator shell when needed.");
            RecordTextEntry(archive, recordedEntries, "README.txt", readme.ToString());

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
            RecordPackageMetadata(archive, recordedEntries, runId, manifestId, artifacts.Count, createdUtc);

            List<ExportManifestFileEntry> manifestFiles = recordedEntries
                .OrderBy(e => e.Path, StringComparer.Ordinal)
                .Select(e => new ExportManifestFileEntry
                {
                    Path = e.Path,
                    Sha256 = ExportManifestBuilder.ComputeSha256UpperHex(e.Content),
                    Bytes = e.Content.Length
                })
                .ToList();

            string exportManifestJson = ExportManifestBuilder.BuildJson(
                runId,
                manifestId,
                createdUtc,
                readmeContext?.ManifestHash,
                readmeContext?.RuleSetId,
                readmeContext?.RuleSetHash,
                manifestFiles);

            RecordTextEntry(archive, recordedEntries, "export-manifest.json", exportManifestJson);
        }

        return new ArtifactPackage
        {
            PackageFileName = $"archlucid-run-export-{runId:N}.zip", Content = memoryStream.ToArray()
        };
    }

    public ArtifactPackage BuildTerraformAdvisoryPlaceholderExport(Guid runId)
    {
        using MemoryStream memoryStream = new();

        using (ZipArchive archive = new(memoryStream, ZipArchiveMode.Create, true))
        {
            StringBuilder readme = new StringBuilder()
                .AppendLine(TerraformAdvisoryExportCopy.DisclaimerLine)
                .AppendLine()
                .AppendLine("ArchLucid Terraform advisory export (placeholder)")
                .AppendLine("==========================================")
                .AppendLine()
                .AppendLine($"Run ID: {runId:D}")
                .AppendLine()
                .AppendLine(
                    "This ZIP is advisory-only. ArchLucid does not run terraform apply or terraform destroy on your behalf.")
                .AppendLine()
                .AppendLine(
                    "Server-side export currently ships a placeholder bundle. To generate Terraform from an Azure resource group ")
                .AppendLine("using Microsoft aztfexport, run the ArchLucid CLI locally:")
                .AppendLine()
                .AppendLine("  archlucid azure terraform-export --subscription <subscriptionId> --resource-group <name> --out bundle.zip")
                .AppendLine()
                .AppendLine("See docs/runbooks/AZURE_EXTRACTOR_INGEST.md (Terraform export).")
                .AppendLine()
                .AppendLine("Contents:")
                .AppendLine("  README.txt              — this file")
                .AppendLine("  ADVISORY.md             — non-apply advisory notice (ArchLucid never runs terraform apply/destroy)")
                .AppendLine("  advisory-placeholder.tf — advisory-only stub (not applyable)")
                .AppendLine("  package-metadata.json   — export metadata");

            WriteTextEntry(archive, "README.txt", readme.ToString());

            const string placeholderTf = """
                # ArchLucid advisory – review before apply
                # Placeholder export: use `archlucid azure terraform-export` for aztfexport-backed bundles.
                """;

            string rawTf = placeholderTf.Trim();
            string? formattedTf = TerraformHclFormatHelper.TryFormat(rawTf);

            string tfBody = formattedTf is not null
                ? formattedTf
                : "# terraform fmt skipped (CLI unavailable or failed); advisory stub follows\n" + rawTf;

            WriteTextEntry(archive, "advisory-placeholder.tf", tfBody);

            WriteTextEntry(archive, "ADVISORY.md", TerraformAdvisoryExportCopy.AdvisoryMarkdownBody);

            WritePackageMetadata(
                archive,
                new
                {
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RunId = runId,
                    ExportKind = "terraform-advisory-placeholder"
                });
        }

        return new ArtifactPackage
        {
            PackageFileName = $"archlucid-terraform-advisory-{runId:N}.zip", Content = memoryStream.ToArray()
        };
    }

    private static void RecordTextEntry(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        string entryName,
        string content)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(content);
        RecordBinaryEntry(archive, recordedEntries, entryName, bytes);
    }

    private static void RecordBinaryEntry(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        string entryName,
        byte[] content)
    {
        ArgumentNullException.ThrowIfNull(content);

        string normalizedPath = entryName.Replace('\\', '/');
        WriteBytesEntry(archive, normalizedPath, content);
        recordedEntries.Add((normalizedPath, content));
    }

    private static void RecordPackageMetadata(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        Guid runId,
        Guid manifestId,
        int artifactCount,
        DateTime createdUtc)
    {
        string metadataJson = JsonSerializer.Serialize(
            new
            {
                CreatedUtc = createdUtc,
                RunId = runId,
                ManifestId = manifestId,
                ArtifactCount = artifactCount
            },
            JsonWriteIndented);

        RecordTextEntry(archive, recordedEntries, "package-metadata.json", metadataJson);
    }

    private static void WriteBytesEntry(ZipArchive archive, string entryName, byte[] content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
        using Stream entryStream = entry.Open();
        entryStream.Write(content, 0, content.Length);
    }

    private static void WriteTextEntry(ZipArchive archive, string entryName, string content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName.Replace('\\', '/'), CompressionLevel.Fastest);
        using Stream entryStream = entry.Open();
        using StreamWriter writer = new(entryStream, Encoding.UTF8);
        writer.Write(content);
    }

    private static void WriteBundleIndex(ZipArchive archive, IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        string indexJson = JsonSerializer.Serialize(
            artifacts.Select(x => new
            {
                x.ArtifactId,
                x.ArtifactType,
                x.Name,
                x.Format,
                x.CreatedUtc,
                x.ContentHash
            }),
            JsonWriteIndented);

        WriteTextEntry(archive, "bundle-index.json", indexJson);
    }

    private static void WritePackageMetadata(ZipArchive archive, object payload)
    {
        string metadataJson = JsonSerializer.Serialize(payload, JsonWriteIndented);
        WriteTextEntry(archive, "package-metadata.json", metadataJson);
    }

    /// <summary>Reserves a unique name within the current archive (flat or prefixed paths).</summary>
    private static string AvoidReservedEntryName(string sanitizedFileName, HashSet<string> reserved)
    {
        return reserved.Contains(sanitizedFileName) ? $"artifact-{sanitizedFileName}" : sanitizedFileName;
    }

    private static string AllocateUniqueEntryName(string sanitizedFileName, HashSet<string> usedEntryNames)
    {
        string candidate = sanitizedFileName;
        int n = 1;
        while (!usedEntryNames.Add(candidate))
        {
            string stem = Path.GetFileNameWithoutExtension(sanitizedFileName);
            string ext = Path.GetExtension(sanitizedFileName);
            candidate = $"{stem}_{n++}{ext}";
        }

        return candidate;
    }
}
