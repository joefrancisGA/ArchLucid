using System.Diagnostics;

namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>
///     Best-effort <c>terraform fmt</c> for advisory HCL snippets when the Terraform CLI is on <c>PATH</c>.
/// </summary>
internal static class TerraformHclFormatHelper
{
    /// <summary>Returns formatted HCL, or <see langword="null" /> when fmt is unavailable or fails.</summary>
    public static string? TryFormat(string hclBody)
    {
        if (string.IsNullOrWhiteSpace(hclBody))
            return hclBody;

        string? terraformExecutable = TryResolveTerraformExecutablePath();

        if (terraformExecutable is null)
            return null;

        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-tf-fmt-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            string filePath = Path.Combine(tempDir, "stub.tf");
            File.WriteAllText(filePath, hclBody);

            ProcessStartInfo psi = new(terraformExecutable, "fmt -no-color stub.tf")
            {
                WorkingDirectory = tempDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using Process process = new() { StartInfo = psi };

            if (!process.Start())
                return null;

            process.WaitForExit(TimeSpan.FromSeconds(30));

            if (process.ExitCode != 0)
                return null;

            return File.Exists(filePath) ? File.ReadAllText(filePath) : null;
        }
        catch (Exception)
        {
            return null;
        }
        finally
        {
            TryDeleteDirectory(tempDir);
        }
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
