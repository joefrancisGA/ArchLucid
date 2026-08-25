using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;


namespace ArchLucid.Cli;

internal static partial class CliCommandHandlers
{
    internal static async Task<int> HandleAzure(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "extract-and-upload", StringComparison.OrdinalIgnoreCase))
            return await AzureExtractAndUploadCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 2
            && string.Equals(normalized[1], "terraform-export", StringComparison.OrdinalIgnoreCase))
            return await AzureTerraformExportCommand.RunAsync(normalized.Skip(2).ToArray());

        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await AzureValidateZipCommand.RunAsync(normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid azure terraform-export ... | archlucid azure validate-zip --path <file.zip> | archlucid azure extract-and-upload --subscription <id>");
        else
        {
            Console.WriteLine(
                "Usage: archlucid azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>");
            Console.WriteLine("       archlucid azure validate-zip --path <file.zip>");
            Console.WriteLine("       archlucid azure extract-and-upload --subscription <id>");
        }

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleAws(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await CloudInventoryValidateZipCommand.RunAsync(CloudProvider.Aws, normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid aws validate-zip --path <file.zip>");
        else
            Console.WriteLine("Usage: archlucid aws validate-zip --path <file.zip>");

        return CliExitCode.UsageError;
    }


    internal static async Task<int> HandleGcp(string[] normalized)
    {
        if (normalized.Length > 2
            && string.Equals(normalized[1], "validate-zip", StringComparison.OrdinalIgnoreCase))
            return await CloudInventoryValidateZipCommand.RunAsync(CloudProvider.Gcp, normalized.Skip(2).ToArray());

        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(
                Console.Error,
                CliExitCode.UsageError,
                "usage",
                "Expected: archlucid gcp validate-zip --path <file.zip>");
        else
            Console.WriteLine("Usage: archlucid gcp validate-zip --path <file.zip>");

        return CliExitCode.UsageError;
    }


    internal static Task<int> HandleAzRoles(string[] normalized) =>
        AzRolesCommand.RunAsync(normalized.Skip(1).ToArray());


    internal static Task<int> HandleAzTokenTest(string[] normalized) =>
        AzureTokenTestCommand.RunAsync();


}
