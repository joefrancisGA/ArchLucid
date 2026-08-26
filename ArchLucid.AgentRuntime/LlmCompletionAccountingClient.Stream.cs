using System.Runtime.CompilerServices;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime;

public sealed partial class LlmCompletionAccountingClient
{
    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string providerKind = _inner.Descriptor.ProviderKind;

        long? dailyReserved = null;
        decimal? monthlyReserved = null;
        bool overageActive = false;

        try
        {
            if (_dailyTenantBudgetOptions.CurrentValue.Enabled)
                dailyReserved = await _dailyTenantBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_monthlyDollarBudgetOptions.CurrentValue.Enabled)
                (monthlyReserved, overageActive) = await _monthlyDollarBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_quotaOptions.CurrentValue.Enabled)
                _quotaTracker.EnsureWithinQuotaBeforeCall(scope.TenantId);
        }
        catch (LlmTokenQuotaExceededException)
        {
            ArchLucidInstrumentation.LlmQuotaExceededTotal.Add(1);
            throw;
        }

        LlmPromptRedactionOptions redactionOpts = _redactionOptions.CurrentValue;
        string outboundSystem = systemPrompt;
        string outboundUser = userPrompt;

        if (!redactionOpts.Enabled)
        {
            ArchLucidInstrumentation.RecordLlmPromptRedactionSkipped();
        }
        else
        {
            PromptRedactionOutcome systemOutcome = _promptRedactor.Redact(systemPrompt);
            PromptRedactionOutcome userOutcome = _promptRedactor.Redact(userPrompt);

            foreach (KeyValuePair<string, int> kv in systemOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            foreach (KeyValuePair<string, int> kv in userOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            outboundSystem = systemOutcome.Text;
            outboundUser = userOutcome.Text;
        }

        // Non-streaming inners: call CompleteJsonAsync on this async method (not a nested
        // IAsyncEnumerable). AsyncLocal token seeds from the inner client are otherwise lost
        // across AgentCompletionStreamingBridge yields and never reach metering/quota settle.

        if (_inner is not IAgentStreamingCompletionClient)
        {
            string full;

            try
            {
                full = await _inner
                    .CompleteJsonAsync(outboundSystem, outboundUser, maxTokens, temperature, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch
            {
                await SettleStreamUsageAccountingAsync(
                        scope,
                        providerKind,
                        dailyReserved,
                        monthlyReserved,
                        overageActive)
                    .ConfigureAwait(false);

                throw;
            }

            await SettleStreamUsageAccountingAsync(
                    scope,
                    providerKind,
                    dailyReserved,
                    monthlyReserved,
                    overageActive)
                .ConfigureAwait(false);

            foreach (string chunk in AgentCompletionStreamingBridge.SimulateChunks(full))
            {
                yield return chunk;
            }

            yield break;
        }

        try
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               _inner,
                               outboundSystem,
                               outboundUser,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                yield return chunk;
            }
        }
        finally
        {
            await SettleStreamUsageAccountingAsync(
                    scope,
                    providerKind,
                    dailyReserved,
                    monthlyReserved,
                    overageActive)
                .ConfigureAwait(false);
        }
    }

    private async Task SettleStreamUsageAccountingAsync(
        ScopeContext scope,
        string providerKind,
        long? dailyReserved,
        decimal? monthlyReserved,
        bool overageActive)
    {
        // Peek (do not consume): schema remediation trace recording and CostGuardrailInterceptor
        // read the same ambient usage after this decorator returns.
        bool usageAvailable = AzureOpenAiCompletionClient.TryPeekLastCompletionTokenUsage(
            out int promptTok,
            out int completionTok,
            out int reasoningTok,
            out int cachedPromptTok);

        if (!usageAvailable)
        {
            await _dailyTenantBudgetTracker
                .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                .ConfigureAwait(false);

            await _monthlyDollarBudgetTracker
                .ReleasePendingReservationIfAnyAsync(
                    scope.TenantId,
                    providerKind,
                    monthlyReserved,
                    overageActive,
                    CancellationToken.None)
                .ConfigureAwait(false);

            return;
        }

        _ = reasoningTok;

        _quotaTracker.RecordUsage(scope.TenantId, promptTok, completionTok);

        await _dailyTenantBudgetTracker
            .RecordUsageAndMaybeWarnAsync(
                scope.TenantId,
                providerKind,
                _scopeProvider,
                _auditService,
                promptTok,
                completionTok,
                dailyReserved,
                CancellationToken.None)
            .ConfigureAwait(false);

        await _monthlyDollarBudgetTracker
            .RecordUsageAndMaybeWarnAsync(
                scope.TenantId,
                providerKind,
                _scopeProvider,
                _auditService,
                promptTok,
                completionTok,
                monthlyReserved,
                overageActive,
                CancellationToken.None)
            .ConfigureAwait(false);

        await _telemetry
            .RecordTokenUsageAsync(scope, promptTok, completionTok, cachedPromptTok, CancellationToken.None)
            .ConfigureAwait(false);
    }
}
