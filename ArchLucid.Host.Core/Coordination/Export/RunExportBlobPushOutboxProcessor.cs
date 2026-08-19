using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Coordination.Export;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Export;

/// <inheritdoc cref="IRunExportBlobPushOutboxProcessor" />
public sealed class RunExportBlobPushOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<RunExportBlobPushOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<RunExportBlobPushOutboxProcessor> logger)
    : RecoverableOutboxProcessorBase<
            RunExportBlobPushOutboxEntry,
            IRunExportBlobPushOutboxRepository,
            RunExportBlobPushOutboxProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        IRunExportBlobPushOutboxProcessor
{
    protected override int GetMaxConcurrentBatchEntries(RunExportBlobPushOutboxProcessorOptions opts) =>
        opts.MaxConcurrentBatchEntries;

    protected override void LogProcessingFailure(Exception fault, RunExportBlobPushOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Run export blob push outbox processing failed for outbox {OutboxId}, run {RunId}.",
                entry.OutboxId,
                entry.RunId);
        }
    }

    protected override async Task OnDeadLetterAsync(
        IServiceScope scope,
        RunExportBlobPushOutboxEntry entry,
        string summary,
        RunExportBlobPushOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
        await LogDeadLetterAuditAsync(auditService, entry.RunId, cancellationToken).ConfigureAwait(false);

        if (Logger.IsEnabled(LogLevel.Error))
        {
            Logger.LogError(
                "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                entry.OutboxId,
                entry.RunId,
                opts.MaxAttemptsBeforeDeadLetter,
                summary);
        }
    }

    protected override Task OnRetryScheduledAsync(
        RunExportBlobPushOutboxEntry entry,
        RunExportBlobPushOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxRetryScheduled();

        return Task.CompletedTask;
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        IRunExportBlobPushOutboxRepository outbox,
        RunExportBlobPushOutboxEntry entry,
        RunExportBlobPushOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        IRunExportPackageBuilder packageBuilder =
            scope.ServiceProvider.GetRequiredService<IRunExportPackageBuilder>();
        IRunExportBlobPushService pushService =
            scope.ServiceProvider.GetRequiredService<IRunExportBlobPushService>();
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

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
                .TryGetRejectionReasonAfterDnsResolveAsync(entry.DestinationSasUrl, cancellationToken)
                .ConfigureAwait(false);

        if (sasRejection is not null)
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, sasRejection, cancellationToken);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, cancellationToken);

            if (Logger.IsEnabled(LogLevel.Warning))
            {
                Logger.LogWarning(
                    "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}: destination rejected at processing time.",
                    entry.OutboxId,
                    entry.RunId);
            }

            return;
        }

        RunExportPackageResult packageResult = await packageBuilder.BuildAsync(
            scopeContext,
            entry.RunId,
            renderedDiagramPng: null,
            cancellationToken);

        if (!packageResult.Found)
        {
            Logger.LogWarning(
                "Skipping run export blob push for run {RunId}: {Reason}",
                entry.RunId,
                packageResult.NotFoundReason);
            await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
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
                cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            await outbox.RecordDeadLetterAsync(
                entry.OutboxId,
                Persistence.Orchestration.AuthorityPipelineWorkErrorSummary.From(ex),
                cancellationToken);
            ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, cancellationToken);

            if (Logger.IsEnabled(LogLevel.Error))
            {
                Logger.LogError(
                    ex,
                    "Run export blob push outbox dead-lettered outbox {OutboxId}, run {RunId}: non-retryable push failure.",
                    entry.OutboxId,
                    entry.RunId);
            }

            return;
        }

        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxProcessedSuccess();
    }

    protected override RunExportBlobPushOutboxProcessorOptions VerifyOptions(
        RunExportBlobPushOutboxProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        (int lease, int maxAttempts, int baseSecs, int maxSecs, int maxConcurrent) =
            OutboxProcessorOptionsVerifier.NormalizeParallelLeaseRetry(
                configured.LeaseDurationSeconds,
                configured.MaxAttemptsBeforeDeadLetter,
                configured.RetryBackoffBaseSeconds,
                configured.RetryBackoffMaxSeconds,
                configured.MaxConcurrentBatchEntries,
                MaxBatchSize);

        return new RunExportBlobPushOutboxProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
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
}
