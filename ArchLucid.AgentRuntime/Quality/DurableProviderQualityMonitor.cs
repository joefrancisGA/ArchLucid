using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Resilience;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Quality;

/// <summary>Uses a shared control-plane transaction for observations and quarantine admission.</summary>
public sealed class DurableProviderQualityMonitor(
    IOptions<ProviderQualityOptions> options,
    IProviderQualityStateStore store,
    TimeProvider? clock = null) : IProviderQualityMonitor
{
    public Task<ProviderQualityAdmission> AdmitAsync(
        string? providerId, string? modelId, CancellationToken cancellationToken)
    {
        if (!options.Value.Enabled || !options.Value.EnforceQuarantine)
            return Task.FromResult(new ProviderQualityAdmission(true, false, null, null, null));

        return ExecuteAsync(ProviderQualityKey.Create(providerId, modelId, null),
            state => state.Admit(providerId, modelId), cancellationToken);
    }

    public Task<ProviderQualityRecordResult> RecordAsync(
        ProviderQualityAdjudication sample, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(sample);
        return ExecuteAsync(sample.Key, state => state.Record(sample), cancellationToken);
    }

    // Without an exact lease token the failure could belong to an expired lease. Let it expire instead.
    public Task RecordRecoveryProbeFailureAsync(ProviderQualityKey key, CancellationToken cancellationToken) =>
        Task.CompletedTask;

    private Task<TResult> ExecuteAsync<TResult>(
        ProviderQualityKey key, Func<ProviderQualityMonitor, TResult> action, CancellationToken cancellationToken)
    {
        string deploymentKey = Convert.ToHexString(SHA256.HashData(
            Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new[] { key.ProviderId, key.ModelId }))));
        return store.UpdateAsync(deploymentKey, payload =>
        {
            ProviderQualityMonitor state = new(options, clock) { AllowUncorrelatedRecovery = false };
            state.ImportState(payload);
            string before = state.ExportState();
            TResult result = action(state);
            string after = state.ExportState();
            return (string.Equals(after, before, StringComparison.Ordinal) ? null : after, result);
        }, cancellationToken);
    }
}
