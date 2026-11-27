using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.Quality;

/// <summary>A self-contained synthetic check of the entire response, with no tenant or provider evidence reads.</summary>
internal sealed class SecureNowRecoveryChallenge
{
    internal const string Method = "securenow_synthetic_inventory_recovery_v1";
    internal const string SystemPrompt =
        "Classify every synthetic inventory row in order. Output only a JSON object with exactly two fields: "
        + "nonce (copy the provided nonce exactly) and results (an array of strings). "
        + "Use disabled for explicit Disabled, enabled for explicit Enabled, and unknown for any missing, "
        + "redacted or other value. Never add explanations, fields, or claims.";

    private static readonly (string? Value, bool Redacted, string Expected)[] Fixtures =
    [
        ("Disabled", false, "disabled"),
        ("Enabled", false, "enabled"),
        (null, false, "unknown"),
        ("Disabled", true, "unknown"),
        ("SecuredByPerimeter", false, "unknown"),
        ("Enabled", true, "unknown"),
    ];

    private readonly string _nonce = Guid.NewGuid().ToString("N");
    private readonly string[] _expected;

    internal SecureNowRecoveryChallenge()
    {
        var fixtures = Fixtures.ToArray();
        for (int i = fixtures.Length - 1; i > 0; i--)
        {
            int j = RandomNumberGenerator.GetInt32(i + 1);
            (fixtures[i], fixtures[j]) = (fixtures[j], fixtures[i]);
        }

        _expected = fixtures.Select(row => row.Expected).ToArray();
        UserPrompt = JsonSerializer.Serialize(new
        {
            nonce = _nonce,
            rows = fixtures.Select(row => new { publicNetworkAccess = row.Value, redacted = row.Redacted }),
        });
    }

    internal string UserPrompt { get; }

    internal ProviderQualityLabel Adjudicate(string response)
    {
        if (response.Length > 1024)
            return ProviderQualityLabel.Unknown;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(response, new JsonDocumentOptions { MaxDepth = 4 });
            JsonElement root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return ProviderQualityLabel.Unknown;

            JsonElement nonce = default, results = default;
            foreach (JsonProperty property in root.EnumerateObject())
            {
                if (property.NameEquals("nonce") && nonce.ValueKind == JsonValueKind.Undefined)
                    nonce = property.Value;
                else if (property.NameEquals("results") && results.ValueKind == JsonValueKind.Undefined)
                    results = property.Value;
                else
                    return ProviderQualityLabel.Unknown;
            }

            if (nonce.ValueKind != JsonValueKind.String || !nonce.ValueEquals(_nonce) ||
                results.ValueKind != JsonValueKind.Array || results.GetArrayLength() != _expected.Length)
                return ProviderQualityLabel.Unknown;

            bool match = true;
            int ordinal = 0;
            foreach (JsonElement item in results.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.String ||
                    !(item.ValueEquals("enabled") || item.ValueEquals("disabled") || item.ValueEquals("unknown")))
                    return ProviderQualityLabel.Unknown;

                match &= item.ValueEquals(_expected[ordinal++]);
            }

            return match ? ProviderQualityLabel.Supported : ProviderQualityLabel.Contradicted;
        }
        catch (JsonException)
        {
            return ProviderQualityLabel.Unknown;
        }
    }
}
