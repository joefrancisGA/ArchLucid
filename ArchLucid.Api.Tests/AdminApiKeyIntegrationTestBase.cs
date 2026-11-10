using System.Text.Json;

using ArchLucid.Api.Tests.Security;

namespace ArchLucid.Api.Tests;

/// <summary>Shared SQL-scoped admin/reader clients for <see cref="ApiKeyReaderAndAdminArchLucidApiFactory" /> integration tests.</summary>
public abstract class AdminApiKeyIntegrationTestBase(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    protected ApiKeyReaderAndAdminArchLucidApiFactory Factory { get; } = factory;

    protected static JsonSerializerOptions JsonOptions => IntegrationTestBase.CreateApiJsonOptions();

    protected HttpClient CreateAdminClient() => CreateApiKeyClient(ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);

    protected HttpClient CreateReaderClient() => CreateApiKeyClient(ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey);

    private HttpClient CreateApiKeyClient(string apiKey)
    {
        HttpClient client = Factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        IntegrationTestSqlClientBootstrap.WireDefaultSqlIntegrationScopeHeaders(client);

        return client;
    }
}
