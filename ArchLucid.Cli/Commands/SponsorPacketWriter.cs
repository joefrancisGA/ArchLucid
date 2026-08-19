using System.Globalization;
using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>Composes the buyer-ready sponsor packet folder from existing proof generators (T2-7).</summary>
internal static class SponsorPacketWriter
{
    private static readonly UTF8Encoding Utf8NoBom = new(false);

    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    internal static async Task<SponsorPacketWriteOutcome> WriteAsync(
        string runId,
        string apiBaseUrl,
        string outputDirectory,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        TextWriter errorWriter,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiBaseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);
        ArgumentNullException.ThrowIfNull(errorWriter);

        PilotProofPacketWriteOutcome proofOutcome = await PilotProofPacketCommand.WriteFolderAsync(
            runId,
            apiBaseUrl,
            outputDirectory,
            config,
            errorWriter,
            cancellationToken);

        if (proofOutcome.ExitCode != CliExitCode.Success)
            return new SponsorPacketWriteOutcome(proofOutcome.ExitCode, proofOutcome.OutputDirectory, null);

        string dir = proofOutcome.OutputDirectory;
        bool demoDataWarning = TryReadDemoDataWarning(dir);

        await EnrichFromApiAsync(runId, apiBaseUrl, config, dir, errorWriter, cancellationToken);

        await MirrorPilotRunDeltasAsync(dir, cancellationToken);

        string? auditSample = await TryReadTextAsync(Path.Combine(dir, "audit-sample.json"), cancellationToken);
        string? artifactManifest = await TryReadTextAsync(Path.Combine(dir, "artifact-manifest.json"), cancellationToken);

        string provenanceJson = SponsorPacketProvenanceBuilder.BuildJson(runId, auditSample, artifactManifest);
        await File.WriteAllTextAsync(
            Path.Combine(dir, SponsorPacketArtifactCatalog.ProvenanceReferencesFileName),
            provenanceJson,
            Utf8NoBom,
            cancellationToken);

        IReadOnlyList<string> presentFiles = Directory.GetFiles(dir)
            .Select(Path.GetFileName)
            .Where(static name => name is not null)
            .Select(static name => name!)
            .ToList();

        string buyerBrief = SponsorPacketBuyerDecisionBriefBuilder.BuildFromDirectory(dir);
        await File.WriteAllTextAsync(
            Path.Combine(dir, SponsorPacketArtifactCatalog.BuyerDecisionBriefFileName),
            buyerBrief,
            Utf8NoBom,
            cancellationToken);

        string indexMarkdown = SponsorPacketIndexBuilder.Build(runId, dir, presentFiles);
        await File.WriteAllTextAsync(
            Path.Combine(dir, SponsorPacketArtifactCatalog.IndexFileName),
            indexMarkdown,
            Utf8NoBom,
            cancellationToken);

        presentFiles = Directory.GetFiles(dir)
            .Select(Path.GetFileName)
            .Where(static name => name is not null)
            .Select(static name => name!)
            .ToList();

        string manifestBeforeFinal = SponsorPacketManifestBuilder.BuildJson(runId, demoDataWarning, dir);
        await File.WriteAllTextAsync(
            Path.Combine(dir, SponsorPacketArtifactCatalog.PackManifestFileName),
            manifestBeforeFinal,
            Utf8NoBom,
            cancellationToken);

