
namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class ContextIngestionRules
{
    public static void Collect(IConfiguration configuration, List<string> errors)
    {
        const string key = "ArchLucid:ContextIngestion:MaxPayloadBytes";
        string? raw = configuration[key]?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
            return;


        if (!long.TryParse(raw, out long parsed) || parsed <= 0)
            errors.Add($"{key} must be a positive integer (bytes) when set.");
    }
}
