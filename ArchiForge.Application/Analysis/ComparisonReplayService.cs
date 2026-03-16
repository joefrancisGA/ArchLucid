using System.Text.Json;
using ArchiForge.Contracts.Metadata;
using ArchiForge.Data.Repositories;

namespace ArchiForge.Application.Analysis;

public sealed class ComparisonReplayService : IComparisonReplayService
{
    private static readonly JsonSerializerOptions EquivalenceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
        PropertyNameCaseInsensitive = true
    };

    private readonly IComparisonRecordRepository _comparisonRecordRepository;
    private readonly IEndToEndReplayComparisonService _endToEndReplayComparisonService;
    private readonly IEndToEndReplayComparisonSummaryFormatter _endToEndSummaryFormatter;
    private readonly IEndToEndReplayComparisonExportService _endToEndExportService;
    private readonly IExportRecordDiffService _exportRecordDiffService;
    private readonly IExportRecordDiffSummaryFormatter _exportRecordDiffSummaryFormatter;
    private readonly IRunExportRecordRepository _runExportRecordRepository;

    public ComparisonReplayService(
        IComparisonRecordRepository comparisonRecordRepository,
        IEndToEndReplayComparisonService endToEndReplayComparisonService,
        IEndToEndReplayComparisonSummaryFormatter endToEndSummaryFormatter,
        IEndToEndReplayComparisonExportService endToEndExportService,
        IExportRecordDiffService exportRecordDiffService,
        IExportRecordDiffSummaryFormatter exportRecordDiffSummaryFormatter,
        IRunExportRecordRepository runExportRecordRepository)
    {
        _comparisonRecordRepository = comparisonRecordRepository;
        _endToEndReplayComparisonService = endToEndReplayComparisonService;
        _endToEndSummaryFormatter = endToEndSummaryFormatter;
        _endToEndExportService = endToEndExportService;
        _exportRecordDiffService = exportRecordDiffService;
        _exportRecordDiffSummaryFormatter = exportRecordDiffSummaryFormatter;
        _runExportRecordRepository = runExportRecordRepository;
    }

    public async Task<ReplayComparisonResult> ReplayAsync(
        ReplayComparisonRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ComparisonRecordId))
        {
            throw new InvalidOperationException("ComparisonRecordId is required.");
        }

        var record = await _comparisonRecordRepository.GetByIdAsync(
            request.ComparisonRecordId,
            cancellationToken);

        if (record is null)
        {
            throw new InvalidOperationException(
                $"Comparison record '{request.ComparisonRecordId}' was not found.");
        }

        var format = NormalizeFormat(request.Format);
        var profile = EndToEndComparisonExportProfile.Normalize(request.Profile);
        var mode = ParseReplayMode(request.ReplayMode);

        return record.ComparisonType switch
        {
            "end-to-end-replay" => await ReplayEndToEndAsync(record, format, profile, mode, cancellationToken),
            "export-record-diff" => await ReplayExportDiffAsync(record, format, mode, cancellationToken),
            _ => throw new InvalidOperationException(
                $"Replay is not supported for comparison type '{record.ComparisonType}'.")
        };
    }

    private async Task<ReplayComparisonResult> ReplayEndToEndAsync(
        ComparisonRecord record,
        string format,
        string profile,
        ComparisonReplayMode mode,
        CancellationToken cancellationToken)
    {
        EndToEndReplayComparisonReport report;

        switch (mode)
        {
            case ComparisonReplayMode.ArtifactReplay:
                report = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record)
                    ?? throw new InvalidOperationException(
                        $"Comparison record '{record.ComparisonRecordId}' did not contain a valid end-to-end payload.");
                break;
            case ComparisonReplayMode.Regenerate:
                report = await RegenerateEndToEndAsync(record, cancellationToken);
                break;
            case ComparisonReplayMode.Verify:
                var stored = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(record)
                    ?? throw new InvalidOperationException(
                        $"Comparison record '{record.ComparisonRecordId}' did not contain a valid end-to-end payload.");
                report = await RegenerateEndToEndAsync(record, cancellationToken);
                if (!AreReportsEquivalent(stored, report))
                {
                    throw new ComparisonVerificationFailedException(
                        $"Comparison record '{record.ComparisonRecordId}': regenerated end-to-end comparison does not match stored payload. Engine or architecture drift detected.");
                }
                break;
            default:
                throw new InvalidOperationException($"Unsupported replay mode '{mode}'.");
        }

        var result = await BuildEndToEndResultAsync(record, report, format, profile, cancellationToken);
        result.ReplayMode = FormatReplayMode(mode);
        if (mode == ComparisonReplayMode.Verify)
        {
            result.VerificationPassed = true;
            result.VerificationMessage = "Regenerated comparison matches stored payload.";
        }
        return result;
    }

    private async Task<EndToEndReplayComparisonReport> RegenerateEndToEndAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(record.LeftRunId) || string.IsNullOrWhiteSpace(record.RightRunId))
        {
            throw new InvalidOperationException(
                $"Comparison record '{record.ComparisonRecordId}' has no LeftRunId/RightRunId; cannot regenerate end-to-end comparison.");
        }

        return await _endToEndReplayComparisonService.BuildAsync(
            record.LeftRunId,
            record.RightRunId,
            cancellationToken);
    }

    private static bool AreReportsEquivalent(
        EndToEndReplayComparisonReport stored,
        EndToEndReplayComparisonReport regenerated)
    {
        var leftJson = JsonSerializer.Serialize(stored, EquivalenceJsonOptions);
        var rightJson = JsonSerializer.Serialize(regenerated, EquivalenceJsonOptions);
        return leftJson == rightJson;
    }

    private async Task<ReplayComparisonResult> BuildEndToEndResultAsync(
        ComparisonRecord record,
        EndToEndReplayComparisonReport report,
        string format,
        string profile,
        CancellationToken cancellationToken)
    {
        if (string.Equals(format, "markdown", StringComparison.OrdinalIgnoreCase))
        {
            var markdown = _endToEndExportService.GenerateMarkdown(report, profile);
            return new ReplayComparisonResult
            {
                ComparisonRecordId = record.ComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "markdown",
                FileName = $"comparison_{record.ComparisonRecordId}.md",
                Content = markdown
            };
        }

        if (string.Equals(format, "html", StringComparison.OrdinalIgnoreCase))
        {
            var html = _endToEndExportService.GenerateHtml(report, profile);
            return new ReplayComparisonResult
            {
                ComparisonRecordId = record.ComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "html",
                FileName = $"comparison_{record.ComparisonRecordId}.html",
                Content = html
            };
        }

        if (string.Equals(format, "docx", StringComparison.OrdinalIgnoreCase))
        {
            var bytes = await _endToEndExportService.GenerateDocxAsync(
                report,
                cancellationToken,
                profile);
            return new ReplayComparisonResult
            {
                ComparisonRecordId = record.ComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "docx",
                FileName = $"comparison_{record.ComparisonRecordId}.docx",
                BinaryContent = bytes
            };
        }

        if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            var bytes = await _endToEndExportService.GeneratePdfAsync(
                report,
                cancellationToken,
                profile);
            return new ReplayComparisonResult
            {
                ComparisonRecordId = record.ComparisonRecordId,
                ComparisonType = record.ComparisonType,
                Format = "pdf",
                FileName = $"comparison_{record.ComparisonRecordId}.pdf",
                BinaryContent = bytes
            };
        }

        throw new InvalidOperationException($"Unsupported replay format '{format}'.");
    }

    private async Task<ReplayComparisonResult> ReplayExportDiffAsync(
        ComparisonRecord record,
        string format,
        ComparisonReplayMode mode,
        CancellationToken cancellationToken)
    {
        ExportRecordDiffResult diff;

        switch (mode)
        {
            case ComparisonReplayMode.ArtifactReplay:
                diff = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record)
                    ?? throw new InvalidOperationException(
                        $"Comparison record '{record.ComparisonRecordId}' did not contain a valid export-diff payload.");
                break;
            case ComparisonReplayMode.Regenerate:
                diff = await RegenerateExportDiffAsync(record, cancellationToken);
                break;
            case ComparisonReplayMode.Verify:
                var stored = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(record)
                    ?? throw new InvalidOperationException(
                        $"Comparison record '{record.ComparisonRecordId}' did not contain a valid export-diff payload.");
                diff = await RegenerateExportDiffAsync(record, cancellationToken);
                if (!AreExportDiffsEquivalent(stored, diff))
                {
                    throw new ComparisonVerificationFailedException(
                        $"Comparison record '{record.ComparisonRecordId}': regenerated export-record diff does not match stored payload. Engine or architecture drift detected.");
                }
                break;
            default:
                throw new InvalidOperationException($"Unsupported replay mode '{mode}'.");
        }

        if (!string.Equals(format, "markdown", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Export-record diff replay currently supports markdown only.");
        }

        var markdown = _exportRecordDiffSummaryFormatter.FormatMarkdown(diff);
        var result = new ReplayComparisonResult
        {
            ComparisonRecordId = record.ComparisonRecordId,
            ComparisonType = record.ComparisonType,
            Format = "markdown",
            FileName = $"comparison_{record.ComparisonRecordId}.md",
            Content = markdown,
            ReplayMode = FormatReplayMode(mode)
        };
        if (mode == ComparisonReplayMode.Verify)
        {
            result.VerificationPassed = true;
            result.VerificationMessage = "Regenerated comparison matches stored payload.";
        }
        return result;
    }

    private async Task<ExportRecordDiffResult> RegenerateExportDiffAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(record.LeftExportRecordId) || string.IsNullOrWhiteSpace(record.RightExportRecordId))
        {
            throw new InvalidOperationException(
                $"Comparison record '{record.ComparisonRecordId}' has no LeftExportRecordId/RightExportRecordId; cannot regenerate export-record diff.");
        }

        var left = await _runExportRecordRepository.GetByIdAsync(record.LeftExportRecordId, cancellationToken)
            ?? throw new InvalidOperationException(
                $"Export record '{record.LeftExportRecordId}' was not found.");
        var right = await _runExportRecordRepository.GetByIdAsync(record.RightExportRecordId, cancellationToken)
            ?? throw new InvalidOperationException(
                $"Export record '{record.RightExportRecordId}' was not found.");

        return _exportRecordDiffService.Compare(left, right);
    }

    private static bool AreExportDiffsEquivalent(
        ExportRecordDiffResult stored,
        ExportRecordDiffResult regenerated)
    {
        var leftJson = JsonSerializer.Serialize(stored, EquivalenceJsonOptions);
        var rightJson = JsonSerializer.Serialize(regenerated, EquivalenceJsonOptions);
        return leftJson == rightJson;
    }

    private static ComparisonReplayMode ParseReplayMode(string? replayMode)
    {
        var value = (replayMode ?? "artifact").Trim().ToLowerInvariant();
        return value switch
        {
            "artifact" => ComparisonReplayMode.ArtifactReplay,
            "regenerate" => ComparisonReplayMode.Regenerate,
            "verify" => ComparisonReplayMode.Verify,
            _ => ComparisonReplayMode.ArtifactReplay
        };
    }

    private static string FormatReplayMode(ComparisonReplayMode mode)
    {
        return mode switch
        {
            ComparisonReplayMode.ArtifactReplay => "artifact",
            ComparisonReplayMode.Regenerate => "regenerate",
            ComparisonReplayMode.Verify => "verify",
            _ => "artifact"
        };
    }

    private static string NormalizeFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format))
        {
            return "markdown";
        }

        return format.Trim().ToLowerInvariant();
    }
}

