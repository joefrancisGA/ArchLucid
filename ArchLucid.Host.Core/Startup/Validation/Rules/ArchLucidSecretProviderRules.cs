using ArchLucid.Core.Secrets;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class ArchLucidSecretProviderRules
{
    /// <summary>
    ///     Production-like hosts must resolve secrets from Azure Key Vault (managed identity), not process environment
    ///     variables, so credential rotation and least-privilege access stay centralized.
    /// </summary>
    public static void Collect(
        IConfiguration configuration,
        IHostEnvironment environment,
        List<string> errors)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(errors);

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
            return;

        ArchLucidSecretOptions options =
            configuration.GetSection(ArchLucidSecretOptions.SectionName).Get<ArchLucidSecretOptions>()
            ?? new ArchLucidSecretOptions();

        if (options.Provider == SecretProviderKind.KeyVault
            && !string.IsNullOrWhiteSpace(options.KeyVaultUri?.Trim()))
            return;

        errors.Add(
            "ArchLucid:Secrets:Provider must be KeyVault with ArchLucid:Secrets:KeyVaultUri set in Production-like hosts "
            + "(ASP.NET Production/Staging or ARCHLUCID_ENVIRONMENT=Production|Staging). "
            + "EnvironmentVariable secret resolution is for local development only.");
    }
}
