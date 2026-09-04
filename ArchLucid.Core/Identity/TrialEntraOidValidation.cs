namespace ArchLucid.Core.Identity;

/// <summary>Shared Entra OID length validation for trial identity link flows.</summary>
public static class TrialEntraOidValidation
{
    public static bool TryValidateLength(string? entraOid, out string? errorMessage)
    {
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(entraOid))
            return true;

        if (entraOid.Trim().Length > TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength)
        {
            errorMessage =
                $"Entra OID must be at most {TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength} characters.";

            return false;
        }

        return true;
    }
}
