using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class SponsorPacketWriter
{
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
