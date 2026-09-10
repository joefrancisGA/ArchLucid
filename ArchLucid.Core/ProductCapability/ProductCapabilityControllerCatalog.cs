using System.Text.Json;

using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.ProductCapability;

/// <summary>
///     Loads OP-01 <c>product-capability-map.json</c> once at startup. Missing map rows fail closed in the route gate
///     (500) so new controllers cannot ship without updating the map and coverage tests.
/// </summary>
public sealed class ProductCapabilityControllerCatalog : IProductCapabilityControllerCatalog
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly Dictionary<string, string> _productLineByControllerTypeName;

    public ProductCapabilityControllerCatalog(IHostEnvironment hostEnvironment)
    {
        ArgumentNullException.ThrowIfNull(hostEnvironment);

        ProductCapabilityMapDocument document = LoadDocument(hostEnvironment.ContentRootFileProvider)
            ?? LoadDocumentFromDirectory(AppContext.BaseDirectory)
            ?? throw new FileNotFoundException(
                "Product capability map is missing. Expected docs/architecture/data/product-capability-map.json "
                + "under the API content root or output directory.");
        AlwaysAllowedRoutePrefixes = document.AlwaysAllowedRoutePrefixes;
        _productLineByControllerTypeName = document.Controllers
            .GroupBy(static entry => entry.TypeName, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First().ProductLine, StringComparer.Ordinal);
    }

    public IReadOnlyList<string> AlwaysAllowedRoutePrefixes { get; }

    public bool TryGetControllerProductLine(string controllerTypeFullName, out string productLine)
    {
        if (string.IsNullOrWhiteSpace(controllerTypeFullName))
        {
            productLine = string.Empty;

            return false;
        }

        return _productLineByControllerTypeName.TryGetValue(controllerTypeFullName, out productLine!);
    }

    internal static ProductCapabilityMapDocument? LoadDocument(IFileProvider fileProvider)
    {
        foreach (string relativePath in ResolveCandidateRelativePaths())
        {
            IFileInfo fileInfo = fileProvider.GetFileInfo(relativePath);

            if (!fileInfo.Exists)
            {
                continue;
            }

            using Stream stream = fileInfo.CreateReadStream();
            ProductCapabilityMapDocument? document = JsonSerializer.Deserialize<ProductCapabilityMapDocument>(stream, SerializerOptions);

            if (document is null)
            {
                throw new InvalidOperationException($"Failed to deserialize product capability map: {relativePath}");
            }

            return document;
        }

        return null;
    }

    internal static ProductCapabilityMapDocument? LoadDocumentFromDirectory(string baseDirectory)
    {
        foreach (string relativePath in ResolveCandidateRelativePaths())
        {
            string absolutePath = Path.Combine(baseDirectory, relativePath);

            if (!File.Exists(absolutePath))
            {
                continue;
            }

            string json = File.ReadAllText(absolutePath);
            ProductCapabilityMapDocument? document = JsonSerializer.Deserialize<ProductCapabilityMapDocument>(json, SerializerOptions);

            if (document is null)
            {
                throw new InvalidOperationException($"Failed to deserialize product capability map: {absolutePath}");
            }

            return document;
        }

        return null;
    }

    private static IEnumerable<string> ResolveCandidateRelativePaths()
    {
        yield return Path.Combine("docs", "architecture", "data", "product-capability-map.json");
        yield return Path.Combine("..", "docs", "architecture", "data", "product-capability-map.json");
    }
}
