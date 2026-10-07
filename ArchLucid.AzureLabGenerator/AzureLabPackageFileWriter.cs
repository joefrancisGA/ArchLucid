using System.Security.Cryptography;

namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabPackageFileWriter
{
    private readonly AzureLabPackageWriter packageWriter;

    public AzureLabPackageFileWriter(AzureLabPackageWriter packageWriter)
    {
        this.packageWriter = packageWriter ?? throw new ArgumentNullException(nameof(packageWriter));
    }

    public AzureLabPackageOutput Write(AzureLabScenario scenario, string outputPath, bool force)
    {
        ArgumentNullException.ThrowIfNull(scenario);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);

        string fullPath = Path.GetFullPath(outputPath);

        if (File.Exists(fullPath) && !force)
        {
            throw new AzureLabCommandLineException($"Refusing to overwrite '{fullPath}'. Re-run with --force.");
        }

        string? directory = Path.GetDirectoryName(fullPath);

        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        byte[] bytes = packageWriter.Build(scenario);
        File.WriteAllBytes(fullPath, bytes);
        string sha256 = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

        return new AzureLabPackageOutput(fullPath, scenario.ResourceCount, bytes.LongLength, sha256);
    }
}
