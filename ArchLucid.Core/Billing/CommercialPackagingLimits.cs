namespace ArchLucid.Core.Billing;

/// <summary>Included seat and workspace caps from PRICING_PHILOSOPHY §3 packaging table.</summary>
public static class CommercialPackagingLimits
{
    /// <summary>Free and active-trial packaging: one workspace per organization.</summary>
    public const int FreeOrTrialWorkspacesIncluded = 1;

    public const int TeamSeatsIncluded = 5;

    public const int TeamWorkspacesIncluded = 1;

    public const int ProfessionalSeatsIncluded = 20;

    public const int ProfessionalWorkspacesIncluded = 5;
}
