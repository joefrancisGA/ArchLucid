using System.Net;
using System.Text;
using System.Text.Json;
using ArchLucid.Api.Client.Generated;

namespace ArchLucid.Api.Client.Tests;

[Trait("Suite", "Core")]
public sealed class ArchLucidApiClientWireTests
{
    /// <summary>Exposes serializer options populated by generated + partial <see cref="ArchLucidApiClient" /> glue.</summary>
    private sealed class TestArchLucidApiClient : ArchLucidApiClient
    {
        public TestArchLucidApiClient(HttpClient httpClient)
            : base(httpClient)
        {
        }

        public JsonSerializerOptions TestSerializerSettings => JsonSerializerSettings;
    }

    private sealed class StubPipelineHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string url = request.RequestUri!.ToString();

            if (url.Contains("/version", StringComparison.Ordinal))
            {
                const string json = "{\"application\":\"ArchLucid\",\"assemblyVersion\":\"1.0.0.0\",\"environment\":\"Test\"}";
                HttpResponseMessage ok = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };

                return Task.FromResult(ok);
            }

            if (url.Contains("api/auth/me", StringComparison.Ordinal))
            {
                const string json = "{\"name\":\"u1\",\"hasCommittedArchitectureReview\":false,\"claims\":[]}";
                HttpResponseMessage ok = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };

                return Task.FromResult(ok);
            }

            if (url.Contains("executive-summary", StringComparison.Ordinal))
            {
                const string json =
                    "{\"type\":\"https://example/problem\",\"title\":\"Unauthorized\",\"status\":401,\"traceId\":\"trace-xyz\"}";
                HttpResponseMessage unauthorized = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };

                return Task.FromResult(unauthorized);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }

    [Fact]
    public async Task VersionAsync_deserializes_BuildInfoResponse()
    {
        using HttpMessageHandler handler = new StubPipelineHandler();
        using HttpClient http = new HttpClient(handler);
        ArchLucidApiClient client = new ArchLucidApiClient(http)
        {
            BaseUrl = "https://unit.test/",
        };

        BuildInfoResponse info = await client.VersionAsync();

        Assert.Equal("ArchLucid", info.Application);
        Assert.Equal("1.0.0.0", info.AssemblyVersion);
        Assert.Equal("Test", info.Environment);
    }

    [Fact]
    public async Task MeAsync_deserializes_CallerIdentityResponse()
    {
        using HttpMessageHandler handler = new StubPipelineHandler();
        using HttpClient http = new HttpClient(handler);
        ArchLucidApiClient client = new ArchLucidApiClient(http)
        {
            BaseUrl = "https://unit.test/",
        };

        CallerIdentityResponse me = await client.MeAsync();

        Assert.Equal("u1", me.Name);
        Assert.False(me.HasCommittedArchitectureReview);
        Assert.NotNull(me.Claims);
        Assert.Empty(me.Claims!);
    }

    [Fact]
    public async Task ExecutiveSummaryAsync_401_throws_with_ProblemDetails_including_traceId()
    {
        using HttpMessageHandler handler = new StubPipelineHandler();
        using HttpClient http = new HttpClient(handler);
        ArchLucidApiClient client = new ArchLucidApiClient(http)
        {
            BaseUrl = "https://unit.test/",
        };

        ArchLucidApiException<ProblemDetails> ex = await Assert.ThrowsAsync<ArchLucidApiException<ProblemDetails>>(
            () => client.ExecutiveSummaryAsync(Guid.NewGuid(), null, null));

        Assert.Equal(401, ex.StatusCode);
        Assert.NotNull(ex.Result);
        Assert.Equal("trace-xyz", ex.Result.TraceId);
        Assert.Equal("Unauthorized", ex.Result.Title);
    }

    [Fact]
    public void Client_JsonSerializerSettings_deserializes_enum_from_json_string_for_CitationReference()
    {
        using HttpMessageHandler handler = new StubPipelineHandler();
        using HttpClient http = new HttpClient(handler);
        TestArchLucidApiClient client = new TestArchLucidApiClient(http)
        {
            BaseUrl = "https://unit.test/",
        };

        const string json = """{"id":"c1","kind":"Finding","label":"L1"}""";
        CitationReference? citation = JsonSerializer.Deserialize<CitationReference>(json, client.TestSerializerSettings);

        Assert.NotNull(citation);
        Assert.Equal("c1", citation!.Id);
        Assert.Equal(CitationKind.Finding, citation.Kind);
        Assert.Equal("L1", citation.Label);
    }

    [Fact]
    public void BaseUrl_without_trailing_slash_is_normalized()
    {
        using HttpMessageHandler handler = new StubPipelineHandler();
        using HttpClient http = new HttpClient(handler);
        ArchLucidApiClient client = new ArchLucidApiClient(http)
        {
            BaseUrl = "https://unit.test",
        };

        Assert.Equal("https://unit.test/", client.BaseUrl);
    }
}
