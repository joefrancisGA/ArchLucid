namespace ArchLucid.Contracts.Exports;

/// <summary>
///     Validates <see cref="WhitelabelConfiguration" /> when callers opt into branding (non-null configuration instance).
/// </summary>
public static class WhitelabelConfigurationValidator
{
    /// <summary>
    ///     Ensures required strings are populated when <paramref name="configuration" /> is not null.
    /// </summary>
    /// <exception cref="ArgumentException">When required branding fields are empty.</exception>
    public static void ValidateIfProvided(WhitelabelConfiguration? configuration)
    {
        if (configuration is null)
            return;

        if (string.IsNullOrWhiteSpace(configuration.FirmDisplayName))
            throw new ArgumentException("FirmDisplayName is required when whitelabel configuration is supplied.", nameof(configuration));

        if (string.IsNullOrWhiteSpace(configuration.ClientEngagementTitle))
            throw new ArgumentException("ClientEngagementTitle is required when whitelabel configuration is supplied.",
                nameof(configuration));
    }
}
