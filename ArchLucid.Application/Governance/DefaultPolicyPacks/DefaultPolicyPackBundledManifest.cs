using System.Reflection;
using System.Text.Json;

using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>Loads V1 GA <see cref="PlatformDefault" /> policy pack JSON bundled as embedded resources.</summary>
public static class DefaultPolicyPackBundledManifest
{
    private const string ManifestResourceName =
        "ArchLucid.Application.Governance.DefaultPolicyPacks.Bundled.bundled-policy-packs-v1.manifest.json";

    private const string ContentResourcePrefix =
        "ArchLucid.Application.Governance.DefaultPolicyPacks.Bundled.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>Stable bundled content file names paired with display names for the platform registry.</summary>
    public static IReadOnlyList<(string ContentFile, string DisplayName)> LoadRegistrySeedEntries()
    {
        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = LoadBundles();
        BundledManifestDocument? manifest = LoadManifestDocument();

        if (manifest?.ContentFiles is null || manifest.ContentFiles.Count != bundles.Count)
        {
            throw new InvalidOperationException(
                "Bundled policy pack manifest contentFiles count must match loaded bundle definitions.");
        }

        List<(string ContentFile, string DisplayName)> entries = new(manifest.ContentFiles.Count);

        for (int index = 0; index < manifest.ContentFiles.Count; index++)
            entries.Add((manifest.ContentFiles[index], bundles[index].DisplayName));

        return entries;
    }

    /// <summary>Ordered bundle definitions for tenant provisioning seeding.</summary>
    public static IReadOnlyList<DefaultPolicyPackBundleDefinition> LoadBundles()
    {
        BundledManifestDocument manifest = LoadManifestDocument();
        IReadOnlyList<string> contentFiles = manifest.ContentFiles
            ?? throw new InvalidOperationException("Bundled policy pack manifest has no contentFiles.");

        Assembly assembly = typeof(DefaultPolicyPackBundledManifest).Assembly;
        List<DefaultPolicyPackBundleDefinition> bundles = new(contentFiles.Count);

        foreach (string fileName in contentFiles)
        {
            string resourceName = ContentResourcePrefix + fileName;
            using Stream? contentStream = assembly.GetManifestResourceStream(resourceName);

            if (contentStream is null)
                throw new InvalidOperationException($"Embedded policy pack content not found: {resourceName}");

            using StreamReader reader = new(contentStream);
            string contentJson = reader.ReadToEnd();

            PolicyPackContentDocument? document =
                JsonSerializer.Deserialize<PolicyPackContentDocument>(contentJson, JsonOptions);

            if (document is null)
                throw new InvalidOperationException($"Invalid policy pack content JSON: {fileName}");

            string displayName = ResolveMetadata(document, "pack.displayName", fileName);
            string description = ResolveMetadata(document, "pack.description", fileName);

            string packSlug = PolicyPackBundledSlugs.FromBundledContentFileName(fileName);
            bundles.Add(new DefaultPolicyPackBundleDefinition(packSlug, displayName, description, contentJson));
        }

        return bundles;
    }

    private static BundledManifestDocument LoadManifestDocument()
    {
        Assembly assembly = typeof(DefaultPolicyPackBundledManifest).Assembly;
        using Stream? manifestStream = assembly.GetManifestResourceStream(ManifestResourceName);

        if (manifestStream is null)
            throw new InvalidOperationException($"Embedded manifest not found: {ManifestResourceName}");

        BundledManifestDocument? manifest =
            JsonSerializer.Deserialize<BundledManifestDocument>(manifestStream, JsonOptions);

        if (manifest?.ContentFiles is null || manifest.ContentFiles.Count == 0)
            throw new InvalidOperationException("Bundled policy pack manifest has no contentFiles.");

        return manifest;
    }

    private static string ResolveMetadata(PolicyPackContentDocument document, string key, string fileName)
    {
        if (document.Metadata is not null &&
            document.Metadata.TryGetValue(key, out string? value) &&
            !string.IsNullOrWhiteSpace(value))
            return value.Trim();

        throw new InvalidOperationException(
            $"Policy pack content '{fileName}' is missing required metadata key '{key}'.");
    }

    private sealed class BundledManifestDocument
    {
        public List<string>? ContentFiles
        {
            get;
            set;
        }
    }
}
