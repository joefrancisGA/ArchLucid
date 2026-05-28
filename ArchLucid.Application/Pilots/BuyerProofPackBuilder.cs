using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Pilots;

/// <summary>Builds the email-sized sponsor proof ZIP for a committed run (Batch B items 5 and 4).</summary>
public interface IBuyerProofPackBuilder
{
    Task<BuyerProofPackBuildResult?> TryBuildZipAsync(
        string runId,
        string baseUrlForLinks,
        CancellationToken cancellationToken = default);
}

public sealed record BuyerProofPackBuildResult(byte[] ZipBytes, string FileName, bool DemoDataWarning);

public sealed class BuyerProofPackBuilder(
    FirstValueReportBuilder firstValueReportBuilder,
    FirstValueReportPdfBuilder firstValueReportPdfBuilder,
    IExecutiveReviewPacketBuilder executiveReviewPacketBuilder,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    ValueReportBuilder valueReportBuilder,
    IScopeContextProvider scopeContextProvider) : IBuyerProofPackBuilder
{
    private const string PackFormatVersion = "1.0";

    private static readonly UTF8Encoding Utf8NoBom = new(false);

    private readonly FirstValueReportBuilder _firstValueReportBuilder =
        firstValueReportBuilder ?? throw new ArgumentNullException(nameof(firstValueReportBuilder));

    private readonly FirstValueReportPdfBuilder _firstValueReportPdfBuilder =
        firstValueReportPdfBuilder ?? throw new ArgumentNullException(nameof(firstValueReportPdfBuilder));

    private readonly IExecutiveReviewPacketBuilder _executiveReviewPacketBuilder =
        executiveReviewPacketBuilder ?? throw new ArgumentNullException(nameof(executiveReviewPacketBuilder));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer =
        pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));

    private readonly ValueReportBuilder _valueReportBuilder =
        valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<BuyerProofPackBuildResult?> TryBuildZipAsync(
        string runId,
        string baseUrlForLinks,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrlForLinks);

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            return null;

        if (detail.Manifest is null || detail.Run.Status != ArchitectureRunStatus.Committed)
            return null;

        PilotRunDeltas deltas = await _pilotRunDeltaComputer.ComputeAsync(detail, cancellationToken);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot snapshot = await _valueReportBuilder.BuildAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            start,
            end,
            cancellationToken);

        PilotRunDeltasResponse deltasResponse = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            deltas,
            snapshot,
            extractorCollectionTimestampUtc: null);

        string deltasJson = JsonSerializer.Serialize(deltasResponse);

        if (!BuyerProofPackCommitGuard.TryValidateDeltasJson(deltasJson, out bool demoWarning, out _))
            return null;

        string? markdown = await _firstValueReportBuilder.BuildMarkdownAsync(runId, baseUrlForLinks, cancellationToken);

        if (markdown is null)
            return null;

        byte[]? pdf = await _firstValueReportPdfBuilder.BuildPdfAsync(runId, baseUrlForLinks, cancellationToken);

        if (pdf is null)
            return null;

        string? executivePacket =
            await _executiveReviewPacketBuilder.BuildMarkdownAsync(runId, cancellationToken);

        if (executivePacket is null)
            return null;

        byte[] executivePacketBytes = Utf8NoBom.GetBytes(executivePacket);
        byte[] markdownBytes = Utf8NoBom.GetBytes(markdown);
        byte[] deltasBytes = Utf8NoBom.GetBytes(PrettyPrintJson(deltasJson));
        byte[] artifactSummaryBytes = Utf8NoBom.GetBytes(BuyerProofPackArtifactSummaryBuilder.Build(deltasJson));
        byte[] trustPointerBytes = Utf8NoBom.GetBytes(BuyerProofPackTrustPointerMarkdown.Value);
        byte[] limitationsBytes = Utf8NoBom.GetBytes(BuyerProofPackLimitationsMarkdown.Build(detail, demoWarning));

        BuyerProofPackFileEntry[] entries =
        [
            new("executive-review-packet.md", executivePacketBytes),
            new("first-value-report.md", markdownBytes),
            new("first-value-report.pdf", pdf),
            new("pilot-run-deltas.json", deltasBytes),
            new("artifact-and-proof-summary.md", artifactSummaryBytes),
            new("limitations-and-next-actions.md", limitationsBytes),
            new("trust-posture-pointer.md", trustPointerBytes),
        ];

        Array.Sort(entries, static (left, right) => string.CompareOrdinal(left.RelativePath, right.RelativePath));

        string manifestJson = BuildPackManifestJson(runId.Trim(), demoWarning, entries);
        byte[] manifestBytes = Utf8NoBom.GetBytes(manifestJson);

        using MemoryStream zipStream = new();
        using (ZipArchive zip = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (BuyerProofPackFileEntry entry in entries)
            {
                ZipArchiveEntry zipEntry = zip.CreateEntry(entry.RelativePath, CompressionLevel.Optimal);

                await using Stream entryStream = zipEntry.Open();
                await entryStream.WriteAsync(entry.Content, cancellationToken).ConfigureAwait(false);
            }

            ZipArchiveEntry manifestEntry = zip.CreateEntry("pack-manifest.json", CompressionLevel.Optimal);

            await using Stream manifestStream = manifestEntry.Open();
            await manifestStream.WriteAsync(manifestBytes, cancellationToken).ConfigureAwait(false);
        }

        string fileName = $"sponsor-proof-pack-{runId.Trim()}.zip";

        return new BuyerProofPackBuildResult(zipStream.ToArray(), fileName, demoWarning);
    }

    private static string PrettyPrintJson(string raw)
    {
        using JsonDocument doc = JsonDocument.Parse(raw);

        return JsonSerializer.Serialize(doc.RootElement, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string BuildPackManifestJson(string runId, bool demoWarning, BuyerProofPackFileEntry[] sortedEntries)
    {
        DateTimeOffset utc = TimeProvider.System.GetUtcNow();
        Dictionary<string, object> root = new(StringComparer.Ordinal)
        {
            ["formatVersion"] = PackFormatVersion,
            ["generatedUtc"] = utc.ToString("O"),
            ["runId"] = runId,
            ["demoDataWarning"] = demoWarning,
            ["files"] = sortedEntries.Select(static entry => new Dictionary<string, object>(StringComparer.Ordinal)
            {
                ["path"] = entry.RelativePath,
                ["sha256"] = Sha256Hex(entry.Content),
                ["sizeBytes"] = entry.Content.Length,
            })
                .ToList(),
        };

        return JsonSerializer.Serialize(root, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string Sha256Hex(byte[] content)
    {
        byte[] hash = SHA256.HashData(content);
        StringBuilder builder = new(hash.Length * 2);

        foreach (byte value in hash)
            builder.Append(value.ToString("x2"));

        return builder.ToString();
    }

    private sealed record BuyerProofPackFileEntry(string RelativePath, byte[] Content);
}
