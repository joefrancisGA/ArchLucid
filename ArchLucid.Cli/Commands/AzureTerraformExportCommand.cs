using System.ComponentModel;

using System.Diagnostics;

namespace ArchLucid.Cli.Commands;

internal static class AzureTerraformExportCommand
{
    private const string AdvisoryMdHeaderLine = "# ArchLucid advisory – review before apply";

    /// <summary>
    ///     Wraps Microsoft's <c>aztfexport</c> in resource-group scope. ArchLucid never invokes
    ///     <c>terraform apply</c> / <c>terraform destroy</c> itself (aztfexport may run terraform import internally).
    /// </summary>
    internal static async Task<int> RunAsync(string[] args)
    {
        if (!TryParseArgs(args, out string subscriptionId, out string resourceGroup, out string outputZipPath))

        {

            WriteUsage();

            return CliExitCode.UsageError;

        }

        string executable = OperatingSystem.IsWindows()

            ? "aztfexport.exe"

            : "aztfexport";

        string stagingDir = Path.Combine(Path.GetTempPath(), $"archlucid-aztfexport-{Guid.NewGuid():N}");

        Directory.CreateDirectory(stagingDir);

        try

        {

            ProcessStartInfo psi =
                new()
                {

                    FileName = executable,

                    RedirectStandardOutput = true,

                    RedirectStandardError = true,

                    UseShellExecute = false,

                };

            // Microsoft aztfexport: resource-group [--flags] <resourceGroupName> (non-interactive automation).
            psi.ArgumentList.Add("resource-group");

            psi.ArgumentList.Add("--non-interactive");

            psi.ArgumentList.Add("-s");

            psi.ArgumentList.Add(subscriptionId);

            psi.ArgumentList.Add("-o");

            psi.ArgumentList.Add(stagingDir);

            psi.ArgumentList.Add("--overwrite");

            psi.ArgumentList.Add(resourceGroup);

            using Process process = new() { StartInfo = psi };

            if (!process.Start())

            {

                await Console.Error.WriteLineAsync("[ArchLucid CLI] Failed to start aztfexport process.");

                return CliExitCode.UsageError;

            }

            string stdout = await process.StandardOutput.ReadToEndAsync();

            string stderr = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (!string.IsNullOrWhiteSpace(stdout))

                await Console.Out.WriteLineAsync(stdout);

            if (!string.IsNullOrWhiteSpace(stderr))

                await Console.Error.WriteLineAsync(stderr);

            if (process.ExitCode != 0)

                return CliExitCode.UsageError;

            await File.WriteAllTextAsync(
                Path.Combine(stagingDir, "ADVISORY.md"),

                "## ArchLucid Terraform export (advisory)" + Environment.NewLine + Environment.NewLine
                + "This Terraform bundle was produced by wrapping Microsoft **aztfexport** via `archlucid azure terraform-export`. "
                + "Review before applying. ArchLucid never applies or destroys resources in your subscription." + Environment.NewLine + Environment.NewLine
                + AdvisoryMdHeaderLine + Environment.NewLine);

            await TerraformExportZipWriter.ZipDirectoryAsync(stagingDir, outputZipPath);

            await Console.Out.WriteLineAsync($"Wrote advisory Terraform bundle: {outputZipPath}");

            return CliExitCode.Success;

        }

        catch (Exception ex)when (ex is FileNotFoundException or Win32Exception)

        {

            await Console.Error.WriteLineAsync(
                "[ArchLucid CLI] `aztfexport` was not found on PATH. Install: https://learn.microsoft.com/azure/developer/terraform/azure-export-for-terraform/export-terraform-overview");

            return CliExitCode.ConfigurationError;

        }

        finally

        {

            try

            {

                if (Directory.Exists(stagingDir))

                    Directory.Delete(stagingDir, recursive: true);

            }

            catch

            {

            }

        }

    }

    private static bool TryParseArgs(string[] args, out string subscriptionId, out string resourceGroup, out string outputZipPath)
    {

        subscriptionId = string.Empty;

        resourceGroup = string.Empty;

        outputZipPath = string.Empty;

        for (int index = 0; index < args.Length; index++)
        {

            string token = args[index];

            if (token is "--subscription" or "-s")

            {

                if (!TryReadNext(args, ref index, out subscriptionId))

                    return false;

                continue;

            }

            if (token is "--resource-group" or "-g")

            {

                if (!TryReadNext(args, ref index, out resourceGroup))

                    return false;

                continue;

            }

            if (token is "--out" or "-o")

            {

                if (!TryReadNext(args, ref index, out outputZipPath))

                    return false;

                continue;

            }

            return false;

        }

        return !string.IsNullOrWhiteSpace(subscriptionId)

            && !string.IsNullOrWhiteSpace(resourceGroup)

            && !string.IsNullOrWhiteSpace(outputZipPath);

    }

    private static bool TryReadNext(string[] args, ref int index, out string value)
    {

        value = string.Empty;

        if (index + 1 >= args.Length)

            return false;

        index++;

        value = args[index].Trim();

        return !string.IsNullOrWhiteSpace(value);

    }

    private static void WriteUsage()
    {

        string msg =
            "Usage: archlucid azure terraform-export --subscription <subId> --resource-group <name> --out <bundle.zip>"
            + Environment.NewLine
            + "Wraps Microsoft aztfexport (non-interactive resource-group mode). ArchLucid never runs terraform apply.";

        if (CliExecutionContext.JsonOutput)

            CliJson.WriteFailureLine(Console.Error, CliExitCode.UsageError, "usage", msg);

        else

            Console.WriteLine(msg);

    }

}
