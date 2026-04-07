namespace ArchLucid.Host.Core.Configuration;

/// <summary>
/// Merges <c>ArchLucid*</c> configuration over legacy <c>ArchiForge*</c> keys during the product rename.
/// Sunset: remove fallbacks in Phase 7 per <c>docs/ARCHLUCID_RENAME_CHECKLIST.md</c>.
/// </summary>
public static class ArchLucidConfigurationBridge
{
    public const string ArchLucidSectionName = "ArchLucid";

    public const string ArchLucidAuthSectionName = "ArchLucidAuth";

    public const string LegacyAuthSectionName = "ArchiForgeAuth";

    public const string PrimarySqlConnectionName = "ArchLucid";

    public const string LegacySqlConnectionName = "ArchiForge";

    /// <summary>SQL connection string: <c>ConnectionStrings:ArchLucid</c> wins when set (legacy <c>ArchiForge</c> fallback).</summary>
    public static string? ResolveSqlConnectionString(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return configuration.GetConnectionString(PrimarySqlConnectionName)
               ?? configuration.GetConnectionString(LegacySqlConnectionName);
    }

    /// <summary>
    /// Effective product options: legacy <c>ArchiForge</c> section, then <c>ArchLucid</c> section (same shape),
    /// then flat <c>ArchLucid:StorageProvider</c> (highest precedence).
    /// </summary>
    public static ArchLucidOptions ResolveArchLucidOptions(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        ArchLucidOptions options =
            configuration.GetSection(ArchLucidOptions.SectionName).Get<ArchLucidOptions>() ?? new ArchLucidOptions();

        ArchLucidOptions? lucidSection = configuration.GetSection(ArchLucidSectionName).Get<ArchLucidOptions>();

        if (lucidSection is not null && !string.IsNullOrWhiteSpace(lucidSection.StorageProvider))
        {
            options.StorageProvider = lucidSection.StorageProvider;
        }

        string? lucidStorage = configuration[$"{ArchLucidSectionName}:StorageProvider"]?.Trim();

        if (!string.IsNullOrEmpty(lucidStorage))
        {
            options.StorageProvider = lucidStorage;
        }

        return options;
    }

    /// <summary>Auth setting with <c>ArchLucidAuth:*</c> overriding <c>ArchiForgeAuth:*</c>.</summary>
    public static string? ResolveAuthConfigurationValue(IConfiguration configuration, string relativeKey)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? lucid = configuration[$"{ArchLucidAuthSectionName}:{relativeKey}"]?.Trim();

        return !string.IsNullOrEmpty(lucid) ? lucid : configuration[$"{LegacyAuthSectionName}:{relativeKey}"]?.Trim();
    }
}
