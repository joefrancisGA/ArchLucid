using System.Text.Json;

namespace ArchLucid.Core.Integration;

/// <summary>Wave-22 suggestion 219: integration outbox publish fail-closed when run-scoped payload omits manifestHash.</summary>
public static class IntegrationEventOutboxManifestHashGuard
{
    private static readonly HashSet<string> RunScopedArchitectureEventTypes = new(StringComparer.Ordinal)
    {
        IntegrationEventTypes.ManifestFinalizedV1,
        IntegrationEventTypes.AuthorityRunCompletedV1,
        IntegrationEventTypes.AdvisoryScanCompletedV1,
    };

    public static void EnsureRunScopedPayloadIncludesManifestHashOrThrow(string eventType, ReadOnlyMemory<byte> payloadUtf8)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);

        if (!RunScopedArchitectureEventTypes.Contains(eventType))
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

            if (string.Equals(eventType, IntegrationEventTypes.AdvisoryScanCompletedV1, StringComparison.Ordinal)
                && !TryReadRunId(root, out Guid runId))
            {
                return;
            }

            if (!TryReadManifestHash(root, out string? manifestHash)
                || string.IsNullOrWhiteSpace(manifestHash))
            {
                throw new InvalidOperationException(
                    $"Integration outbox publish blocked for '{eventType}': manifestHash is required on run-scoped architecture payloads.");
            }
        }
    }

    private static bool TryReadRunId(JsonElement root, out Guid runId)
    {
        runId = Guid.Empty;

        if (root.TryGetProperty("runId", out JsonElement runElement)
            && runElement.ValueKind == JsonValueKind.String
            && Guid.TryParse(runElement.GetString(), out Guid parsed))
        {
            runId = parsed;
            return runId != Guid.Empty;
        }

        return false;
    }

    private static bool TryReadManifestHash(JsonElement root, out string? manifestHash)
    {
        manifestHash = null;

        if (root.TryGetProperty("manifestHash", out JsonElement hashElement)
            && hashElement.ValueKind == JsonValueKind.String)
        {
            manifestHash = hashElement.GetString();
            return true;
        }

        if (root.TryGetProperty("manifestHashSha256", out JsonElement shaElement)
            && shaElement.ValueKind == JsonValueKind.String)
        {
            manifestHash = shaElement.GetString();
            return true;
        }

        return false;
    }
}
