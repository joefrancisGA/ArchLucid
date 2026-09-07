namespace ArchLucid.Core.Billing;

/// <summary>Included seat and workspace caps from PRICING_PHILOSOPHY §3 packaging table.</summary>
public static class CommercialPackagingLimits
{
    /// <summary>Free and active-trial packaging: one workspace per organization.</summary>
    public const int FreeOrTrialWorkspacesIncluded = 1;

    public const int TeamSeatsIncluded = 5;

    /// <summary>Team hard cap (included + add-on). An 11th seat requires Professional.</summary>
    public const int TeamSeatsMax = 10;

    public const int TeamWorkspacesIncluded = 1;

    public const int ProfessionalSeatsIncluded = 10;

    /// <summary>Professional hard cap (included + add-on). Beyond this requires Enterprise.</summary>
    public const int ProfessionalSeatsMax = 20;

    public const int ProfessionalWorkspacesIncluded = 1;

    public const int ProfessionalWorkspacesMax = 5;
}
