namespace ArchLucid.Host.Core.Configuration;

/// <summary>
/// Shared classification for environments that should use production-style security defaults
/// (Content Safety, RLS break-glass alerts, etc.).
/// </summary>
public static class HostEnvironmentClassification
{
    /// <summary>
    /// True when <see cref="IHostEnvironment.IsProduction"/> or <see cref="IHostEnvironment.IsStaging"/>,
    /// or when <c>ARCHLUCID_ENVIRONMENT</c> (configuration then process environment) is <c>Production</c> or <c>Staging</c>.
    /// </summary>
    public static bool IsProductionOrStagingLike(IHostEnvironment hostEnvironment, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(hostEnvironment);
        ArgumentNullException.ThrowIfNull(configuration);

        if (hostEnvironment.IsProduction() || hostEnvironment.IsStaging())
            return true;

        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        if (string.IsNullOrWhiteSpace(archLucidEnv))
            return false;

        string trimmed = archLucidEnv.Trim();

        return string.Equals(trimmed, "Production", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(trimmed, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     True for ASP.NET Core Development hosts or hosts whose environment name is <c>Sandbox</c> (case-insensitive).
    /// </summary>
    public static bool IsDevelopmentOrSandbox(IHostEnvironment hostEnvironment)
    {
        ArgumentNullException.ThrowIfNull(hostEnvironment);

        if (hostEnvironment.IsDevelopment())
            return true;

        return string.Equals(hostEnvironment.EnvironmentName, "Sandbox", StringComparison.OrdinalIgnoreCase);
    }
}
