namespace ArchLucid.Core.Identity;

/// <summary>DNS ownership verification lifecycle for tenant sign-in email domains.</summary>
public enum AuthDomainVerificationStatus
{
    Unverified = 0,
    VerificationPending = 1,
    Verified = 2,
    VerificationFailed = 3,
    Removed = 4
}
