using ArchLucid.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class ContextIngestionRules
{
    /// <summary>
    ///     Legacy flat key superseded by <see cref="ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey" />;
    ///     still validated when present so mis-typed overrides surface.
    /// </summary>
    private const string LegacyMaxPayloadBytesKey = "ArchLucid:ContextIngestion:MaxPayloadBytes";

    public static void Collect(IConfiguration configuration, List<string> errors)
    {
        string diagnosticKey = ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey;
        string? raw = configuration[diagnosticKey]?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
        {
            raw = configuration[LegacyMaxPayloadBytesKey]?.Trim();

            if (string.IsNullOrWhiteSpace(raw))
                return;

            diagnosticKey = LegacyMaxPayloadBytesKey;
        }

        if (!long.TryParse(raw, out long parsed) || parsed <= 0)
            errors.Add($"{diagnosticKey} must be a positive integer (bytes) when set.");
    }
}
