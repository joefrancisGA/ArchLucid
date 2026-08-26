using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static partial class ValidateConfigEvaluator
{
    private static void AppendEntraJwtRules(List<ValidateConfigFinding> findings, IConfiguration configuration)
    {
        string? authMode = configuration[$"{ArchLucidAuthPrefix}:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(authMode))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Entra / OIDC",
                "ArchLucidAuth:Mode",
                "Unset — binds to default ApiKey in product (see template)."));

        else if (!IsWellKnownAuthMode(authMode))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Entra / OIDC",
                "ArchLucidAuth:Mode",
                $"Unrecognized value '{authMode}' — must be ApiKey, JwtBearer, or DevelopmentBypass."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Entra / OIDC",
                "ArchLucidAuth:Mode",
                authMode));

        if (!string.Equals(authMode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Entra / OIDC",
                "OIDC metadata (Authority / Audience)",
                "Skipped — ArchLucidAuth:Mode is not JwtBearer."));

            return;
        }

        string? pemPath = configuration[$"{ArchLucidAuthPrefix}:JwtSigningPublicKeyPemPath"]?.Trim();

        if (!string.IsNullOrWhiteSpace(pemPath))
        {
            bool issuerOk = ConfigurationKeyPresence.IsValuePresent(configuration, $"{ArchLucidAuthPrefix}:JwtLocalIssuer");

            bool audienceOk = ConfigurationKeyPresence.IsValuePresent(configuration, $"{ArchLucidAuthPrefix}:JwtLocalAudience");

            if (!issuerOk)

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Error,
                    "Entra / OIDC",
                    "ArchLucidAuth:JwtLocalIssuer",
                    "Required when JwtSigningPublicKeyPemPath is set (local RSA public key validation)."));

            else

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Ok,
                    "Entra / OIDC",
                    "ArchLucidAuth:JwtLocalIssuer",
                    "Present."));

            if (!audienceOk)

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Error,
                    "Entra / OIDC",
                    "ArchLucidAuth:JwtLocalAudience",
                    "Required when JwtSigningPublicKeyPemPath is set."));

            else

                findings.Add(new ValidateConfigFinding(
                    ValidateConfigFindingSeverity.Ok,
                    "Entra / OIDC",
                    "ArchLucidAuth:JwtLocalAudience",
                    "Present."));

            return;
        }

        if (!ConfigurationKeyPresence.IsValuePresent(configuration, $"{ArchLucidAuthPrefix}:Authority"))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Entra / OIDC",
                "ArchLucidAuth:Authority",
                "Required for JwtBearer with Entra / OIDC (HTTPS issuer / metadata URL)."));

        else if (!TryCreateHttpsUri(configuration[$"{ArchLucidAuthPrefix}:Authority"]))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Entra / OIDC",
                "ArchLucidAuth:Authority",
                "Must be an absolute HTTPS URI (Entra v2.0 issuer or OIDC metadata base)."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Entra / OIDC",
                "ArchLucidAuth:Authority",
                "Present and HTTPS (value not shown)."));

        if (!ConfigurationKeyPresence.IsValuePresent(configuration, $"{ArchLucidAuthPrefix}:Audience"))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Entra / OIDC",
                "ArchLucidAuth:Audience",
                "Required for JwtBearer (API app id URI / audience)."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Entra / OIDC",
                "ArchLucidAuth:Audience",
                "Present (value not shown)."));
    }

    private static void AppendApiKeyRules(List<ValidateConfigFinding> findings, IConfiguration configuration)
    {
        if (!configuration.GetValue("Authentication:ApiKey:Enabled", false))
        {
            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "API key auth",
                "Authentication:ApiKey",
                "Disabled — AdminKey/ReadOnlyKey not required."));

            return;
        }

        string? adminKey = configuration["Authentication:ApiKey:AdminKey"];

        string? readKey = configuration["Authentication:ApiKey:ReadOnlyKey"];

        if (string.IsNullOrWhiteSpace(adminKey) && string.IsNullOrWhiteSpace(readKey))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "API key auth",
                "Authentication:ApiKey key material",
                "At least one of AdminKey or ReadOnlyKey must be set when Enabled is true."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "API key auth",
                "Authentication:ApiKey key material",
                "At least one key is present (values not shown)."));
    }

    private static void AppendAzureOpenAiRules(List<ValidateConfigFinding> findings, IConfiguration configuration)
    {
        if (!string.Equals(
                configuration["AgentExecution:Mode"]?.Trim(),
                "Real",
                StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Azure OpenAI",
                "AzureOpenAI:*",
                "Skipped — AgentExecution:Mode is not Real."));

            return;
        }

        string? completionClient = configuration["AgentExecution:CompletionClient"]?.Trim();

        if (string.Equals(completionClient, "Echo", StringComparison.OrdinalIgnoreCase))
        {
            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Azure OpenAI",
                "AzureOpenAI:*",
                "Skipped — Echo completion client does not call Azure OpenAI."));

            return;
        }

        string? endpoint = configuration["AzureOpenAI:Endpoint"]?.Trim();

        string? apiKey = configuration["AzureOpenAI:ApiKey"]?.Trim();

        string? deployment = configuration["AzureOpenAI:DeploymentName"]?.Trim();

        if (string.IsNullOrWhiteSpace(endpoint))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Azure OpenAI",
                "AzureOpenAI:Endpoint",
                "Required for Real mode (set AzureOpenAI:Endpoint or AZURE_OPENAI__Endpoint)."));

        else if (!TryCreateHttpsUri(endpoint))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Azure OpenAI",
                "AzureOpenAI:Endpoint",
                "Must be an absolute HTTPS URI."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Azure OpenAI",
                "AzureOpenAI:Endpoint",
                "Present and HTTPS (value not shown)."));

        if (string.IsNullOrWhiteSpace(apiKey))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Azure OpenAI",
                "AzureOpenAI:ApiKey",
                "Required for Real mode (secret — use Key Vault or AZURE_OPENAI__ApiKey)."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Azure OpenAI",
                "AzureOpenAI:ApiKey",
                "Present (value not shown)."));

        if (string.IsNullOrWhiteSpace(deployment))

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Error,
                "Azure OpenAI",
                "AzureOpenAI:DeploymentName",
                "Required — deployment name for chat/completions."));

        else

            findings.Add(new ValidateConfigFinding(
                ValidateConfigFindingSeverity.Ok,
                "Azure OpenAI",
                "AzureOpenAI:DeploymentName",
                "Present (value not shown)."));
    }
}
