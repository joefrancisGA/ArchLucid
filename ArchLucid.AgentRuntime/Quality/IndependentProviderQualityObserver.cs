using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime.Quality;

/// <summary>Aggregates SecureNow's independent inventory claim outcomes using live hosted transport attribution.</summary>
public sealed class IndependentProviderQualityObserver(IProviderQualityMonitor monitor, IAuditService auditService)
    : IIndependentProviderQualityObserver
{
    private static readonly AsyncLocal<Capture?> ActiveCapture = new();

    public async Task<(string Response, IIndependentProviderQualitySample? Sample)> ObserveAsync(
        Func<CancellationToken, Task<string>> complete, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(complete);
        Capture? previous = ActiveCapture.Value;
        Capture capture = new();
        ActiveCapture.Value = capture;
        try
        {
            string response = await complete(cancellationToken).ConfigureAwait(false);
            Attribution? attribution = Volatile.Read(ref capture.AttributedResponse);
            if (attribution is null || !ReferenceEquals(response, attribution.Response))
                return (response, null);

            string sampleId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
                "securenow:inventory-public-network-access:v1\n" + response)));
            return (response, new Sample(monitor, auditService, attribution.Key, sampleId));
        }
        finally
        {
            ActiveCapture.Value = previous;
        }
    }

    // Only the live hosted non-streaming transport may stamp a response, not a cache or simulator.
    internal static void ConfirmHostedTransport(string deployment, string? modelVersion, string response)
    {
        if (ActiveCapture.Value is not { } capture || string.IsNullOrWhiteSpace(modelVersion))
            return;
        ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", deployment, modelVersion);
        if (key.ModelId != "unknown" && key.ModelVersion != "unknown")
            Volatile.Write(ref capture.AttributedResponse, new Attribution(key, response));
    }

    private sealed class Capture
    {
        public Attribution? AttributedResponse;
    }

    private sealed record Attribution(ProviderQualityKey Key, string Response);

    private sealed class Sample(
        IProviderQualityMonitor monitor, IAuditService auditService, ProviderQualityKey key, string sampleId)
        : IIndependentProviderQualitySample
    {
        private int _recorded;

        public async Task RecordAsync(
            ScopeContext scope, IndependentProviderClaimOutcome outcome, bool material, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(scope);
            cancellationToken.ThrowIfCancellationRequested();
            if (Interlocked.Exchange(ref _recorded, 1) != 0)
                return;

            ProviderQualityLabel label = outcome switch
            {
                IndependentProviderClaimOutcome.Supported => ProviderQualityLabel.Supported,
                IndependentProviderClaimOutcome.Contradicted => ProviderQualityLabel.Contradicted,
                _ => ProviderQualityLabel.Unknown,
            };
            const string method = "securenow_scoped_inventory_public_network_access_v1";
            ProviderQualityRecordResult result = await monitor.RecordAsync(
                new ProviderQualityAdjudication(
                    sampleId, key, label, material ? 4 : 1, label != ProviderQualityLabel.Unknown,
                    method, TimeProvider.System.GetUtcNow()),
                cancellationToken).ConfigureAwait(false);

            if (!result.StateChanged)
                return;
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = "AiProviderQualityQuarantined",
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        key.ProviderId,
                        key.ModelId,
                        key.ModelVersion,
                        result.Transition,
                        result.Snapshot.KnownSampleCount,
                        result.Snapshot.UnknownSampleCount,
                        result.Snapshot.BadSampleCount,
                        adjudicatorKind = method,
                    }),
                }, cancellationToken).ConfigureAwait(false);
        }
    }
}
