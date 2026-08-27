using System.IO.Compression;
using System.Text;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

public partial class ArtifactPackagingService
{
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
}
