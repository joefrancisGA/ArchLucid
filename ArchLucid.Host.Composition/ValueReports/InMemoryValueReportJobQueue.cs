using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.ValueReports;

/// <summary>
/// In-process async generation for large windows (see <c>ValueReportComputationOptions.AsyncJobWhenWindowDaysExceeds</c>).
/// </summary>
public sealed class InMemoryValueReportJobQueue(
    IServiceScopeFactory scopeFactory,
    IDistributedCache distributedCache,
    ILogger<InMemoryValueReportJobQueue> logger) : IValueReportJobQueue
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static readonly DistributedCacheEntryOptions CacheEntryOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2)
    };

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IDistributedCache _distributedCache =
        distributedCache ?? throw new ArgumentNullException(nameof(distributedCache));

    private readonly ILogger<InMemoryValueReportJobQueue> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ConcurrentDictionary<Guid, JobEntry> _jobs = new();

    public Guid Enqueue(ValueReportJobRequest request)
    {
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        Guid jobId = Guid.NewGuid();
        JobEntry entry = new(request, JobPhase.Pending, null, null, null);

        if (!_jobs.TryAdd(jobId, entry))
            throw new InvalidOperationException("Duplicate job id (extremely unlikely).");

        WriteDistributedState(jobId, entry);

        _ = RunJobAsync(jobId, request);

        return jobId;
    }

    public ValueReportJobPollResult TryPoll(Guid jobId, Guid scopedTenantId)
    {
        if (!_jobs.TryGetValue(jobId, out JobEntry? entry))
        {
            entry = TryReadDistributedState(jobId);

            if (entry is null)
                return new ValueReportJobPollResult(false, false, null, null, null);
        }

        if (entry.Request.TenantId != scopedTenantId)
            return new ValueReportJobPollResult(false, false, null, null, null);

        return entry.Phase switch
        {
            JobPhase.Pending => new ValueReportJobPollResult(true, false, null, entry.FileName, null),
            JobPhase.Completed => new ValueReportJobPollResult(true, true, entry.Bytes, entry.FileName, null),
            JobPhase.Failed => new ValueReportJobPollResult(true, false, null, entry.FileName, entry.ErrorMessage),
            _ => new ValueReportJobPollResult(true, false, null, null, "Unknown job phase.")
        };
    }

    [InformationalAudit]
    private async Task RunJobAsync(Guid jobId, ValueReportJobRequest request)
    {
        try
        {
            await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

            using (AmbientScopeContext.Push(
                       new ScopeContext
                       {
                           TenantId = request.TenantId,
                           WorkspaceId = request.WorkspaceId,
                           ProjectId = request.ProjectId
                       }))
            {
                ValueReportBuilder builder = scope.ServiceProvider.GetRequiredService<ValueReportBuilder>();
                IValueReportRenderer renderer = scope.ServiceProvider.GetRequiredService<IValueReportRenderer>();
                IAuditService audit = scope.ServiceProvider.GetRequiredService<IAuditService>();

                ValueReportSnapshot snapshot = await builder.BuildAsync(
                    request.TenantId,
                    request.WorkspaceId,
                    request.ProjectId,
                    request.FromUtcInclusive,
                    request.ToUtcExclusive,
                    CancellationToken.None);

                byte[] docx = await renderer.RenderAsync(snapshot, CancellationToken.None);

                string fileName =
                    $"ArchLucid-value-report-{request.TenantId:N}-{request.FromUtcInclusive:yyyyMMdd}-{request.ToUtcExclusive:yyyyMMdd}.docx";

                await audit.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.ValueReportGenerated,
                        DataJson = JsonSerializer.Serialize(
                            new
                            {
                                jobId,
                                byteCount = docx.Length,
                                asyncJob = true
                            })
                    },
                    CancellationToken.None);

                JobEntry completed = new(request, JobPhase.Completed, docx, fileName, null);
                _jobs[jobId] = completed;
                WriteDistributedState(jobId, completed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Value report job {JobId} failed.", jobId);
            _jobs.TryGetValue(jobId, out JobEntry? existing);
            ValueReportJobRequest req = existing?.Request ?? request;
            JobEntry failed = new(req, JobPhase.Failed, null, null, ex.Message);
            _jobs[jobId] = failed;
            WriteDistributedState(jobId, failed);
        }
    }

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

            _distributedCache.Set(GetCacheKey(jobId), payload, CacheEntryOptions);
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
            byte[]? payload = _distributedCache.Get(GetCacheKey(jobId));

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
