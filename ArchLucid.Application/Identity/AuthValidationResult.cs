using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public readonly record struct AuthValidationResult
{
    public bool IsValid
    {
        get;
        init;
    }

    public string? CustomerMessage
    {
        get;
        init;
    }

    public string? ReasonCode
    {
        get;
        init;
    }

    public static AuthValidationResult Valid => new() { IsValid = true };

    public static AuthValidationResult Invalid(string customerMessage, string? reasonCode = null) =>
        new()
        {
            IsValid = false,
            CustomerMessage = customerMessage,
            ReasonCode = reasonCode
        };
}

public static class AuthValidationResultMapper
{
    public static PostAuthCreateWorkspaceResult ToPostAuthCreateWorkspaceDeny(AuthValidationResult result) =>
        new()
        {
            Succeeded = false,
            CustomerMessage = result.CustomerMessage ?? string.Empty
        };

    public static EmailOtpVerifyResult ToEmailOtpVerifyFailure(
        AuthValidationResult result,
        string defaultMessage = "Invalid or expired sign-in code.") =>
        new()
        {
            Succeeded = false,
            FailureMessage = result.CustomerMessage ?? defaultMessage
        };

    public static EmailOtpVerifyResult ToEmailOtpVerifyFailure() =>
        ToEmailOtpVerifyFailure(AuthValidationResult.Invalid(string.Empty));

    public static string MapEmailOtpCompletionFailureReason(EmailOtpChallengeCompletionResult result) =>
        result switch
        {
            EmailOtpChallengeCompletionResult.Expired => "expired",
            EmailOtpChallengeCompletionResult.TooManyAttempts => "too_many_attempts",
            EmailOtpChallengeCompletionResult.AlreadyCompleted => "reused",
            EmailOtpChallengeCompletionResult.InvalidCode => "invalid_code",
            _ => "invalid"
        };

    public static string MapEmailOtpVerifyMetricResult(string reason) =>
        reason switch
        {
            "expired" => "expired",
            "too_many_attempts" => "rate_limited",
            "sso_required" => "sso_required",
            _ => "invalid"
        };
}
