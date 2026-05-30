using System.Security.Cryptography;

namespace ArchLucid.Cli.Support;

public static class BuyerSafeArtifactIntegrityHasher
{
    public static IReadOnlyList<BuyerSafeArtifactIntegrityEntry> BuildEntries(
        string outputDirectory,
        IReadOnlyList<string> fileNames,
        string redactionStatusWhenPass)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);

        if (fileNames is null)
            throw new ArgumentNullException(nameof(fileNames));

        List<BuyerSafeArtifactIntegrityEntry> entries = [];

        foreach (string fileName in fileNames)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                continue;

            string path = Path.Combine(outputDirectory, fileName);

            if (!File.Exists(path))
                continue;

            FileInfo info = new(path);
            byte[] bytes = File.ReadAllBytes(path);
            string sha256Hex = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

            entries.Add(
                new BuyerSafeArtifactIntegrityEntry
                {
                    FileName = fileName,
                    ByteCount = info.Length,
                    Sha256Hex = sha256Hex,
                    RedactionStatus = redactionStatusWhenPass,
                });
        }

        return entries;
    }
}
