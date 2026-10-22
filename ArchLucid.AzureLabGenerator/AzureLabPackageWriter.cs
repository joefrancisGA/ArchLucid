using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabPackageWriter
{
    private static readonly DateTimeOffset PackageTimestamp = new(2026, 6, 21, 12, 0, 0, TimeSpan.Zero);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public byte[] Build(AzureLabScenario scenario)
    {
        ArgumentNullException.ThrowIfNull(scenario);

        using MemoryStream output = new();

        using (ZipArchive archive = new(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteJsonEntry(
                archive,
                "manifest.json",
                new
                {
                    schemaVersion = 1,
                    scriptVersion = scenario.ScriptVersion,
                    collectionTimestamp = scenario.CollectionTimestamp,
                    subscriptionId = scenario.SubscriptionId,
                    scope = scenario.Scope,
                    switchesUsed = Array.Empty<string>(),
                });
            WriteJsonEntry(archive, "resources.json", scenario.BuildResources());
            WriteJsonEntry(archive, "policy-compliance.json", scenario.PolicyCompliance);
            WriteTextEntry(archive, "README.txt", scenario.Readme);
            WriteTextEntry(archive, "architecture-diagram.mmd", scenario.DiagramMermaid);
        }

        return output.ToArray();
    }

    private static void WriteJsonEntry(ZipArchive archive, string name, object value)
    {
        WriteTextEntry(archive, name, JsonSerializer.Serialize(value, JsonOptions));
    }

    private static void WriteTextEntry(ZipArchive archive, string name, string contents)
    {
        ZipArchiveEntry entry = archive.CreateEntry(name, CompressionLevel.Optimal);
        entry.LastWriteTime = PackageTimestamp;

        using Stream stream = entry.Open();
        using StreamWriter writer = new(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        writer.Write(contents);
    }
}
