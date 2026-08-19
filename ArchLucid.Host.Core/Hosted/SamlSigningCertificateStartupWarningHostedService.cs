using System.Security.Cryptography.X509Certificates;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Emits a startup config warning when the SAML SP signing certificate expires within 30 days (Improvement #3).
/// </summary>
public sealed class SamlSigningCertificateStartupWarningHostedService(
    IConfiguration configuration,
    IWebHostEnvironment webHostEnvironment,
    TimeProvider timeProvider,
    ILogger<SamlSigningCertificateStartupWarningHostedService> logger) : IHostedService
{
    private const int WarningDaysBeforeExpiry = 30;

    private const string SamlSection = "ArchLucidAuth:Saml2";

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IWebHostEnvironment _webHostEnvironment =
        webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<SamlSigningCertificateStartupWarningHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_configuration.GetValue($"{SamlSection}:Enabled", false))
            return Task.CompletedTask;

        string certFile = (_configuration[$"{SamlSection}:SigningCertificateFile"] ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(certFile))
            return Task.CompletedTask;

        try
        {
            string certPath = Path.IsPathRooted(certFile)
                ? certFile
                : Path.GetFullPath(Path.Combine(_webHostEnvironment.ContentRootPath, certFile.TrimStart('/', '\\')));

            if (!File.Exists(certPath))
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning("SAML signing certificate file not found at startup: {CertPath}", certPath);

                return Task.CompletedTask;
            }

            string? password = _configuration[$"{SamlSection}:SigningCertificatePassword"];
            using X509Certificate2 certificate = string.IsNullOrEmpty(password)
                ? X509CertificateLoader.LoadPkcs12FromFile(certPath, null)
                : X509CertificateLoader.LoadPkcs12FromFile(certPath, password);

            DateTimeOffset notAfter = new(certificate.NotAfter.ToUniversalTime(), TimeSpan.Zero);
            double daysRemaining = (notAfter - _timeProvider.GetUtcNow()).TotalDays;

            if (daysRemaining > WarningDaysBeforeExpiry)
                return Task.CompletedTask;

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "SAML SP signing certificate expires in {DaysRemaining:F1} days (NotAfterUtc={NotAfterUtc}).",
                    daysRemaining,
                    notAfter);
            }

            ArchLucidInstrumentation.RecordStartupConfigWarning(
                StartupValidationWarningRuleNames.SamlSigningCertificateExpiringSoon);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Unable to evaluate SAML signing certificate expiry at startup.");
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
