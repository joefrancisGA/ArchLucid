using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Validation;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Hosting;

/// <summary>
///     Aligns <c>Hosting:Role</c> with the ArchLucid.Worker executable so production validation and DI agree.
/// </summary>
public static class WorkerProcessHostingRoleConfiguration
{
    private const string HostingRoleKey = "Hosting:Role";

    private const string WorkerRoleValue = "Worker";

    /// <summary>
    ///     Ensures configuration reports <c>Worker</c> for this process. Rejects <c>Api</c> or <c>Combined</c> overrides.
    /// </summary>
    public static void Apply(WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        string? raw = builder.Configuration[HostingRoleKey];

        if (!string.IsNullOrWhiteSpace(raw)
            && !string.Equals(raw.Trim(), WorkerRoleValue, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "ArchLucid.Worker requires Hosting:Role=Worker (env Hosting__Role=Worker). Current value: '{0}'.",
                    raw.Trim()));
        }

        if (string.IsNullOrWhiteSpace(raw))
        {
            builder.Configuration.AddInMemoryCollection(
                new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
                {
                    [HostingRoleKey] = WorkerRoleValue,
                });
        }
    }

    /// <summary>
    ///     Fail-fast configuration validation before building the service provider.
    /// </summary>
    public static void ValidateOrThrow(WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(
            builder.Configuration,
            builder.Environment);

        if (errors.Count == 0)
            return;

        using ILoggerFactory loggerFactory = LoggerFactory.Create(logging =>
        {
            logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
            logging.AddConsole();
        });

        ILogger logger = loggerFactory.CreateLogger("ArchLucid.Worker.Startup");
        StartupConfigurationFailureLogger.LogCriticalAndThrow(errors, logger);
    }
}
