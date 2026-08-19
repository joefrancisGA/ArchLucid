using System.Diagnostics;
using System.IO.Compression;
using System.Text;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TerraformSnapshotTests
{
    private const string TerraformPathSkipMessage =
        "Terraform CLI must be on PATH for this test (install Terraform and ensure it is discoverable via PATH).";

    [SkippableFact]
    public void Generated_terraform_snippet_validates_successfully()
    {
        string? terraformExecutable = TryResolveTerraformExecutablePath();

        Skip.IfNot(terraformExecutable is not null, TerraformPathSkipMessage);

        const string hclBody = """
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

            RunTerraformInitFmtCheckValidate(terraformExecutable, tempDir);
        }
        finally
        {
            TryDeleteDirectory(tempDir);
        }
    }

    /// <summary>
    ///     Batch-4 prompt 10: validate the same <c>advisory-placeholder.tf</c> bytes the product ships,
    ///     not only a standalone probe snippet.
    /// </summary>
    [SkippableFact]
    public void Advisory_placeholder_export_tf_passes_terraform_fmt_check_and_validate()
    {
        string? terraformExecutable = TryResolveTerraformExecutablePath();

        Skip.IfNot(terraformExecutable is not null, TerraformPathSkipMessage);

        ArtifactPackagingService sut = new(new FixedContentTypeResolver());
        ArtifactPackage package = sut.BuildTerraformAdvisoryPlaceholderExport(Guid.NewGuid());

        using MemoryStream stream = new(package.Content);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);
        ZipArchiveEntry? tfEntry = archive.GetEntry("advisory-placeholder.tf");

        tfEntry.Should().NotBeNull();

        string hclBody;

        using (StreamReader reader = new(tfEntry.Open(), Encoding.UTF8))
            hclBody = reader.ReadToEnd();

        string tempDir = Path.Combine(Path.GetTempPath(), "archlucid-tf-advisory-export-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            File.WriteAllText(Path.Combine(tempDir, "main.tf"), hclBody);

            RunTerraformInitFmtCheckValidate(terraformExecutable, tempDir);
        }
        finally
        {
            TryDeleteDirectory(tempDir);
        }
    }

    private static void RunTerraformInitFmtCheckValidate(string terraformExecutable, string workingDirectory)
    {
        ProcessStartInfo initPsi = new(terraformExecutable, "init -backend=false")
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using Process initProcess = new();
        initProcess.StartInfo = initPsi;
        initProcess.Start();
        initProcess.WaitForExit(TimeSpan.FromSeconds(120));

        initProcess.ExitCode.Should().Be(0, "terraform init should succeed");

        ProcessStartInfo fmtPsi = new(terraformExecutable, "fmt -check")
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using Process fmtProcess = new();
        fmtProcess.StartInfo = fmtPsi;
        fmtProcess.Start();
        fmtProcess.WaitForExit(TimeSpan.FromSeconds(60));

        fmtProcess.ExitCode.Should().Be(0, "terraform fmt -check should succeed");

        ProcessStartInfo validatePsi = new(terraformExecutable, "validate")
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using Process validateProcess = new();
        validateProcess.StartInfo = validatePsi;
        validateProcess.Start();
        validateProcess.WaitForExit(TimeSpan.FromSeconds(60));

        validateProcess.ExitCode.Should().Be(0, "terraform validate should succeed");
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
                // Ignore invalid PATH segments.
            }
        }

        return null;
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
            // Best-effort cleanup.
        }
    }

    private sealed class FixedContentTypeResolver : IArtifactContentTypeResolver
    {
        public string Resolve(SynthesizedArtifact artifact)
        {
            _ = artifact;

            return "text/plain";
        }
    }
}
