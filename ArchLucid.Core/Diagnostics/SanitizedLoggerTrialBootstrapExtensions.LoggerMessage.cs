using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Source-generated <see cref="ILogger" /> emitters for
///     <see cref="SanitizedLoggerTrialBootstrapExtensions" />.
/// </summary>
public static partial class SanitizedLoggerTrialBootstrapExtensions
{
    [LoggerMessage(
        EventId = 3016,
        Level = LogLevel.Information,
        Message =
            "Skipping trial bootstrap for tenant {TenantId}: email verification policy blocked provisioning for domain {EmailDomain}.")]
    private static partial void EmitTrialBootstrapEmailVerificationBlocked(
        ILogger logger,
        Guid tenantId,
        string emailDomain);
}
