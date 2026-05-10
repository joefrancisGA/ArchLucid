using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace ArchLucid.AgentRuntime.QuickScan;

/// <summary>Deterministic JSON completions for quick scan when LLMs are offline (simulator / fake client).</summary>
public static class FakeQuickScanCompletionJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    /// <summary>Builds a valid quick-scan response for <see cref="QuickScanService" /> parsing.</summary>
    public static string Build(string serializedFilesPayload)
    {
        if (serializedFilesPayload is null)
            return SerializePayload("No input payload.");

        try
        {
            using JsonDocument doc = JsonDocument.Parse(serializedFilesPayload);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return SerializePayload("Unstructured quick-scan input.");

            foreach (JsonProperty prop in doc.RootElement.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.String)
                {
                    string text = prop.Value.GetString() ?? string.Empty;

                    if (text.Length > 0)
                    {
                        string preview = text.Length > 280 ? text[..280] + "…" : text;

                        return SerializePayload(preview);
                    }
                }
            }
        }
        catch (JsonException)
        {
            // Ignore — fall back below.
        }

        return SerializePayload("Quick-scan input could not be summarized in simulator mode.");
    }

    private static string SerializePayload(string contextPreview)
    {
        string summary =
            "Simulator quick-scan for context: "
            + contextPreview
            + " (deterministic offline findings).";

        JsonArray findings = new(
            Finding(
                "Identity and access",
                "Verify workload identity, least-privilege RBAC, and token lifetimes for the described system.",
                "Critical",
                0.72,
                "Medium"),
            Finding(
                "Network exposure",
                "Confirm private endpoints and deny-by-default NSGs or equivalents for ingress paths implied by the description.",
                "Error",
                0.68,
                "Medium"),
            Finding(
                "Data protection",
                "Check encryption at rest and in transit for durable stores implied by the workload.",
                "Warning",
                0.81,
                "High"),
            Finding(
                "Observability",
                "Ensure centralized metrics, logs, and traces exist for critical paths; missing signals slow incident response.",
                "Warning",
                0.55,
                "Low"),
            Finding(
                "Operational resilience",
                "Review blast radius, backup/restore drills, and capacity buffers for the given cloud scope.",
                "Info",
                0.5,
                "Low"),
            Finding(
                "Cost governance",
                "Add budgets and alerting for the subscription or account footprint tied to this system.",
                "Info",
                0.45,
                "Low"));

        JsonObject root = new() { ["summary"] = summary, ["findings"] = findings };

        return root.ToJsonString(SerializerOptions);
    }

    private static JsonObject Finding(
        string category,
        string message,
        string severity,
        double confidenceScore,
        string confidenceLevel)
    {
        return new JsonObject
        {
            ["category"] = category,
            ["message"] = message,
            ["severity"] = severity,
            ["confidenceScore"] = confidenceScore,
            ["confidenceLevel"] = confidenceLevel
        };
    }
}
