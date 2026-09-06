using System.Text.Json;

using ArchLucid.Core.Explanation;

namespace ArchLucid.Core.Integration;

/// <summary>Wave-22 suggestion 219: integration outbox publish fail-closed when run-scoped payload omits manifestHash.</summary>
public static class IntegrationEventOutboxManifestHashGuard
{
    private static readonly HashSet<string> RunScopedArchitectureEventTypes = new(StringComparer.Ordinal)
    {
        IntegrationEventTypes.ManifestFinalizedV1,
        IntegrationEventTypes.AuthorityRunCompletedV1,
        IntegrationEventTypes.AdvisoryScanCompletedV1,
        IntegrationEventTypes.FindingsHighSeverityCapturedV1,
        IntegrationEventTypes.GovernanceApprovalSubmittedV1,
        IntegrationEventTypes.GovernanceApprovalApprovedV1,
        IntegrationEventTypes.GovernanceApprovalRejectedV1,
        IntegrationEventTypes.GovernancePromotionActivatedV1,
        IntegrationEventTypes.AlertFiredV1,
        IntegrationEventTypes.AlertAcknowledgedV1,
        IntegrationEventTypes.AlertResolvedV1,
        IntegrationEventTypes.AuthorityRunFailedV1,
        IntegrationEventTypes.AuthorityRunQualityGateRejectedV1,
        IntegrationEventTypes.ComplianceDriftEscalatedV1,
        IntegrationEventTypes.GovernancePolicyPackPublishedV1,
        IntegrationEventTypes.DataConsistencyCheckCompletedV1,
    };

    public static void EnsureRunScopedPayloadIncludesManifestHashOrThrow(string eventType, ReadOnlyMemory<byte> payloadUtf8)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);

        string canonicalEventType = IntegrationEventTypes.MapToCanonical(eventType);

        if (!RunScopedArchitectureEventTypes.Contains(canonicalEventType))
            return;

        if (payloadUtf8.IsEmpty)
        {
            throw new InvalidOperationException(
                $"Integration outbox publish blocked for '{eventType}': payload is empty.");
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(payloadUtf8);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Integration outbox publish blocked for '{eventType}': payload is not valid JSON.",
                ex);
        }

        using (document)
        {
            JsonElement root = document.RootElement;

            if (string.Equals(canonicalEventType, IntegrationEventTypes.AdvisoryScanCompletedV1, StringComparison.Ordinal)
                && !TryReadRunId(root, out Guid runId))
            {
                return;
            }

            if (string.Equals(canonicalEventType, IntegrationEventTypes.ComplianceDriftEscalatedV1, StringComparison.Ordinal)
                && !TryReadRunId(root, out Guid driftRunId))
            {
                return;
            }

            if (string.Equals(canonicalEventType, IntegrationEventTypes.GovernancePolicyPackPublishedV1, StringComparison.Ordinal)
                && !TryReadRunId(root, out Guid policyPackRunId))
            {
                return;
            }

            if (string.Equals(canonicalEventType, IntegrationEventTypes.DataConsistencyCheckCompletedV1, StringComparison.Ordinal)
                && !TryReadRunId(root, out Guid dataConsistencyRunId))
            {
                return;
            }

            if (AllowsOptionalManifestHashWhenAbsent(canonicalEventType)
                && (!TryReadManifestHash(root, out string? optionalHash)
                    || string.IsNullOrWhiteSpace(optionalHash)))
            {
                return;
            }

            if (!TryReadManifestHash(root, out string? manifestHash)
                || string.IsNullOrWhiteSpace(manifestHash))
            {
                throw new InvalidOperationException(
                    $"Integration outbox publish blocked for '{canonicalEventType}': manifestHash is required on run-scoped architecture payloads.");
            }
        }
    }

    private static bool TryReadRunId(JsonElement root, out Guid runId)
    {
        runId = Guid.Empty;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "runId", out JsonElement runElement)
            && runElement.ValueKind == JsonValueKind.String
            && Guid.TryParse(runElement.GetString(), out Guid parsed))
        {
            runId = parsed;
            return runId != Guid.Empty;
        }

        return false;
    }

    private static bool AllowsOptionalManifestHashWhenAbsent(string canonicalEventType) =>
        string.Equals(canonicalEventType, IntegrationEventTypes.AuthorityRunFailedV1, StringComparison.Ordinal)
        || string.Equals(canonicalEventType, IntegrationEventTypes.AuthorityRunQualityGateRejectedV1, StringComparison.Ordinal);

    private static bool TryReadManifestHash(JsonElement root, out string? manifestHash)
    {
        manifestHash = null;

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "manifestHash", out JsonElement hashElement)
            && hashElement.ValueKind == JsonValueKind.String)
        {
            manifestHash = hashElement.GetString();
            return true;
        }

        if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "manifestHashSha256", out JsonElement shaElement)
            && shaElement.ValueKind == JsonValueKind.String)
        {
            manifestHash = shaElement.GetString();
            return true;
        }

        return false;
    }
}
