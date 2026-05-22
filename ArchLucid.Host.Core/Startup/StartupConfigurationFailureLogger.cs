using ArchLucid.Host.Core.Startup.Validation.Rules;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup;

/// <summary>
///     Emits structured startup logs before throwing on configuration validation failures.
/// </summary>
public static class StartupConfigurationFailureLogger
{
    /// <summary>
    ///     Logs billing safety violations at Critical and other configuration errors at Error, then throws.
    /// </summary>
    public static void LogCriticalAndThrow(IReadOnlyList<string> errors, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(errors);
        ArgumentNullException.ThrowIfNull(logger);

        if (errors.Count == 0)
            return;

        BillingProductionSafetyRules.LogCriticalForMatchingErrors(errors, logger);

        foreach (string error in errors)
        {
            if (BillingProductionSafetyRules.IsBillingSafetyError(error))
                continue;

            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError("Startup configuration error: {Error}", error);
        }

        throw new InvalidOperationException(BuildInvalidOperationMessage(errors));
    }

    private static string BuildInvalidOperationMessage(IReadOnlyList<string> errors)
    {
        if (errors.Count == 1)
            return "ArchLucid configuration is invalid: " + errors[0];

        string numbered = string.Join(
            Environment.NewLine,
            errors.Select((error, index) => string.Format("{0}. {1}", index + 1, error)));

        return "ArchLucid configuration is invalid. Fix the settings listed in the logs above, then restart:"
            + Environment.NewLine
            + numbered;
    }
}
