using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <inheritdoc cref="IAuthorityPipelineWorkProcessor" />
/// <remarks>
///     When hosted in <c>ArchLucid.Worker</c>, Information-level <c>Agent execution state transition</c> logs cover the
///     deferred authority outbox path (run id, states, task ids, outbox id).
/// </remarks>
public sealed class AuthorityPipelineWorkProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<AuthorityPipelineWorkProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<AuthorityPipelineWorkProcessor> logger)
    : RecoverableOutboxProcessorBase<
            AuthorityPipelineWorkOutboxEntry,
            IAuthorityPipelineWorkRepository,
            AuthorityPipelineWorkProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        IAuthorityPipelineWorkProcessor
{
    protected override int GetMaxConcurrentBatchEntries(AuthorityPipelineWorkProcessorOptions opts) =>
        opts.MaxConcurrentBatchEntries;

    protected override void LogProcessingFailure(Exception fault, AuthorityPipelineWorkOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Authority pipeline work failed for outbox {OutboxId}, run {RunId}.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")));
        }
    }

    protected override async Task OnDeadLetterAsync(
        IServiceScope scope,
        AuthorityPipelineWorkOutboxEntry entry,
        string summary,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
        };

        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();

        await AuthorityPipelineDeadLetterRunMarker.TryMarkRunDeadLetteredAsync(
            runRepository,
            jobScope,
            entry.RunId,
            summary,
            TimeProvider.UtcNowDateTime(),
            cancellationToken).ConfigureAwait(false);

        if (Logger.IsEnabled(LogLevel.Error))
        {
            Logger.LogError(
                "Authority pipeline work dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")),
                opts.MaxAttemptsBeforeDeadLetter,
                LogSanitizer.Sanitize(summary));
        }
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        IAuthorityPipelineWorkRepository workOutbox,
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        if (!AuthorityPipelineWorkPayloadJson.TryDeserialize(entry.PayloadJson, out AuthorityPipelineWorkPayload? payload) ||
            payload is null ||
            !payload.IsValidForProcessing())
        {
            Logger.LogError(
                "Authority pipeline work outbox {OutboxId} has invalid payload; marking processed.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()));
            await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);

            return;
        }

        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
        };

        using IDisposable _ = AmbientScopeContext.Push(jobScope);

        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? persistedRun = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (persistedRun is null)
        {
            Logger.LogError(
                "Authority pipeline work outbox {OutboxId} references missing run {RunId}; marking processed.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")));
            await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);

            return;
        }

        IAuthorityPipelineWorkHandler handler = ResolveHandler(scope, payload);
        await handler.HandleAsync(entry, payload, cancellationToken).ConfigureAwait(false);
        await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);
    }

    protected override AuthorityPipelineWorkProcessorOptions VerifyOptions(
        AuthorityPipelineWorkProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        (int lease, int maxAttempts, int baseSecs, int maxSecs, int maxConcurrent) =
            OutboxProcessorOptionsVerifier.NormalizeParallelLeaseRetry(
                configured.LeaseDurationSeconds,
                configured.MaxAttemptsBeforeDeadLetter,
                configured.RetryBackoffBaseSeconds,
                configured.RetryBackoffMaxSeconds,
                configured.MaxConcurrentBatchEntries,
                MaxBatchSize,
                minLeaseDurationSeconds: AuthorityPipelineWorkRepositoryCore.MinLeaseDurationSeconds);

        return new AuthorityPipelineWorkProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
    }

    private static IAuthorityPipelineWorkHandler ResolveHandler(IServiceScope scope, AuthorityPipelineWorkPayload payload)
    {
        IEnumerable<IAuthorityPipelineWorkHandler> handlers =
            scope.ServiceProvider.GetServices<IAuthorityPipelineWorkHandler>();

        IAuthorityPipelineWorkHandler? handler = handlers.FirstOrDefault(h => h.CanHandle(payload));

        if (handler is null)
        {
            throw new InvalidOperationException(
                "No authority pipeline work handler registered for payload (run continuation).");
        }

        return handler;
    }
}
