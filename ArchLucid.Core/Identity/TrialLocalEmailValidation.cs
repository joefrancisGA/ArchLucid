namespace ArchLucid.Core.Identity;

/// <summary>Shared local-email length validation for trial identity link flows.</summary>
public static class TrialLocalEmailValidation
{
    public static bool TryValidateLength(string? localEmail, out string? errorMessage)
    {
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(localEmail))
            return true;

        if (localEmail.Trim().Length > TrialIdentityUserFieldLimits.NormalizedEmailMaxLength)
        {
            errorMessage =
                $"Local email must be at most {TrialIdentityUserFieldLimits.NormalizedEmailMaxLength} characters.";

            return false;
        }

        return true;
    }
}
