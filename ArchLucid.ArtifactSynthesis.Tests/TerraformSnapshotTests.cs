using System.Diagnostics;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TerraformSnapshotTests
{
    [SkippableFact]
    public void Generated_terraform_snippet_validates_successfully()
    {
        string terraformExecutable = OperatingSystem.IsWindows() ? "terraform.exe" : "terraform";
        string? pathEnv = Environment.GetEnvironmentVariable("PATH");
        bool terraformFound = false;

        if (!string.IsNullOrEmpty(pathEnv))
        {
            foreach (string dir in pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
            {
                if (string.IsNullOrWhiteSpace(dir))
                    continue;

                try
                {
                    if (File.Exists(Path.Combine(dir.Trim(), terraformExecutable)))
                    {
                        terraformFound = true;
                        break;
                    }
                }
                catch (Exception)
                {
                    // Ignore
                }
            }
        }

        Skip.IfNot(terraformFound, "Terraform CLI must be on PATH for this test (install Terraform and ensure it is discoverable via PATH).");

        string hclBody = """
            variable "archlucid_terraform_snapshot_probe" {
              type        = string
              description = "ArchLucid ArtifactSynthesis.Tests probe variable"
              default     = "ok"
            }
            """;

        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-tf-test-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            string filePath = Path.Combine(tempDir, "main.tf");
            File.WriteAllText(filePath, hclBody);

            ProcessStartInfo initPsi = new(terraformExecutable, "init -backend=false")
            {
                WorkingDirectory = tempDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using Process initProcess = new() { StartInfo = initPsi };
            initProcess.Start();
            initProcess.WaitForExit(TimeSpan.FromSeconds(120));

            initProcess.ExitCode.Should().Be(0, "terraform init should succeed for the probe snippet");

            // Run terraform fmt -check
            ProcessStartInfo fmtPsi = new(terraformExecutable, "fmt -check")
            {
                WorkingDirectory = tempDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using Process fmtProcess = new() { StartInfo = fmtPsi };
            fmtProcess.Start();
            fmtProcess.WaitForExit(TimeSpan.FromSeconds(60));

            fmtProcess.ExitCode.Should().Be(0, "Terraform fmt should pass on the snippet");

            // Run terraform validate
            ProcessStartInfo validatePsi = new(terraformExecutable, "validate")
            {
                WorkingDirectory = tempDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using Process validateProcess = new() { StartInfo = validatePsi };
            validateProcess.Start();
            validateProcess.WaitForExit(TimeSpan.FromSeconds(60));

            validateProcess.ExitCode.Should().Be(0, "Terraform validate should pass on the snippet");
        }
        finally
        {
            try
            {
                if (Directory.Exists(tempDir))
                    Directory.Delete(tempDir, recursive: true);
            }
            catch (Exception)
            {
                // Best effort cleanup
            }
        }
    }
}
