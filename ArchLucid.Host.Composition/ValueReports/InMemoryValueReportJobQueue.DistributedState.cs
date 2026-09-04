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

    private void WriteDistributedState(Guid jobId, JobEntry entry)
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
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to persist value report job {JobId} to distributed cache.", jobId);
        }
    }

    private JobEntry? TryReadDistributedState(Guid jobId)
    {
        try
        {
            byte[]? payload = _pollStateCache.Get(GetCacheKey(jobId));

            if (payload is null || payload.Length == 0)
                return null;

            DistributedJobState? state = JsonSerializer.Deserialize<DistributedJobState>(payload, SerializerOptions);

            if (state is null)
                return null;

            ValueReportJobRequest request = new(
                state.TenantId,
                state.WorkspaceId,
                state.ProjectId,
                state.FromUtcInclusive,
                state.ToUtcExclusive);

            JobPhase phase = Enum.TryParse<JobPhase>(state.Phase, ignoreCase: true, out JobPhase parsedPhase)
                ? parsedPhase
                : JobPhase.Pending;

            byte[]? bytes = string.IsNullOrEmpty(state.BytesBase64)
                ? null
                : Convert.FromBase64String(state.BytesBase64);

            return new JobEntry(request, phase, bytes, state.FileName, state.ErrorMessage);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Failed to read value report job {JobId} from distributed cache.", jobId);

            return null;
        }
    }

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
