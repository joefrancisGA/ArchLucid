using ArchLucid.Application.Identity;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Allowed values for self-service registration (server-side validation).</summary>
public static class StructuredBaselineConstants
{
    public static readonly string[] AllowedCompanySizes = RegistrationRequestBaselineValidator.AllowedCompanySizes;

    public static readonly string[] IndustryVerticals = RegistrationRequestBaselineValidator.IndustryVerticals;
}
