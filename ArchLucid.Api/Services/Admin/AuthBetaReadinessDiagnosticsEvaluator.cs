using ArchLucid.Core.Configuration;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Evaluates private-beta invite-path configuration (operator links + local session JWT signing).</summary>
public static class AuthBetaReadinessDiagnosticsEvaluator
{
    public const string SessionMintMisconfigurationDetail =
        "Invite accept cannot complete because Auth:Trial:LocalIdentity is not fully configured. "
        + "Set JwtIssuer, JwtAudience, and a valid JwtPrivateKeyPemPath, then retry. "
        + "Administrators can verify readiness under Settings → Identity providers "
        + "(GET /v1/admin/auth/configuration-diagnostics).";

    public static (bool OperatorBaseUrlConfigured, bool LocalTrialIdentityConfigured) Evaluate(
        EmailNotificationOptions emailOptions,
        TrialAuthOptions trialOptions)
    {
        ArgumentNullException.ThrowIfNull(emailOptions);
        ArgumentNullException.ThrowIfNull(trialOptions);

        return (IsOperatorBaseUrlConfigured(emailOptions), IsLocalTrialIdentityConfigured(trialOptions));
    }

    public static bool IsLocalTrialJwtMisconfiguration(InvalidOperationException exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        string message = exception.Message;

        return message.Contains("Auth:Trial:LocalIdentity", StringComparison.Ordinal)
               || message.Contains("JwtPrivateKeyPemPath", StringComparison.Ordinal)
               || message.Contains("JwtIssuer", StringComparison.Ordinal)
               || message.Contains("JwtAudience", StringComparison.Ordinal);
    }

    private static bool IsOperatorBaseUrlConfigured(EmailNotificationOptions emailOptions)
    {
        string? baseUrl = emailOptions.OperatorBaseUrl?.Trim();

        if (string.IsNullOrWhiteSpace(baseUrl))
            return false;

        return Uri.TryCreate(baseUrl, UriKind.Absolute, out Uri? parsed)
               && (parsed.Scheme == Uri.UriSchemeHttps || parsed.Scheme == Uri.UriSchemeHttp);
    }

    private static bool IsLocalTrialIdentityConfigured(TrialAuthOptions trialOptions)
    {
        TrialLocalIdentityOptions local = trialOptions.LocalIdentity;

        if (string.IsNullOrWhiteSpace(local.JwtIssuer) || string.IsNullOrWhiteSpace(local.JwtAudience))
            return false;

        string path = local.JwtPrivateKeyPemPath.Trim();

        if (string.IsNullOrEmpty(path))
            return false;

        string resolved = Path.IsPathRooted(path)
            ? path
            : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), path));

        return File.Exists(resolved);
    }
}
