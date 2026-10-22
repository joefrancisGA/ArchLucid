namespace ArchLucid.Contracts.Exports;

/// <summary>
///     Consultant-facing branding overlay for exports. When supplied to generators, firm and engagement titles are required;
///     callers should enforce via <see cref="WhitelabelConfigurationValidator.ValidateIfProvided" /> before rendering.
/// </summary>
/// <remarks>
///     <para><see cref="LogoBlobReference" /> must remain tenant-scoped in storage (container/path naming + access checks); this type carries only the opaque reference.</para>
/// </remarks>
public sealed record WhitelabelConfiguration
{
    /// <summary>Shown on cover and attribution blocks.</summary>
    public required string FirmDisplayName
    {
        get;
        init;
    }

    /// <summary>Primary engagement title for the deliverable (review board packet headline).</summary>
    public required string ClientEngagementTitle
    {
        get;
        init;
    }

    /// <summary>Optional tenant-scoped blob key/path for a logo asset.</summary>
    public string? LogoBlobReference
    {
        get;
        init;
    }

    /// <summary>
    ///     Footer copy template; when null or whitespace, <see cref="ResolveFooterAttribution" /> uses the ArchLucid default template.
    ///     May include <c>{FirmDisplayName}</c> placeholder substitution.
    /// </summary>
    public string? FooterAttribution
    {
        get;
        init;
    }

    /// <summary>Template applied when <see cref="FooterAttribution" /> is unset.</summary>
    public const string DefaultFooterAttributionTemplate = "Prepared by {FirmDisplayName} using ArchLucid";

    /// <summary>
    ///     Resolves footer text, substituting <c>{FirmDisplayName}</c> using <see cref="FirmDisplayName" />.
    /// </summary>
    public string ResolveFooterAttribution()
    {
        string template = string.IsNullOrWhiteSpace(FooterAttribution)
            ? DefaultFooterAttributionTemplate
            : FooterAttribution.Trim();

        return template.Replace("{FirmDisplayName}", FirmDisplayName, StringComparison.Ordinal);
    }
}
