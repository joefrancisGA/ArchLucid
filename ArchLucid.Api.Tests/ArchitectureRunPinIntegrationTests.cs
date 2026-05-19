using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class ArchitectureRunPinIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) }
    };

    [SkippableFact]
    public async Task PinRun_toggle_and_explicit_set_persist_on_summary()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PIN-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created!.Run!.RunId!;

        HttpResponseMessage firstPin = await Client.PatchAsync(
            $"/v1/architecture/run/{runId}/pin",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        firstPin.StatusCode.Should().Be(HttpStatusCode.OK);
        PinRunResponse? firstPayload = await firstPin.Content.ReadFromJsonAsync<PinRunResponse>(JsonOptions);
        firstPayload.Should().NotBeNull();
        firstPayload!.IsPinned.Should().BeTrue();

        HttpResponseMessage summaryAfterPin = await Client.GetAsync($"/v1/authority/runs/{runId}/summary");
        await summaryAfterPin.EnsureSuccessForTestAsync();
        RunSummaryResponse? summary = await summaryAfterPin.Content.ReadFromJsonAsync<RunSummaryResponse>(JsonOptions);
        summary.Should().NotBeNull();
        summary!.IsPinned.Should().BeTrue();

        HttpResponseMessage unpin = await Client.PatchAsync(
            $"/v1/architecture/run/{runId}/pin",
            JsonContent(new { isPinned = false }));

        unpin.StatusCode.Should().Be(HttpStatusCode.OK);
        PinRunResponse? unpinPayload = await unpin.Content.ReadFromJsonAsync<PinRunResponse>(JsonOptions);
        unpinPayload.Should().NotBeNull();
        unpinPayload!.IsPinned.Should().BeFalse();
    }

    private static StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
