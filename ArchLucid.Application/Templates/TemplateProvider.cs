using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Templates;

/// <summary>
///     Loads predefined <see cref="ArchitectureRequest"/> JSON resources under
///     <c>ArchLucid.Application/Templates/*.json</c> and exposes catalog metadata for
///     <c>GET /v1/architecture/templates</c>.
/// </summary>
public sealed class TemplateProvider
{
    private sealed record CatalogEntry(string Id, string Name, string Description, string ResourceName);

    private static readonly Assembly Assembly = typeof(TemplateProvider).Assembly;

    private static readonly JsonSerializerOptions DeserializeOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true) },
    };

    private static readonly CatalogEntry[] CatalogEntries =
    [
        new CatalogEntry(
            Id: "webapp-sql",
            Name: "Web application with SQL",
            Description:
            "A conventional Azure web workload with HTTPS clients, compute tier scaling, and Azure SQL as the transactional store plus managed identity defaults.",
            ResourceName: "ArchLucid.Application.Templates.webapp-sql.json"),
        new CatalogEntry(
            Id: "serverless-api",
            Name: "Serverless API with Cosmos DB",
            Description:
            "Azure Functions for HTTP and async triggers with Azure Cosmos DB partitioning guidance and queues for resilient background processing.",
            ResourceName: "ArchLucid.Application.Templates.serverless-api.json"),
        new CatalogEntry(
            Id: "microservices-aks",
            Name: "Microservices on AKS with Service Bus",
            Description:
            "Kubernetes microservices on AKS exchanging messages through Azure Service Bus with ingress, observability, and identity integration expectations.",
            ResourceName: "ArchLucid.Application.Templates.microservices-aks.json"),
    ];

    private readonly ArchitectureRequestTemplateSummary[] _summaries;

    private readonly Dictionary<string, ArchitectureRequest> _requestsById;

    public TemplateProvider()
    {
        ArchitectureRequestTemplateSummary[] summaries = new ArchitectureRequestTemplateSummary[CatalogEntries.Length];

        Dictionary<string, ArchitectureRequest> byId = new(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < CatalogEntries.Length; i++)
        {
            CatalogEntry catalogEntry = CatalogEntries[i];

            summaries[i] = new ArchitectureRequestTemplateSummary(
                catalogEntry.Id,
                catalogEntry.Name,
                catalogEntry.Description);

            using Stream stream = OpenTemplateStream(catalogEntry.ResourceName);

            ArchitectureRequest? parsed =
                JsonSerializer.Deserialize<ArchitectureRequest>(stream, DeserializeOptions);

            if (parsed is null)
                throw new InvalidOperationException($"Failed to deserialize embedded template '{catalogEntry.ResourceName}'.");

            if (string.IsNullOrWhiteSpace(parsed.RequestId))
                throw new InvalidOperationException($"Template '{catalogEntry.Id}' produced an empty RequestId.");

            byId[catalogEntry.Id] = parsed;
        }

        _summaries = summaries;

        _requestsById = byId;
    }

    public IReadOnlyList<ArchitectureRequestTemplateSummary> GetSummaries() => _summaries;

    /// <summary>Returns the embedded <see cref="ArchitectureRequest"/> body for a catalog <paramref name="templateId"/>.</summary>
    public bool TryGetArchitectureRequest(string templateId,
        [NotNullWhen(true)] out ArchitectureRequest? request)
    {
        if (string.IsNullOrWhiteSpace(templateId))
        {
            request = null;
            return false;
        }

        return _requestsById.TryGetValue(templateId.Trim(), out request);
    }

    private static Stream OpenTemplateStream(string resourceName)
    {
        Stream? stream = Assembly.GetManifestResourceStream(resourceName);

        if (stream is null)
            throw new InvalidOperationException($"Missing embedded template resource '{resourceName}'.");

        return stream;
    }
}
