using ArchLucid.Host.Core.Startup.Validation;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Validates required connection string and Azure OpenAI settings during host startup so misconfiguration fails fast.
/// </summary>
public sealed class ConfigurationValidationHostedService(
    IConfiguration configuration,
    ILogger<ConfigurationValidationHostedService> logger) : IHostedService
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<ConfigurationValidationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(_configuration);

        if (errors.Count == 0)
            return Task.CompletedTask;

        foreach (string error in errors)
        {
            if (_logger.IsEnabled(LogLevel.Critical))
                _logger.LogCritical("Startup configuration error (Remediation required): {Error}", error);
        }

        throw new InvalidOperationException(BuildInvalidOperationMessage(errors));
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static string BuildInvalidOperationMessage(IReadOnlyList<string> errors)
    {
        if (errors.Count == 1)
            return "ArchLucid startup configuration is invalid: " + errors[0];

        string numbered = string.Join(
            Environment.NewLine,
            errors.Select((error, index) => string.Format("{0}. {1}", index + 1, error)));

        return "ArchLucid startup configuration is invalid. Fix the following settings, then restart:"
            + Environment.NewLine
            + numbered;
    }
}
