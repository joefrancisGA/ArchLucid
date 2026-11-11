using System.Text;
using System.Text.Json;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>Canonical HTTP helpers for <c>/v1/integrations/*</c> Core integration tests.</summary>
public static class IntegrationsHarnessExtensions
{
    private static readonly JsonSerializerOptions OutboundIssueJsonOptions = new(JsonSerializerDefaults.Web);

    public static StringContent CreateItsmOutboundIssueJsonContent(string provider, string findingId)
    {
        ArgumentException.ThrowIfNullOrEmpty(provider);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        string json = JsonSerializer.Serialize(
            new Dictionary<string, string> { ["provider"] = provider, ["findingId"] = findingId },
            OutboundIssueJsonOptions);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    public static Task<HttpResponseMessage> PostItsmOutboundIssueHttpAsync(
        this HttpClient client,
        string provider,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.PostAsync(
            "/v1/integrations/itsm/outbound/issues",
            CreateItsmOutboundIssueJsonContent(provider, findingId),
            cancellationToken);
    }
}
