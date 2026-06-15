using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Export;

/// <inheritdoc cref="IRunExportBlobPushOutboxProcessor" />
public sealed class RunExportBlobPushOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<RunExportBlobPushOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<RunExportBlobPushOutboxProcessor> logger) : IRunExportBlobPushOutboxProcessor
{
    private const int MaxBatch = 25;

    private readonly ILogger<RunExportBlobPushOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptions<RunExportBlobPushOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ProcessPendingBatchAsync(CancellationToken ct)
    {
        RunExportBlobPushOutboxProcessorOptions opts = VerifiedOptions(_processorOptions.Value);

        using IServiceScope scope = _scopeFactory.CreateScope();
        IRunExportBlobPushOutboxRepository outbox =
            scope.ServiceProvider.GetRequiredService<IRunExportBlobPushOutboxRepository>();
        IRunExportPackageBuilder packageBuilder =
            scope.ServiceProvider.GetRequiredService<IRunExportPackageBuilder>();
        IRunExportBlobPushService pushService =
            scope.ServiceProvider.GetRequiredService<IRunExportBlobPushService>();
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

        IReadOnlyList<RunExportBlobPushOutboxEntry> batch =
            await outbox.DequeuePendingAsync(MaxBatch, opts.LeaseDurationSeconds, ct);

        foreach (RunExportBlobPushOutboxEntry entry in batch)

            try
            {
                await ProcessEntryAsync(outbox, packageBuilder, pushService, auditService, entry, opts, ct);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                await OnProcessingFailedAsync(outbox, auditService, entry, ex, opts, ct);
            }
    }

    private async Task ProcessEntryAsync(
        IRunExportBlobPushOutboxRepository outbox,
        IRunExportPackageBuilder packageBuilder,
        IRunExportBlobPushService pushService,
        IAuditService auditService,
        RunExportBlobPushOutboxEntry entry,
        RunExportBlobPushOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        using Activity? activity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
            "RunExportBlobPushOutbox.ProcessEntry");
        string correlationId = FormattableString.Invariant($"run-export-blob-outbox:{entry.OutboxId:D}");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
        activity?.SetTag("archlucid.run_id", entry.RunId.ToString("D"));
        activity?.SetTag("archlucid.outbox_id", entry.OutboxId.ToString("D"));

        ScopeContext scopeContext = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        ActivityScopeTags.ApplyTenantWorkspace(activity, scopeContext);

        using IDisposable _ = LogContext.PushProperty("CorrelationId", correlationId);

        string? sasRejection =
            await AllowedRunExportBlobDestinationUrlPolicy
                .TryGetRejectionReasonAfterDnsResolveAsync(entry.DestinationSasUrl, ct)
                .ConfigureAwait(false);

        if (sasRejection is not null)
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, sasRejection, ct);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, ct);

            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}: destination rejected at processing time.",
                    entry.OutboxId,
                    entry.RunId);

            return;
        }

        RunExportPackageResult packageResult = await packageBuilder.BuildAsync(
            scopeContext,
            entry.RunId,
            renderedDiagramPng: null,
            ct);

        if (!packageResult.Found)
        {
            _logger.LogWarning(
                "Skipping run export blob push for run {RunId}: {Reason}",
                entry.RunId,
                packageResult.NotFoundReason);
            await outbox.MarkProcessedAsync(entry.OutboxId, ct);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxProcessedSuccess();

            return;
        }

        if (packageResult.ZipContent is null || packageResult.ZipContent.Length == 0)
            throw new InvalidOperationException($"Run export ZIP for run '{entry.RunId:D}' was empty.");

        try
        {
            await pushService.PushAsync(
                entry.RunId,
                packageResult.ZipContent,
                entry.DestinationSasUrl,
                ct);
        }
        catch (InvalidOperationException ex)
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, AuthorityPipelineWorkErrorSummary.From(ex), ct);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, ct);

            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(
                    ex,
                    "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}: non-retryable push failure.",
                    entry.OutboxId,
                    entry.RunId);

            return;
        }

        await outbox.MarkProcessedAsync(entry.OutboxId, ct);
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxProcessedSuccess();
    }

    private async Task OnProcessingFailedAsync(
        IRunExportBlobPushOutboxRepository outbox,
        IAuditService auditService,
        RunExportBlobPushOutboxEntry entry,
        Exception fault,
        RunExportBlobPushOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                fault,
                "Run export blob push outbox processing failed for outbox {OutboxId}, run {RunId}.",
                entry.OutboxId,
                entry.RunId);

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        if (RetriesExhaustedAfterThisFailure(entry, opts))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, ct);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, ct);

            if (_logger.IsEnabled(LogLevel.Error))

                _logger.LogError(
                    "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                    entry.OutboxId,
                    entry.RunId,
                    opts.MaxAttemptsBeforeDeadLetter,
                    summary);

            return;
        }

        DateTime utcNow = _timeProvider.UtcNowDateTime();
        TimeSpan delay = RetryDelayAfterFailure(entry, opts);
        DateTime nextAttemptUtc = utcNow.Add(delay);

        await outbox.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, nextAttemptUtc, summary, ct);
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxRetryScheduled();
    }

    [InformationalAudit]
    private static async Task LogDeadLetterAuditAsync(IAuditService auditService, Guid runId, CancellationToken ct)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExportBlobPushDeadLettered,
                RunId = runId
            },
            ct);
    }

    private static bool RetriesExhaustedAfterThisFailure(
        RunExportBlobPushOutboxEntry entry,
        RunExportBlobPushOutboxProcessorOptions opts)
    {
        int max = opts.MaxAttemptsBeforeDeadLetter <= 1 ? 1 : opts.MaxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = entry.AttemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    private static TimeSpan RetryDelayAfterFailure(
        RunExportBlobPushOutboxEntry entry,
        RunExportBlobPushOutboxProcessorOptions opts)
    {
        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, entry.AttemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }

    private static RunExportBlobPushOutboxProcessorOptions VerifiedOptions(
        RunExportBlobPushOutboxProcessorOptions configured)
    {
        if (configured is null)
            throw new ArgumentNullException(nameof(configured));

        int lease = ClampInt(configured.LeaseDurationSeconds, 300, 7200);
        int maxAttempts = ClampInt(configured.MaxAttemptsBeforeDeadLetter, 1, 999);
        int baseSecs = ClampInt(configured.RetryBackoffBaseSeconds, 1, 86_400);
        int maxSecs = ClampInt(configured.RetryBackoffMaxSeconds, 1, 86_400 * 7);

        if (maxSecs < baseSecs)
            maxSecs = baseSecs;

        return new RunExportBlobPushOutboxProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
        };
    }

    private static int ClampInt(int value, int minInclusive, int maxInclusive)
    {
        return value < minInclusive ? minInclusive : value > maxInclusive ? maxInclusive : value;
    }
}
