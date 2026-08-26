using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

public sealed partial class QuickScanExecutionOrchestrator
{
    /// <inheritdoc />
    public async Task<QuickScanExecutionResult> ExecuteAsync(
        ArchitectureQuickScanRequest? request,
        QuickScanExecutionRequestContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanSafetyOperationalSnapshot operational =
                await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

            if (!operational.AnonymousExecutionAllowed)
            {
                return QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(operational.PublicMessage)
                        ? "Quick Scan is temporarily unavailable."
                        : operational.PublicMessage);
            }
        }

        QuickScanSafetyOptions safetyOptions = quickScanSafetyOptions.CurrentValue;
        QuickScanOptions baseOptions = quickScanOptions.CurrentValue;
        QuickScanOptions options = QuickScanEffectiveLimits.Merge(baseOptions, safetyOptions);

        if (!QuickScanRequestValidator.TryValidate(request, options, out QuickScanRequestValidator.ValidatedQuickScanRequest? validated, out string? validationError))
        {
            return QuickScanExecutionResult.ValidationFailed(validationError ?? "Validation failed.");
        }

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            Dictionary<string, string> previewFiles = QuickScanMinimalContextBuilder.BuildFiles(validated!);
            string userPayload = JsonSerializer.Serialize(previewFiles);
            int estimatedInputTokens = QuickScanInputTokenEstimator.EstimateTokens(
                QuickScanLlmSystemPrompt.Text,
                userPayload);

            if (estimatedInputTokens > safetyOptions.PerRequest.MaxInputTokens)
            {
                return QuickScanExecutionResult.ValidationFailed(
                    $"description exceeds the maximum input size for Quick Scan ({safetyOptions.PerRequest.MaxInputTokens} tokens).");
            }
        }

        bool useDistributedIdentityAbuse =
            safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency;

        if (useDistributedIdentityAbuse)
        {
            QuickScanIdentityAbuseDecision abuseDecision = await quickScanIdentityAbuseService.TryAdmitAsync(
                new QuickScanIdentityAbuseAdmitContext
                {
                    ClientIp = context.ClientIp,
                    SessionId = context.SessionId,
                    BrowserId = string.IsNullOrWhiteSpace(context.BrowserId)
                        ? context.SessionId
                        : context.BrowserId,
                    Description = validated!.Description,
                    BotChallengeToken = context.BotChallengeToken ?? request?.BotChallengeToken,
                },
                cancellationToken).ConfigureAwait(false);

            if (!abuseDecision.Allowed)
            {
                QuickScanGuardContext rejectedContext = QuickScanGuardContextFactory.Create(
                    context.ClientIp,
                    context.SessionId,
                    validated.Description,
                    useDistributedConcurrencyLimit: true,
                    useDistributedIdentityAbuseLimit: true);
                quickScanTelemetry.RecordAttempt(rejectedContext);
                quickScanTelemetry.RecordRejection(rejectedContext, abuseDecision.RejectionReason!.Value);
                quickScanGuard.RecordRejection(rejectedContext, abuseDecision.RejectionReason.Value);
                await RecordUsageAsync(
                    rejectedContext,
                    context,
                    status: "rejected",
                    reservationId: null,
                    reservedUsd: null,
                    actualCostUsd: null,
                    inputTokens: null,
                    outputTokens: null,
                    modelLabel: null,
                    rejectionReason: abuseDecision.RejectionReason.Value.ToString(),
                    duration: TimeSpan.Zero,
                    cancellationToken).ConfigureAwait(false);

                return QuickScanExecutionResult.GuardRejected(abuseDecision.RejectionReason.Value);
            }
        }

        QuickScanGuardContext guardContext = QuickScanGuardContextFactory.Create(
            context.ClientIp,
            context.SessionId,
            validated!.Description,
            useDistributedConcurrencyLimit: context.RequiresAnonymousDistributedConcurrency,
            useDistributedIdentityAbuseLimit: useDistributedIdentityAbuse);
        quickScanTelemetry.RecordAttempt(guardContext);

        QuickScanGuardDecision decision = quickScanGuard.TryBeginScan(guardContext);

        if (!decision.Allowed)
        {
            quickScanTelemetry.RecordRejection(guardContext, decision.RejectionReason!.Value);
            quickScanGuard.RecordRejection(guardContext, decision.RejectionReason.Value);
            await RecordUsageAsync(
                guardContext,
                context,
                status: "rejected",
                reservationId: null,
                reservedUsd: null,
                actualCostUsd: null,
                inputTokens: null,
                outputTokens: null,
                modelLabel: null,
                rejectionReason: decision.RejectionReason.Value.ToString(),
                duration: TimeSpan.Zero,
                cancellationToken).ConfigureAwait(false);

            return QuickScanExecutionResult.GuardRejected(decision.RejectionReason.Value);
        }

        DateTimeOffset started = timeProvider.GetUtcNow();
        decimal reservedCostUsd = 0m;
        Guid? globalBudgetReservationId = null;

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanCostEstimateResult costReservation = quickScanCostEstimator.TryReserveCost(
                validated!,
                context.ClientRequestedModelId,
                started);

            if (!costReservation.Allowed)
            {
                if (costReservation.RejectionReason == QuickScanCostEstimateRejectionReason.ClientModelOverrideRejected)
                {
                    return QuickScanExecutionResult.ValidationFailed("Client model selection is not permitted for Quick Scan.");
                }

                quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"pre_exec_cost_{costReservation.RejectionReason}",
                    TimeSpan.Zero);

                return QuickScanExecutionResult.CapacityReached();
            }

            reservedCostUsd = costReservation.Reservation!.TotalReservedUsd;
        }

        await using QuickScanDistributedConcurrencyAdmissionResult concurrencyAdmission =
            context.RequiresAnonymousDistributedConcurrency
                ? await quickScanDistributedConcurrencyService
                    .WaitForAdmissionAsync(context.TraceIdentifier, cancellationToken)
                    .ConfigureAwait(false)
                : QuickScanDistributedConcurrencyAdmissionResult.NoOp();

        if (!concurrencyAdmission.Allowed)
        {
            quickScanTelemetry.RecordFailure(
                guardContext,
                $"concurrency_{concurrencyAdmission.RejectionReason}",
                TimeSpan.Zero);

            if (concurrencyAdmission.RejectionReason == QuickScanConcurrencyRejectionReason.EmergencyDisabled)
            {
                QuickScanSafetyOperationalSnapshot operational =
                    await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

                return QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(operational.PublicMessage)
                        ? "Quick Scan is temporarily unavailable."
                        : operational.PublicMessage);
            }

            return QuickScanExecutionResult.ConcurrencyRejected(concurrencyAdmission.RejectionReason!.Value);
        }

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanGlobalBudgetReservationAttemptResult budgetReservation =
                await quickScanGlobalBudgetReservationService.TryReserveAsync(
                    context.TraceIdentifier,
                    reservedCostUsd,
                    started,
                    cancellationToken).ConfigureAwait(false);

            if (!budgetReservation.Allowed)
            {
                quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"global_budget_{budgetReservation.RejectionReason}",
                    TimeSpan.Zero);

                return QuickScanExecutionResult.CapacityReached();
            }

            globalBudgetReservationId = budgetReservation.ReservationId;
        }

        quickScanGuard.RecordScanStarted(guardContext);

        try
        {
            QuickScanSafetyOperationalSnapshot preProviderOperational =
                await quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

            if (context.RequiresAnonymousDistributedConcurrency && !preProviderOperational.AnonymousExecutionAllowed)
            {
                return QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(preProviderOperational.PublicMessage)
                        ? "Quick Scan is temporarily unavailable."
                        : preProviderOperational.PublicMessage);
            }

            Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(validated!);
            QuickScanResult scan;

            using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.QuickScan))
            {
                scan = await quickScanService.ScanAsync(files, cancellationToken).ConfigureAwait(false);
            }

            ArchitectureQuickScanResponse body = ArchitectureQuickScanResponseMapper.Map(
                scan,
                validated!,
                options.MaxFindingsReturned);

            LlmCompletionTokenUsageAmbient.TryPeek(out int? inputTokens, out int? outputTokens, out int? _);
            decimal estimatedCost = costEstimator.EstimateUsd(inputTokens ?? 0, outputTokens ?? 0, 0, deploymentLabel: null)
                ?? reservedCostUsd;
            TimeSpan duration = timeProvider.GetUtcNow() - started;

            if (estimatedCost > options.MaxEstimatedCostUsdPerScan)
            {
                if (globalBudgetReservationId.HasValue)
                {
                    await quickScanGlobalBudgetReservationService
                        .ReleaseAsync(globalBudgetReservationId.Value, cancellationToken)
                        .ConfigureAwait(false);
                }

                quickScanTelemetry.RecordFailure(guardContext, "per_scan_cost_exceeded", duration);

                return QuickScanExecutionResult.CapacityReached();
            }

            if (globalBudgetReservationId.HasValue)
            {
                await quickScanGlobalBudgetReservationService
                    .CommitAsync(globalBudgetReservationId.Value, estimatedCost, cancellationToken)
                    .ConfigureAwait(false);
            }

            quickScanGuard.RecordScanCompleted(
                guardContext,
                succeeded: true,
                estimatedCost,
                inputTokens ?? 0,
                outputTokens ?? 0,
                duration);

            quickScanTelemetry.RecordSuccess(
                guardContext,
                body.ScanId,
                estimatedCost,
                inputTokens ?? 0,
                outputTokens ?? 0,
                modelLabel: "quick-scan",
                duration);

            await RecordUsageAsync(
                guardContext,
                context,
                status: "success",
                reservationId: globalBudgetReservationId,
                reservedUsd: reservedCostUsd > 0m ? reservedCostUsd : null,
                actualCostUsd: estimatedCost,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                modelLabel: "quick-scan",
                rejectionReason: null,
                duration: duration,
                cancellationToken).ConfigureAwait(false);

            await DurableAuditLogRetry.TryLogAsync(
                ct => auditService.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.ArchitectureQuickScanExecuted,
                        ActorUserId = context.AuditActor,
                        ActorUserName = context.AuditActor,
                        TenantId = context.TenantId,
                        WorkspaceId = context.WorkspaceId,
                        ProjectId = context.ProjectId,
                        CorrelationId = context.TraceIdentifier,
                        DataJson = JsonSerializer.Serialize(
                            new
                            {
                                validated!.SystemName,
                                validated.PrimaryEnvironment,
                                descriptionLength = validated.Description.Length,
                                concernCount = validated.ArchitectureConcerns.Count,
                                scan.ScanId,
                                findingCount = scan.Findings.Count,
                                summaryLength = scan.Summary.Length
                            },
                            AuditJsonSerializationOptions.Instance)
                    },
                    ct),
                logger,
                $"ArchitectureQuickScanExecuted:{context.TraceIdentifier}",
                cancellationToken).ConfigureAwait(false);

            return QuickScanExecutionResult.Success(body);
        }
        catch (Exception)
        {
            TimeSpan duration = timeProvider.GetUtcNow() - started;

            if (globalBudgetReservationId.HasValue)
            {
                await quickScanGlobalBudgetReservationService
                    .ReleaseAsync(globalBudgetReservationId.Value, cancellationToken)
                    .ConfigureAwait(false);
            }

            quickScanTelemetry.RecordFailure(guardContext, "execution_failed", duration);
            quickScanGuard.RecordScanCompleted(guardContext, succeeded: false, 0m, 0, 0, duration);
            await RecordUsageAsync(
                guardContext,
                context,
                status: "failure",
                reservationId: globalBudgetReservationId,
                reservedUsd: reservedCostUsd > 0m ? reservedCostUsd : null,
                actualCostUsd: null,
                inputTokens: null,
                outputTokens: null,
                modelLabel: null,
                rejectionReason: "execution_failed",
                duration: duration,
                cancellationToken).ConfigureAwait(false);

            return QuickScanExecutionResult.ExecutionFailed();
        }
    }
}
