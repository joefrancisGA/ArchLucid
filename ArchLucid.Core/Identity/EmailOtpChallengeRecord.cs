namespace ArchLucid.Core.Identity;

public sealed class EmailOtpChallengeRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public string CodeHash
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }

    public int FailedAttemptCount
    {
        get;
        init;
    }

    public DateTimeOffset? CompletedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? InvalidatedUtc
    {
        get;
        init;
    }

    public string? ClientIpHash
    {
        get;
        init;
    }

    public string? UserAgentHash
    {
        get;
        init;
    }

    public Guid? InvitationId
    {
        get;
        init;
    }

    public byte[] RowVersion
    {
        get;
        init;
    } = [];
}

public sealed class EmailOtpChallengeInsert
{
    public Guid Id
    {
        get;
        init;
    }

    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public string CodeHash
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }

    public string? ClientIpHash
    {
        get;
        init;
    }

    public string? UserAgentHash
    {
        get;
        init;
    }

    public Guid? InvitationId
    {
        get;
        init;
    }
}

public enum EmailOtpChallengeCompletionResult
{
    Completed = 0,
    NotFound = 1,
    Expired = 2,
    InvalidCode = 3,
    AlreadyCompleted = 4,
    TooManyAttempts = 5,
    Invalidated = 6
}

public sealed class EmailOtpChallengeCompletionOutcome
{
    public EmailOtpChallengeCompletionResult Result
    {
        get;
        init;
    }

    public EmailOtpChallengeRecord? Challenge
    {
        get;
        init;
    }
}
