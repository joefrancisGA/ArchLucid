using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Commands;

internal static class PilotReadinessBundleChildArtifactWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    internal static async Task WriteBuyerProofAsync(
        BuyerProofEvidenceLedgerReport report,
        BuyerProofEvidenceLedgerOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = BuyerProofEvidenceLedgerCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteReturnTriggerAsync(
        ReturnTriggerTelemetryReport report,
        ReturnTriggerTelemetryOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = ReturnTriggerTelemetryCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteDecisionOwnerAsync(
        DecisionOwnerScoreboardReport report,
        DecisionOwnerScoreboardOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);

        await WriteTextAsync(outputPaths.JsonPath, json, cancellationToken);
        await WriteTextAsync(outputPaths.MarkdownPath, report.OperatorMarkdown, cancellationToken);
        await WriteTextAsync(outputPaths.SponsorMarkdownPath, report.SponsorMarkdown, cancellationToken);
    }

    internal static async Task WriteFrontierAiAsync(
        FrontierAiBaselineReport report,
        FrontierAiBaselineOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = FrontierAiBaselineCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteCitationAsync(
        CitationIntegrityReport report,
        CitationIntegrityOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = CitationIntegrityCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteTenantIsolationAsync(
        TenantIsolationNegativeTestReport report,
        TenantIsolationNegativeTestOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = TenantIsolationNegativeTestCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteShipGateAsync(
        ShipGateEvidenceReport report,
        ShipGateEvidenceOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = ShipGateEvidenceCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    internal static async Task WriteItsmPullForwardAsync(
        ItsmPullForwardReport report,
        ItsmPullForwardOutputResolution outputPaths,
        CancellationToken cancellationToken)
    {
        string json = JsonSerializer.Serialize(report, JsonOptions);
        string markdown = ItsmPullForwardCommand.BuildMarkdown(report);

        await WritePairAsync(outputPaths.JsonPath, outputPaths.MarkdownPath, json, markdown, cancellationToken);
    }

    private static async Task WritePairAsync(
        string? jsonPath,
        string? markdownPath,
        string json,
        string markdown,
        CancellationToken cancellationToken)
    {
        await WriteTextAsync(jsonPath, json, cancellationToken);
        await WriteTextAsync(markdownPath, markdown, cancellationToken);
    }

    private static async Task WriteTextAsync(string? path, string content, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(path))
            return;

        string directory = Path.GetDirectoryName(path)!;

        if (!Directory.Exists(directory))
            Directory.CreateDirectory(directory);

        await File.WriteAllTextAsync(path, content, Encoding.UTF8, cancellationToken);
    }
}
