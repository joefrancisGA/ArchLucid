using System.Diagnostics;
using ArchiForge.Application.Analysis;
using Microsoft.Extensions.Logging;

namespace ArchiForge.Api.Services;

public sealed class ComparisonReplayApiService : IComparisonReplayApiService
{
    private readonly IComparisonReplayService _inner;
    private readonly IReplayDiagnosticsRecorder _replayDiagnosticsRecorder;
    private readonly ILogger<ComparisonReplayApiService> _logger;

    public ComparisonReplayApiService(
        IComparisonReplayService inner,
        IReplayDiagnosticsRecorder replayDiagnosticsRecorder,
        ILogger<ComparisonReplayApiService> logger)
    {
        _inner = inner;
        _replayDiagnosticsRecorder = replayDiagnosticsRecorder;
        _logger = logger;
    }

    public async Task<ReplayComparisonResult> ReplayAsync(
        ReplayComparisonRequest request,
        bool metadataOnly,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var sw = Stopwatch.StartNew();
        try
        {
            var result = await _inner.ReplayAsync(request, cancellationToken);
            sw.Stop();

            _replayDiagnosticsRecorder.Record(new ReplayDiagnosticsEntry
            {
                TimestampUtc = DateTime.UtcNow,
                ComparisonRecordId = request.ComparisonRecordId,
                ComparisonType = result.ComparisonType,
                Format = result.Format,
                ReplayMode = result.ReplayMode,
                PersistReplay = request.PersistReplay,
                DurationMs = sw.ElapsedMilliseconds,
                Success = true,
                VerificationPassed = result.VerificationPassed,
                PersistedReplayRecordId = result.PersistedReplayRecordId,
                MetadataOnly = metadataOnly
            });

            _logger.LogInformation(
                "Comparison replay: ComparisonRecordId={ComparisonRecordId}, Type={ComparisonType}, Format={Format}, ReplayMode={ReplayMode}, PersistReplay={PersistReplay}, MetadataOnly={MetadataOnly}, DurationMs={DurationMs}, VerificationPassed={VerificationPassed}",
                request.ComparisonRecordId,
                result.ComparisonType,
                result.Format,
                result.ReplayMode,
                request.PersistReplay,
                metadataOnly,
                sw.ElapsedMilliseconds,
                result.VerificationPassed);

            return result;
        }
        catch (InvalidOperationException ex)
        {
            sw.Stop();

            _replayDiagnosticsRecorder.Record(new ReplayDiagnosticsEntry
            {
                TimestampUtc = DateTime.UtcNow,
                ComparisonRecordId = request.ComparisonRecordId,
                ComparisonType = string.Empty,
                Format = request.Format ?? "markdown",
                ReplayMode = request.ReplayMode ?? "artifact",
                PersistReplay = request.PersistReplay,
                DurationMs = sw.ElapsedMilliseconds,
                Success = false,
                ErrorMessage = ex.Message,
                MetadataOnly = metadataOnly
            });

            var notFound = ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase);
            _logger.LogWarning(
                ex,
                "Comparison replay failed: ComparisonRecordId={ComparisonRecordId}, NotFound={NotFound}, MetadataOnly={MetadataOnly}, Error={Error}",
                request.ComparisonRecordId,
                notFound,
                metadataOnly,
                ex.Message);

            throw;
        }
    }

    public Task<DriftAnalysisResult> AnalyzeDriftAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        return _inner.AnalyzeDriftAsync(comparisonRecordId, cancellationToken);
    }
}

