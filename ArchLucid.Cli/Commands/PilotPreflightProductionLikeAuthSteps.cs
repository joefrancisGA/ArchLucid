using ArchLucid.Core.Auth.Saml;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

internal static class PilotPreflightProductionLikeAuthSteps
{
    internal static IReadOnlyList<PilotPreflightStepResult> Evaluate(
        IConfiguration configuration,
        string contentRoot,
        bool simulateProduction)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrEmpty(contentRoot);

        string effectiveEnvironment = ResolveEffectiveEnvironment(configuration, simulateProduction);

        if (!ShouldEvaluateProductionLikeAuth(configuration, effectiveEnvironment, simulateProduction))
            return [];

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(configuration, effectiveEnvironment);

        List<PilotPreflightStepResult> steps = [];

        foreach (HostingMisconfigurationWarning warning in snapshot.BlockingFindings)
        {
            steps.Add(new PilotPreflightStepResult
            {
                Name = $"auth-lint:{warning.RuleName}",
                Disposition = PilotPreflightDisposition.Block,
                Detail = warning.Message,
                Remediation = RemediationForRule(warning.RuleName),
            });
        }

        foreach (HostingMisconfigurationWarning warning in snapshot.AdvisoryFindings)
        {
            steps.Add(new PilotPreflightStepResult
            {
                Name = $"auth-lint:{warning.RuleName}",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = warning.Message,
                Remediation = RemediationForRule(warning.RuleName),
            });
        }

        steps.AddRange(EvaluateOfflineSamlMetadataSteps(configuration));

        return steps;
    }

    private static bool ShouldEvaluateProductionLikeAuth(
        IConfiguration configuration,
        string effectiveEnvironment,
        bool simulateProduction)
    {
        if (simulateProduction)
            return true;

        if (ProductionDangerousMisconfigurationLint.AppliesDangerousFailFast(effectiveEnvironment, configuration))
            return true;

        string? archLucidEnv = configuration["ARCHLUCID_ENVIRONMENT"]
                               ?? Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        return HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(effectiveEnvironment)
               || HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(archLucidEnv ?? string.Empty);
    }

    private static string ResolveEffectiveEnvironment(IConfiguration configuration, bool simulateProduction)
    {
        if (simulateProduction)
            return Environments.Production;

        string? effectiveEnv =
            configuration["ASPNETCORE_ENVIRONMENT"]?.Trim()
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        if (string.IsNullOrWhiteSpace(effectiveEnv))
            return Environments.Production;

        return effectiveEnv;
    }

    private static IReadOnlyList<PilotPreflightStepResult> EvaluateOfflineSamlMetadataSteps(IConfiguration configuration)
    {
        bool enabled = configuration.GetValue($"{SamlSpConfigurationSnapshot.ConfigurationSectionPath}:Enabled", false);

        if (!enabled)
            return [];

        string metadata =
            configuration[$"{SamlSpConfigurationSnapshot.ConfigurationSectionPath}:IdPMetadata"]?.Trim() ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(metadata))
            return [];

        return
        [
            new PilotPreflightStepResult
            {
                Name = "auth-lint:saml2.idp_metadata_missing",
                Disposition = PilotPreflightDisposition.Block,
                Detail = "ArchLucidAuth:Saml2:Enabled is true but ArchLucidAuth:Saml2:IdPMetadata is unset.",
                Remediation =
                    "Set ArchLucidAuth:Saml2:IdPMetadata to the IdP metadata HTTPS URL, or run "
                    + "`archlucid auth validate-saml --metadata <file.xml> --claim-mapping <file.json>` offline.",
            },
        ];
    }

    private static string RemediationForRule(string ruleName)
    {
        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed,
                StringComparison.Ordinal))
        {
            return "Set ArchLucidAuth:Mode to JwtBearer or ApiKey for production-like hosting; DevelopmentBypass is local-only.";
        }

        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerMissingAuthorityAndPem,
                StringComparison.Ordinal))
        {
            return "Set ArchLucidAuth:Authority and ArchLucidAuth:Audience for Entra/OIDC, or use a non-production profile with local PEM only.";
        }

        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerLocalPemDisallowedProductionProfile,
                StringComparison.Ordinal))
        {
            return "Remove ArchLucidAuth:JwtSigningPublicKeyPemPath in Production; use Entra/OIDC Authority + Audience instead.";
        }

        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.ApiKeyModeDisabledWhenConfigured,
                StringComparison.Ordinal))
        {
            return "Enable Authentication:ApiKey:Enabled and configure AdminKey/ReadOnlyKey, or switch ArchLucidAuth:Mode.";
        }

        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeUnrecognized,
                StringComparison.Ordinal))
        {
            return "Set ArchLucidAuth:Mode to ApiKey, JwtBearer, or DevelopmentBypass (local only).";
        }

        if (string.Equals(
                ruleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthenticationApiKeyDevelopmentBypassAllDisallowed,
                StringComparison.Ordinal))
        {
            return "Set Authentication:ApiKey:DevelopmentBypassAll=false before production-like hosting.";
        }

        return "See docs/library/CONFIGURATION_REFERENCE.md and run `archlucid config lint --simulate-production --hosting-advisor`.";
    }
}