        return new SponsorPacketWriteOutcome(CliExitCode.Success, dir, demoDataWarning);
    }

    internal static async Task<int> WriteZipAsync(
        string sourceDirectory,
        string zipPath,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceDirectory);
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        string fullSource = Path.GetFullPath(sourceDirectory);

        if (!Directory.Exists(fullSource))
            throw new DirectoryNotFoundException(fullSource);

        string? zipDirectory = Path.GetDirectoryName(Path.GetFullPath(zipPath));

        if (!string.IsNullOrEmpty(zipDirectory))
            Directory.CreateDirectory(zipDirectory);

        if (File.Exists(zipPath))
            File.Delete(zipPath);

        string[] files = Directory.GetFiles(fullSource);
        Array.Sort(files, StringComparer.Ordinal);

        await using FileStream zipStream = new(zipPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        using ZipArchive archive = new(zipStream, ZipArchiveMode.Create);

        foreach (string filePath in files)
        {
            string entryName = Path.GetFileName(filePath);
            ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);

            await using Stream entryStream = entry.Open();
            await using FileStream input = new(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            await input.CopyToAsync(entryStream, cancellationToken);
        }

        return CliExitCode.Success;
    }

    private static async Task EnrichFromApiAsync(
        string runId,
        string apiBaseUrl,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string outputDirectory,
        TextWriter errorWriter,
        CancellationToken cancellationToken)
    {
        string normalized = apiBaseUrl.Trim().TrimEnd('/');
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        using HttpClient http = new();
        http.Timeout = TimeSpan.FromMinutes(3);
        http.BaseAddress = new Uri(normalized + "/");

        if (!string.IsNullOrWhiteSpace(apiKey))
            http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using HttpResponseMessage SponsorReportResponse =
            await http.GetAsync("v1/roi/sponsor-report", cancellationToken);

        if (SponsorReportResponse.IsSuccessStatusCode)
        {
            string raw = await SponsorReportResponse.Content.ReadAsStringAsync(cancellationToken);
            string pretty = PrettyPrintJson(raw);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.SponsorReportFileName),
                pretty,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: sponsor-report fetch returned {(int)SponsorReportResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.SponsorReportFileName}.");
        }

        http.DefaultRequestHeaders.Accept.Clear();
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/markdown"));

        using HttpResponseMessage reviewPacketResponse = await http.GetAsync(
            $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/sponsor-review-packet",
            cancellationToken);

        if (reviewPacketResponse.IsSuccessStatusCode)
        {
            string markdown = await reviewPacketResponse.Content.ReadAsStringAsync(cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.SponsorReviewPacketFileName),
                markdown,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: sponsor-review-packet fetch returned {(int)reviewPacketResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.SponsorReviewPacketFileName}.");
        }

        using HttpResponseMessage firstValueResponse = await http.GetAsync(
            $"v1/pilots/runs/{Uri.EscapeDataString(runId)}/first-value-report",
            cancellationToken);

        if (firstValueResponse.IsSuccessStatusCode)
        {
            string markdown = await firstValueResponse.Content.ReadAsStringAsync(cancellationToken);

            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.FirstValueReportFileName),
                markdown,
                Utf8NoBom,
                cancellationToken);
        }
        else
        {
            await errorWriter.WriteLineAsync(
                $"WARN: first-value-report fetch returned {(int)firstValueResponse.StatusCode}; packet will omit {SponsorPacketArtifactCatalog.FirstValueReportFileName}.");
        }

        _ = config;
    }

    private static async Task MirrorPilotRunDeltasAsync(string outputDirectory, CancellationToken cancellationToken)
    {
        string sourcePath = Path.Combine(outputDirectory, "run-evidence.json");
        string targetPath = Path.Combine(outputDirectory, SponsorPacketArtifactCatalog.PilotRunDeltasFileName);

        if (!File.Exists(sourcePath))
            return;

        string content = await File.ReadAllTextAsync(sourcePath, cancellationToken);
        await File.WriteAllTextAsync(targetPath, content, Utf8NoBom, cancellationToken);
    }

    private static bool TryReadDemoDataWarning(string outputDirectory)
    {
        string environmentPath = Path.Combine(outputDirectory, "environment.json");

        if (!File.Exists(environmentPath))
            return false;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(environmentPath));
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("demoDataWarning", out JsonElement warning) && warning.ValueKind == JsonValueKind.True)
                return true;
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static async Task<string?> TryReadTextAsync(string path, CancellationToken cancellationToken)
    {
        if (!File.Exists(path))
            return null;

        return await File.ReadAllTextAsync(path, cancellationToken);
    }

    private static string PrettyPrintJson(string raw)
    {
        using JsonDocument doc = JsonDocument.Parse(raw);

        return JsonSerializer.Serialize(doc.RootElement, JsonWrite);
    }
}

/// <summary>Result of writing a sponsor packet folder.</summary>
internal sealed record SponsorPacketWriteOutcome(int ExitCode, string OutputDirectory, bool? DemoDataWarning);
