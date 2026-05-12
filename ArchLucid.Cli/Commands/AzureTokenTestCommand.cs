using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

using Azure;
using Azure.Core;
using Azure.Identity;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Proves <see cref="DefaultAzureCredential" /> locally or in Azure by fetching an access token and printing the
///     decoded JWT payload (never the bearer secret). Override scope via <see cref="ScopeEnvironmentVariableName" />.
/// </summary>
internal static class AzureTokenTestCommand
{
    internal const string DefaultManagementScope = "https://management.azure.com/.default";

    /// <summary>When set (non-whitespace), used as the single scope passed to token acquisition instead of ARM.</summary>
    internal const string ScopeEnvironmentVariableName = "ARCHLUCID_AZURE_TOKEN_TEST_SCOPE";

    public static Task<int> RunAsync(CancellationToken cancellationToken = default)
    {
        string scope = ResolveScope();
        DefaultAzureCredential credential = new();

        return RunCoreAsync(credential, scope, cancellationToken);
    }

    internal static async Task<int> RunCoreAsync(
        TokenCredential credential,
        string scope,
        CancellationToken cancellationToken)
    {
        JsonSerializerOptions formatter = SerializerOptions();

        try
        {
            AccessToken accessToken = await credential
                .GetTokenAsync(new TokenRequestContext([scope]), cancellationToken)
                .ConfigureAwait(false);
            JsonObject root = BuildSuccessEnvelope(scope, accessToken);

            Console.WriteLine(root.ToJsonString(formatter));

            return CliExitCode.Success;
        }
        catch (CredentialUnavailableException ex)
        {
            Console.WriteLine(BuildFailureNode("credential_unavailable", scope, ex.Message).ToJsonString(formatter));

            return CliExitCode.OperationFailed;
        }
        catch (AuthenticationFailedException ex)
        {
            Console.WriteLine(BuildFailureNode("authentication_failed", scope, ex.Message).ToJsonString(formatter));

            return CliExitCode.OperationFailed;
        }
        catch (RequestFailedException ex)
        {
            Console.WriteLine(
                BuildFailureNode("token_request_failed", scope, $"{ex.Status}: {ex.Message}").ToJsonString(formatter));

            return CliExitCode.OperationFailed;
        }
    }

    private static JsonObject BuildSuccessEnvelope(string scope, AccessToken accessToken)
    {
        string tokenSecret = accessToken.Token;
        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject(tokenSecret, out JsonObject? claims);

        JsonObject root = new()
        {
            ["ok"] = true,
            ["scope"] = scope,
            ["credentialEnvironment"] = BuildCredentialEnvironment(),
            ["accessToken"] = new JsonObject
            {
                ["expiresOnUtc"] =
                    accessToken.ExpiresOn.UtcDateTime.ToString("O", CultureInfo.InvariantCulture)
            },
            ["jwtPayload"] = claims
        };

        if (claims is null)

            root["jwtPayloadNote"] =
                "Token is not a three-segment JWT or the payload is not a JSON object; raw token was not emitted.";

        return root;
    }

    private static JsonObject BuildFailureNode(string error, string scope, string message)
    {
        return new JsonObject
        {
            ["ok"] = false,
            ["exitCode"] = CliExitCode.OperationFailed,
            ["error"] = error,
            ["scope"] = scope,
            ["message"] = message,
            ["credentialEnvironment"] = BuildCredentialEnvironment()
        };
    }

    /// <remarks>Indicates which sources might apply; booleans only — never values of secrets.</remarks>
    private static JsonObject BuildCredentialEnvironment()
    {
        JsonObject indicators = new()
        {
            ["azureClientIdConfigured"] = EnvFlag("AZURE_CLIENT_ID"),
            ["azureTenantIdConfigured"] = EnvFlag("AZURE_TENANT_ID"),
            ["azureClientSecretConfigured"] = EnvFlag("AZURE_CLIENT_SECRET"),
            ["azureClientCertificatePathConfigured"] = EnvFlag("AZURE_CLIENT_CERTIFICATE_PATH"),
            ["azureUsernameConfigured"] = EnvFlag("AZURE_USERNAME"),
            ["azurePasswordConfigured"] = EnvFlag("AZURE_PASSWORD"),
            ["msiEndpointConfigured"] = EnvFlag("MSI_ENDPOINT"),
            ["msiSecretConfigured"] = EnvFlag("MSI_SECRET"),
            ["identityEndpointConfigured"] = EnvFlag("IDENTITY_ENDPOINT"),
            ["identityHeaderConfigured"] = EnvFlag("IDENTITY_HEADER"),
            ["tenantIdConfigured"] = EnvFlag("TENANT_ID"),
            ["authorityHostConfigured"] = EnvFlag("AZURE_AUTHORITY_HOST")
        };

        return indicators;
    }

    private static bool EnvFlag(string name)
    {
        return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(name));
    }

    private static string ResolveScope()
    {
        string? explicitScope = Environment.GetEnvironmentVariable(ScopeEnvironmentVariableName)?.Trim();

        if (!string.IsNullOrEmpty(explicitScope))
            return explicitScope;

        return DefaultManagementScope;
    }

    private static JsonSerializerOptions SerializerOptions()
    {
        JsonSerializerOptions options = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        if (!CliExecutionContext.JsonOutput)

            options.WriteIndented = true;

        return options;
    }
}
