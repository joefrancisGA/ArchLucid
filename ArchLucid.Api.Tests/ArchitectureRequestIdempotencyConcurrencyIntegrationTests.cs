using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
/// Parallel <c>POST /v1/architecture/request</c> with the same <c>Idempotency-Key</c> converges on one authority run id.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class ArchitectureRequestIdempotencyConcurrencyIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: true) },
    };

    private static StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    [Fact]
    public async Task Sixteen_parallel_posts_same_idempotency_key_single_distinct_run_id()
    {
        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();

        string idempotencyKey = "idem-arch-req16-" + Guid.NewGuid().ToString("N");
        string requestId = "REQ-ARCH16-" + Guid.NewGuid().ToString("N")[..10];
        object body = TestRequestFactory.CreateArchitectureRequest(requestId);

        const int parallel = 16;
        Task<HttpResponseMessage>[] tasks = new Task<HttpResponseMessage>[parallel];

        for (int i = 0; i < parallel; i++)
        {
            HttpRequestMessage request = new(HttpMethod.Post, "/v1/architecture/request")
            {
                Content = JsonContent(body),
            };

            request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);
            tasks[i] = client.SendAsync(request);
        }

        HttpResponseMessage[] responses = await Task.WhenAll(tasks);

        try
        {
            HashSet<string> runIds = [];

            foreach (HttpResponseMessage response in responses)
            {
                response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
                CreateRunResponseDto? dto = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
                dto.Should().NotBeNull();
                runIds.Add(dto!.Run.RunId);
            }

            runIds.Should().HaveCount(1);
        }
        finally
        {
            foreach (HttpResponseMessage response in responses)
            {
                response.Dispose();
            }
        }
    }
}
