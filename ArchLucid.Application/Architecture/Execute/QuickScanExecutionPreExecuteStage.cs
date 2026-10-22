using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture.Execute;

/// <inheritdoc cref="IQuickScanExecutionPreExecuteStage" />
public sealed class QuickScanExecutionPreExecuteStage(
    IQuickScanSafetyOperationalStateProvider quickScanSafetyOperationalStateProvider,
    IOptionsMonitor<QuickScanOptions> quickScanOptions,
    IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IQuickScanIdentityAbuseService quickScanIdentityAbuseService,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IQuickScanUsageRecorder quickScanUsageRecorder,
    TimeProvider timeProvider,
    ILogger<QuickScanExecutionPreExecuteStage> logger) : IQuickScanExecutionPreExecuteStage
{
    private readonly IQuickScanSafetyOperationalStateProvider _quickScanSafetyOperationalStateProvider =
        quickScanSafetyOperationalStateProvider
        ?? throw new ArgumentNullException(nameof(quickScanSafetyOperationalStateProvider));

    private readonly IOptionsMonitor<QuickScanOptions> _quickScanOptions =
        quickScanOptions ?? throw new ArgumentNullException(nameof(quickScanOptions));

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _quickScanSafetyOptions =
        quickScanSafetyOptions ?? throw new ArgumentNullException(nameof(quickScanSafetyOptions));

    private readonly IQuickScanIdentityAbuseService _quickScanIdentityAbuseService =
        quickScanIdentityAbuseService ?? throw new ArgumentNullException(nameof(quickScanIdentityAbuseService));

    private readonly IQuickScanGuard _quickScanGuard =
        quickScanGuard ?? throw new ArgumentNullException(nameof(quickScanGuard));

    private readonly IQuickScanTelemetry _quickScanTelemetry =
        quickScanTelemetry ?? throw new ArgumentNullException(nameof(quickScanTelemetry));

    private readonly IQuickScanUsageRecorder _quickScanUsageRecorder =
        quickScanUsageRecorder ?? throw new ArgumentNullException(nameof(quickScanUsageRecorder));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<QuickScanExecutionPreExecuteStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(state);

        QuickScanExecutionRequestContext context = state.Context;

        if (context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanSafetyOperationalSnapshot operational =
                await _quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

            if (!operational.AnonymousExecutionAllowed)
            {
                state.TerminalResult = QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(operational.PublicMessage)
                        ? "Quick Scan is temporarily unavailable."
                        : operational.PublicMessage);

                return;
            }
        }

        QuickScanSafetyOptions safetyOptions = _quickScanSafetyOptions.CurrentValue;
        QuickScanOptions baseOptions = _quickScanOptions.CurrentValue;
        QuickScanOptions options = QuickScanEffectiveLimits.Merge(baseOptions, safetyOptions);
        state.SafetyOptions = safetyOptions;
        state.Options = options;

        if (!QuickScanRequestValidator.TryValidate(
                state.Request,
                options,
                out QuickScanRequestValidator.ValidatedQuickScanRequest? validated,
                out string? validationError))
        {
            state.TerminalResult = QuickScanExecutionResult.ValidationFailed(validationError ?? "Validation failed.");

            return;
        }

        state.Validated = validated;

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            Dictionary<string, string> previewFiles = QuickScanMinimalContextBuilder.BuildFiles(validated!);
            string userPayload = JsonSerializer.Serialize(previewFiles);
            int estimatedInputTokens = QuickScanInputTokenEstimator.EstimateTokens(
                QuickScanLlmSystemPrompt.Text,
                userPayload);

            if (estimatedInputTokens > safetyOptions.PerRequest.MaxInputTokens)
            {
                state.TerminalResult = QuickScanExecutionResult.ValidationFailed(
                    $"description exceeds the maximum input size for Quick Scan ({safetyOptions.PerRequest.MaxInputTokens} tokens).");

                return;
            }
        }

        bool useDistributedIdentityAbuse =
            safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency;
        state.UseDistributedIdentityAbuse = useDistributedIdentityAbuse;

        if (useDistributedIdentityAbuse)
        {
            QuickScanIdentityAbuseDecision abuseDecision = await _quickScanIdentityAbuseService.TryAdmitAsync(
                new QuickScanIdentityAbuseAdmitContext
                {
                    ClientIp = context.ClientIp,
                    SessionId = context.SessionId,
                    BrowserId = string.IsNullOrWhiteSpace(context.BrowserId)
                        ? context.SessionId
                        : context.BrowserId,
                    Description = validated!.Description,
                    BotChallengeToken = context.BotChallengeToken ?? state.Request?.BotChallengeToken,
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
                _quickScanTelemetry.RecordAttempt(rejectedContext);
                _quickScanTelemetry.RecordRejection(rejectedContext, abuseDecision.RejectionReason!.Value);
                _quickScanGuard.RecordRejection(rejectedContext, abuseDecision.RejectionReason.Value);
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

                state.TerminalResult = QuickScanExecutionResult.GuardRejected(abuseDecision.RejectionReason.Value);

                return;
            }
        }

        QuickScanGuardContext guardContext = QuickScanGuardContextFactory.Create(
            context.ClientIp,
            context.SessionId,
            validated!.Description,
            useDistributedConcurrencyLimit: context.RequiresAnonymousDistributedConcurrency,
            useDistributedIdentityAbuseLimit: useDistributedIdentityAbuse);
        state.GuardContext = guardContext;
        _quickScanTelemetry.RecordAttempt(guardContext);

        QuickScanGuardDecision decision = _quickScanGuard.TryBeginScan(guardContext);

        if (!decision.Allowed)
        {
            _quickScanTelemetry.RecordRejection(guardContext, decision.RejectionReason!.Value);
            _quickScanGuard.RecordRejection(guardContext, decision.RejectionReason.Value);
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

            state.TerminalResult = QuickScanExecutionResult.GuardRejected(decision.RejectionReason.Value);
        }
    }

    private async Task RecordUsageAsync(
        QuickScanGuardContext guardContext,
        QuickScanExecutionRequestContext requestContext,
        string status,
        Guid? reservationId,
        decimal? reservedUsd,
        decimal? actualCostUsd,
        int? inputTokens,
        int? outputTokens,
        string? modelLabel,
        string? rejectionReason,
        TimeSpan duration,
        CancellationToken cancellationToken)
    {
        try
        {
            QuickScanUsageRecord record = QuickScanUsageRecordFactory.Create(
                guardContext,
                requestContext,
                status,
                reservationId,
                reservedUsd,
                actualCostUsd,
                inputTokens,
                outputTokens,
                modelLabel,
                rejectionReason,
                duration,
                _timeProvider.GetUtcNow());

            await _quickScanUsageRecorder.RecordAsync(record, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Quick Scan usage record persistence failed for status {Status}.", status);
        }
    }
}
