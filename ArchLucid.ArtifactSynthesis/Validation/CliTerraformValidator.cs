using System.Diagnostics;

using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>Runs <c>terraform validate</c> when the Terraform CLI is on <c>PATH</c>; otherwise defers to the next validator.</summary>
public sealed class CliTerraformValidator : ITerraformValidator
{
    public TerraformValidationOutcome Validate(string hclBody)
    {
        if (string.IsNullOrWhiteSpace(hclBody))
            return TerraformValidationOutcome.Valid();

        string? terraformExecutable = TryResolveTerraformExecutablePath();

        if (terraformExecutable is null)
            return TerraformValidationOutcome.Valid();

        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-tf-validate-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            string filePath = Path.Combine(tempDir, "advisory.tf");
            File.WriteAllText(filePath, hclBody);

            if (!RunTerraformCommand(terraformExecutable, tempDir, "init -backend=false -input=false"))
                return TerraformValidationOutcome.Invalid("terraform init failed during advisory validation.");

            if (!RunTerraformCommand(terraformExecutable, tempDir, "validate -no-color"))
                return TerraformValidationOutcome.Invalid("terraform validate reported syntax errors.");

            return TerraformValidationOutcome.Valid();
        }
        catch (Exception ex)
        {
            return TerraformValidationOutcome.Invalid($"terraform validate failed: {ex.Message}");
        }
        finally
        {
            TryDeleteDirectory(tempDir);
        }
    }

    private static bool RunTerraformCommand(string terraformExecutable, string workingDirectory, string arguments)
    {
        ProcessStartInfo psi = new(terraformExecutable, arguments)
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using Process process = new() { StartInfo = psi };

        if (!process.Start())
            return false;

        process.WaitForExit(TimeSpan.FromSeconds(60));

        return process.ExitCode == 0;
    }

    private static void TryDeleteDirectory(string path)
    {
        try
        {
            if (Directory.Exists(path))
                Directory.Delete(path, recursive: true);
        }
        catch (Exception)
        {
            // Best-effort temp cleanup.
        }
    }

    private static string? TryResolveTerraformExecutablePath()
    {
        string fileName = OperatingSystem.IsWindows() ? "terraform.exe" : "terraform";
        string? pathEnv = Environment.GetEnvironmentVariable("PATH");

        if (string.IsNullOrEmpty(pathEnv))
            return null;

        foreach (string dir in pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            if (string.IsNullOrWhiteSpace(dir))
                continue;

            try
            {
                string candidate = Path.Combine(dir.Trim(), fileName);

                if (File.Exists(candidate))
                    return candidate;
            }
            catch (Exception)
            {
                // Invalid PATH segment — skip.
            }
        }

        return null;
    }
}
