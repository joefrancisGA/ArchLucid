using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Builds the POST /v1/architecture/request body (wizard-shaped or from file).</summary>
public static class ArchitectureRequestPayloadFactory
{
    public static async Task<JsonObject> CreateAsync(JourneyOptions options, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!string.IsNullOrWhiteSpace(options.ArchitectureRequestJsonPath))
        {
            string path = options.ArchitectureRequestJsonPath!;

            if (!File.Exists(path))
                throw new FileNotFoundException($"Architecture request file not found: {path}", path);

            string raw = await File.ReadAllTextAsync(path, cancellationToken);
            JsonNode? node = JsonNode.Parse(raw);

            if (node is not JsonObject obj)
                throw new InvalidOperationException("Architecture request file must contain a JSON object.");

            return obj;
        }

        string requestId = "harness-" + Guid.NewGuid().ToString("N");

        return new JsonObject
        {
            ["requestId"] = requestId,
            ["systemName"] = "ReviewApiHarness Operator Journey",
            ["description"] =
                "Automated full-operator review API harness — Azure web tier with API, SQL, private endpoints, " +
                "and Entra ID. Used to validate create → execute → finalize → export → governance → audit " +
                "with real AI and strict OpenAPI/DTO response validation.",
            ["environment"] = "dev",
            ["cloudProvider"] = "Azure",
            ["constraints"] = new JsonArray("review-api-harness", "real-ai-only"),
            ["requiredCapabilities"] = new JsonArray("api", "sql", "private-endpoints", "entra-id"),
            ["assumptions"] = new JsonArray("ArchLucid.ReviewApiHarness default payload")
        };
    }
}
