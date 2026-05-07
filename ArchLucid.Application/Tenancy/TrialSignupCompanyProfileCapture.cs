namespace ArchLucid.Application.Tenancy;
/// <summary>Optional company profile at self-service trial signup (persisted on <c>dbo.Tenants</c> with the trial row).</summary>
public sealed record TrialSignupCompanyProfileCapture(string? CompanySize, int? ArchitectureTeamSize, string? IndustryVertical, string? IndustryVerticalOther)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(CompanySize, IndustryVertical, IndustryVerticalOther);
    private static byte __ValidatePrimaryConstructorArguments(System.String? companySize, System.String? industryVertical, System.String? industryVerticalOther)
    {
        return (byte)0;
    }
}