using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Value;
using ArchLucid.Contracts.ValueReports;

using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.ValueReports;

public sealed partial class InMemoryValueReportJobQueue
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly DistributedCacheEntryOptions CacheEntryOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2)
    };

    private bool TryWriteDistributedState(Guid jobId, JobEntry entry)
    {
        try
        {
            DistributedJobState state = new(
                entry.Request.TenantId,
                entry.Request.WorkspaceId,
                entry.Request.ProjectId,
                entry.Request.FromUtcInclusive,
                entry.Request.ToUtcExclusive,
                entry.Phase.ToString(),
                entry.Bytes is null ? null : Convert.ToBase64String(entry.Bytes),
                entry.FileName,
                entry.ErrorMessage);

            byte[] payload = JsonSerializer.SerializeToUtf8Bytes(state, SerializerOptions);

            _pollStateCache.Set(GetCacheKey(jobId), payload, CacheEntryOptions);

            return true;
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to persist value report job {JobId} to distributed cache.", jobId);

            return false;
        }
    }

    private void PublishDistributedTerminalStateOrClearStalePending(Guid jobId, JobEntry terminal)
    {
        if (!TryWriteDistributedState(jobId, terminal))
            TryRemoveDistributedState(jobId);
    }

    private void TryRemoveDistributedState(Guid jobId)
    {
        try
        {
            _pollStateCache.Remove(GetCacheKey(jobId));
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to remove value report job {JobId} from distributed cache.", jobId);
        }
    }

    private readonly record struct DistributedStateReadResult(JobEntry? Entry, bool CorruptPayload);

    private DistributedStateReadResult TryReadDistributedState(Guid jobId)
    {
        try
        {
            byte[]? payload = _pollStateCache.Get(GetCacheKey(jobId));

            if (payload is null || payload.Length == 0)
                return new DistributedStateReadResult(null, false);

            DistributedJobState? state = JsonSerializer.Deserialize<DistributedJobState>(payload, SerializerOptions);

            if (state is null ||
                state.TenantId == Guid.Empty ||
                state.WorkspaceId == Guid.Empty ||
                state.ProjectId == Guid.Empty ||
                state.FromUtcInclusive == default ||
                state.ToUtcExclusive == default ||
                state.FromUtcInclusive >= state.ToUtcExclusive)
                return new DistributedStateReadResult(null, true);

            ValueReportJobRequest request = new(
                state.TenantId,
                state.WorkspaceId,
                state.ProjectId,
                state.FromUtcInclusive,
                state.ToUtcExclusive);

            if (!Enum.TryParse(state.Phase, ignoreCase: true, out JobPhase phase))
            {
                return new DistributedStateReadResult(
                    new JobEntry(
                        request,
                        JobPhase.Failed,
                        null,
                        state.FileName,
                        UnknownFailedJobErrorMessage),
                    false);
            }

            byte[]? bytes = null;

            if (!string.IsNullOrEmpty(state.BytesBase64))
            {
                try
                {
                    bytes = Convert.FromBase64String(state.BytesBase64);
                }
                catch (FormatException)
                {
                    return new DistributedStateReadResult(
                        new JobEntry(
                            request,
                            JobPhase.Failed,
                            null,
                            state.FileName,
                            UnknownFailedJobErrorMessage),
                        false);
                }
            }

            return new DistributedStateReadResult(
                new JobEntry(request, phase, bytes, state.FileName, state.ErrorMessage),
                false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (JsonException ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to deserialize value report job {JobId} from distributed cache.", jobId);

            return new DistributedStateReadResult(null, true);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to read value report job {JobId} from distributed cache.", jobId);

            return new DistributedStateReadResult(null, true);
        }
    }

    private static JobEntry CreateCorruptDistributedFailureEntry(ValueReportJobRequest request) =>
        new(request, JobPhase.Failed, null, null, UnknownFailedJobErrorMessage);

    private static string GetCacheKey(Guid jobId) => $"archlucid:value-report-job:{jobId:N}";

    private sealed record JobEntry(
        ValueReportJobRequest Request,
        JobPhase Phase,
        byte[]? Bytes,
        string? FileName,
        string? ErrorMessage);

    private sealed record DistributedJobState(
        Guid TenantId,
        Guid WorkspaceId,
        Guid ProjectId,
        DateTimeOffset FromUtcInclusive,
        DateTimeOffset ToUtcExclusive,
        string Phase,
        string? BytesBase64,
        string? FileName,
        string? ErrorMessage);

    private enum JobPhase
    {
        Pending = 0,
        Completed = 1,
        Failed = 2
    }
}
