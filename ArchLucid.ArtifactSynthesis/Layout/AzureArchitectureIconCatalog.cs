using System.Reflection;
using System.Text.Json;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed record AzureArchitectureIconCatalogEntry(
    string Category,
    string Service,
    IReadOnlyList<string> ArmTypes,
    string? Kind,
    string File,
    string SvgMarkup);

public sealed class AzureArchitectureIconCatalog
{
    private const string ManifestResourceName =
        "ArchLucid.ArtifactSynthesis.AzureIcons.azure-icon-manifest.json";
    private const string IconResourcePrefix = "ArchLucid.ArtifactSynthesis.AzureIcons.";

    private readonly IReadOnlyList<AzureArchitectureIconCatalogEntry> entries;

    private AzureArchitectureIconCatalog(IReadOnlyList<AzureArchitectureIconCatalogEntry> entries)
    {
        this.entries = entries;
    }

    public static AzureArchitectureIconCatalog Load(Assembly? assembly = null)
    {
        Assembly sourceAssembly = assembly ?? typeof(AzureArchitectureIconCatalog).Assembly;
        using Stream manifestStream = sourceAssembly.GetManifestResourceStream(ManifestResourceName)
            ?? throw new InvalidOperationException($"Embedded Azure icon manifest was not found: {ManifestResourceName}");
        using StreamReader manifestReader = new(manifestStream);
        AzureArchitectureIconManifest? manifest = JsonSerializer.Deserialize<AzureArchitectureIconManifest>(
            manifestReader.ReadToEnd(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (manifest?.Icons is null)
        {
            throw new InvalidOperationException("Embedded Azure icon manifest did not contain icons.");
        }

        List<AzureArchitectureIconCatalogEntry> entries = [];
        foreach (AzureArchitectureIconManifestEntry item in manifest.Icons)
        {
            if (string.IsNullOrWhiteSpace(item.File))
            {
                throw new InvalidOperationException("An Azure icon manifest entry has no file.");
            }

            string resourceName = IconResourcePrefix + item.File.Replace('/', '.').Replace('\\', '.');
            using Stream iconStream = sourceAssembly.GetManifestResourceStream(resourceName)
                ?? throw new InvalidOperationException($"Embedded Azure icon was not found: {item.File}");
            using StreamReader iconReader = new(iconStream);
            string svgMarkup = iconReader.ReadToEnd();

            XDocument document = XDocument.Parse(svgMarkup, LoadOptions.PreserveWhitespace);
            document.Descendants().Where(element => element.Name.LocalName == "script").Remove();
            entries.Add(new AzureArchitectureIconCatalogEntry(
                item.Category ?? string.Empty,
                item.Service ?? string.Empty,
                item.ArmTypes ?? [],
                item.Kind,
                item.File,
                document.ToString(SaveOptions.DisableFormatting)));
        }

        return new AzureArchitectureIconCatalog(entries);
    }

    public AzureArchitectureIconCatalogEntry? Resolve(string? armType, string? resourceKind = null)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return null;
        }

        string normalizedArmType = armType.Trim();
        List<AzureArchitectureIconCatalogEntry> armTypeMatches = entries
            .Where(entry => entry.ArmTypes.Any(candidate =>
                string.Equals(candidate, normalizedArmType, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        string? normalizedResourceKind = string.IsNullOrWhiteSpace(resourceKind)
            ? null
            : resourceKind.Trim();

        if (normalizedResourceKind is not null)
        {
            string resourceKindBase = normalizedResourceKind
                .Split(',', 2, StringSplitOptions.TrimEntries)[0];
            List<AzureArchitectureIconCatalogEntry> specializedMatches = armTypeMatches
                .Where(entry => !string.IsNullOrWhiteSpace(entry.Kind)
                    && (string.Equals(entry.Kind.Trim(), normalizedResourceKind, StringComparison.OrdinalIgnoreCase)
                        || string.Equals(entry.Kind.Trim(), resourceKindBase, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (specializedMatches.Count == 1)
            {
                return specializedMatches[0];
            }

            if (specializedMatches.Count > 1)
            {
                return null;
            }
        }

        List<AzureArchitectureIconCatalogEntry> defaultMatches = armTypeMatches
            .Where(entry => string.IsNullOrWhiteSpace(entry.Kind))
            .ToList();

        return defaultMatches.Count == 1 ? defaultMatches[0] : null;
    }

    private sealed class AzureArchitectureIconManifest
    {
        public List<AzureArchitectureIconManifestEntry>? Icons { get; set; }
    }

    private sealed class AzureArchitectureIconManifestEntry
    {
        public string? Category { get; set; }
        public string? Service { get; set; }
        public List<string>? ArmTypes { get; set; }
        public string? Kind { get; set; }
        public string? File { get; set; }
    }
}
