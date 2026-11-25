using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
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
            ProviderQualityRecoveryResponse.Lease? lease = null;
            if (attribution is null)
                return (response, null);

            // The recovery decorator returns its own stamped copy of the exact live transport response.
            if (!ReferenceEquals(response, attribution.Response)
                && (!ProviderQualityRecoveryResponse.TryTake(response, out lease) || lease?.Key != attribution.Key))
                return (response, null);

            string sampleId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
                "securenow:inventory-public-network-access:v1\n" + response)));
            return (response, new Sample(monitor, auditService, attribution.Key, sampleId, lease));
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
        IProviderQualityMonitor monitor, IAuditService auditService, ProviderQualityKey key, string sampleId,
        ProviderQualityRecoveryResponse.Lease? lease)
        : IIndependentProviderQualitySample
    {
        private int _recorded;

        public async Task RecordAsync(
            ScopeContext scope, Guid storedExplanationId, IndependentProviderClaimOutcome outcome, bool material,
            InventoryFalsificationProbe? inventoryFalsification, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(scope);
            cancellationToken.ThrowIfCancellationRequested();
            if (storedExplanationId == Guid.Empty || Interlocked.Exchange(ref _recorded, 1) != 0)
                return;

            ProviderQualityLabel label = outcome switch
            {
                IndependentProviderClaimOutcome.Supported => ProviderQualityLabel.Supported,
                IndependentProviderClaimOutcome.Contradicted => ProviderQualityLabel.Contradicted,
                _ => ProviderQualityLabel.Unknown,
            };
            string? traceId = null;
            if (lease is not null)
            {
                traceId = $"securenow:{storedExplanationId:N}";
                await monitor.BindRecoveryTraceAsync(key, lease.Id, traceId, cancellationToken).ConfigureAwait(false);

                // A scoped contradiction can reject a probe, but supporting one property does not verify the full response.
                if (label == ProviderQualityLabel.Supported)
                    label = ProviderQualityLabel.Unknown;
            }

            const string method = "securenow_scoped_inventory_public_network_access_v1";
            ProviderQualityRecordResult result = await monitor.RecordAsync(
                new ProviderQualityAdjudication(
                    sampleId, key, label, material ? 4 : 1, label != ProviderQualityLabel.Unknown,
                    method, TimeProvider.System.GetUtcNow(), traceId),
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
                        explanationId = storedExplanationId,
                        claimOutcome = outcome.ToString(),
                        recoveryAttempt = lease is not null,
                        result.Snapshot.KnownSampleCount,
                        result.Snapshot.UnknownSampleCount,
                        result.Snapshot.BadSampleCount,
                        result.Snapshot.DecisionWindowKnownSamples,
                        result.Snapshot.DecisionWindowWeightedBadRate,
                        result.Snapshot.DecisionWindowWilsonLowerBound,
                        adjudicatorKind = method,
                        inventoryFalsification = MatchAuditProvenance(scope, outcome, inventoryFalsification),
                    }),
                }, cancellationToken).ConfigureAwait(false);
        }
    }

    private static InventoryFalsificationProbe? MatchAuditProvenance(
        ScopeContext scope, IndependentProviderClaimOutcome outcome, InventoryFalsificationProbe? probe)
    {
        if (probe is null || string.IsNullOrWhiteSpace(probe.Coverage))
            return null;

        if (probe.Verification is not { } verification)
            return outcome == IndependentProviderClaimOutcome.Unknown &&
                probe.Outcome is InventoryFalsificationOutcome.Untestable or InventoryFalsificationOutcome.HumanReviewRequired
                ? probe : null;

        if (verification is not { Evidence: { } evidence, SnapshotId: Guid snapshotId, CapturedUtc: DateTime captured } ||
            verification.CloudResourceId == Guid.Empty || snapshotId == Guid.Empty || captured == default ||
            evidence.TenantId != scope.TenantId || evidence.WorkspaceId != scope.WorkspaceId ||
            evidence.ProjectId != scope.ProjectId || evidence.ResourceRowId == Guid.Empty ||
            string.IsNullOrWhiteSpace(evidence.VerifierVersion) || string.IsNullOrWhiteSpace(evidence.PropertyKey) ||
            evidence.MaximumCaptureAgeHours <= 0)
            return null;

        // Never attach a record that tells a different story from the adjudication.
        return (outcome, probe.Outcome, verification.Outcome) switch
        {
            (IndependentProviderClaimOutcome.Supported, InventoryFalsificationOutcome.SurvivedWithinTestedScope,
                PublicNetworkAccessVerificationOutcome.Verified) => probe,
            (IndependentProviderClaimOutcome.Contradicted, InventoryFalsificationOutcome.Refuted,
                PublicNetworkAccessVerificationOutcome.Contradicted) => probe,
            (IndependentProviderClaimOutcome.Unknown, InventoryFalsificationOutcome.Untestable,
                PublicNetworkAccessVerificationOutcome.Unverified) => probe,
            _ => null,
        };
    }
}
