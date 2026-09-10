using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Shared production-like host classification for Quick Scan safety guardrails and fail-closed runtime behavior.
/// </summary>
public static class QuickScanSafetyProductionLikeHostClassification
{
    /// <summary>
    ///     True when anonymous Quick Scan guardrails and fail-closed override behavior must apply.
    /// </summary>
    public static bool RequiresProductionLikeAnonymousGuardrails(
        IHostEnvironment hostEnvironment,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(hostEnvironment);
        ArgumentNullException.ThrowIfNull(configuration);

        if (hostEnvironment.IsProduction() || hostEnvironment.IsStaging())
            return true;

        if (string.Equals(hostEnvironment.EnvironmentName, "SaaS", StringComparison.OrdinalIgnoreCase))
            return true;

        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            return false;

        string trimmed = archLucidEnv.Trim();

        return string.Equals(trimmed, "Production", StringComparison.OrdinalIgnoreCase)
               || string.Equals(trimmed, "Staging", StringComparison.OrdinalIgnoreCase);
    }
}
