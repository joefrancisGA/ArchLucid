using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandleAuth(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "validate-saml", StringComparison.OrdinalIgnoreCase))
            return await AuthValidateSamlCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 1 && string.Equals(normalized[1], "diagnostics", StringComparison.OrdinalIgnoreCase))
            return await AuthDiagnosticsCommand.RunAsync(
                normalized.Skip(2).ToArray(),
                CliCommandShared.TryLoadConfigFromCwd());

        if (normalized.Length > 1 && string.Equals(normalized[1], "test-token", StringComparison.OrdinalIgnoreCase))
            return await AuthTestTokenCommand.RunAsync(
                normalized.Skip(2).ToArray(),
                CliCommandShared.TryLoadConfigFromCwd());

        if (normalized.Length > 1 && string.Equals(normalized[1], "sso-preflight", StringComparison.OrdinalIgnoreCase))
            return await AuthSsoPreflightCommand.RunAsync();

        AuthValidateSamlCommand.WriteUsage();
        AuthDiagnosticsCommand.WriteUsage();
        AuthTestTokenCommand.WriteUsage();
        AuthSsoPreflightCommand.WriteUsage();

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleSaml(string[] normalized)
    {
        if (normalized.Length > 1 && string.Equals(normalized[1], "test-config", StringComparison.Ordinal))
            return await SamlTestConfigCommand.RunAsync();

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid saml test-config");
        else
            Console.WriteLine("Usage: archlucid saml test-config");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleWebhooks(string[] normalized)
    {
        if (normalized.Length > 1 && normalized[1] == "test")
            return await WebhooksTestCommand.RunAsync(
                normalized
                    .Skip(2)
                    .ToArray());

        WebhooksTestCommand.WriteUsage(false);

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleIntegration(string[] normalized)
    {
        if (normalized.Length > 1)
        {
            if (string.Equals(normalized[1], "retry-dead-letter", StringComparison.OrdinalIgnoreCase))
                return await IntegrationRetryDeadLetterCommand.RunAsync(normalized.Skip(2).ToArray());

            if (string.Equals(normalized[1], "simulate-webhook", StringComparison.OrdinalIgnoreCase))
                return await IntegrationSimulateWebhookCommand.RunAsync(normalized.Skip(2).ToArray());
        }

        IntegrationRetryDeadLetterCommand.WriteUsage();
        Console.WriteLine("       archlucid integration simulate-webhook --event-type <alias> --target-url <url> [--secret <s>]");

        return CliExitCode.UsageError;
    }


}
