namespace ArchLucid.Core.Identity;

public sealed class DuplicateEmailOtpChallengeException : Exception
{
    public DuplicateEmailOtpChallengeException(Guid challengeId)
        : base($"Email OTP challenge '{challengeId:D}' already exists.")
    {
        ChallengeId = challengeId;
    }

    public Guid ChallengeId
    {
        get;
    }
}
