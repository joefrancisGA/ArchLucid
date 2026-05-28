using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Golden end-to-end correctness fixture for the V1 core pilot path: request → execute → commit →
///     sponsor artifacts → audit/traceability exports. Asserts stable semantics, not wall-clock or generated prose.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class CorePilotPathGoldenCorrectnessIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    [SkippableFact]
    public async Task Core_pilot_path_matches_golden_semantics_fixture()
    {
        CorePilotPathExpectedSemantics expected = LoadExpectedSemantics();

        await using ArchLucidApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        HttpResponseMessage createResponse = await client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest(expected.RequestId)));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        created.Should().NotBeNull();
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await client.PostAsync($"/v1/architecture/run/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage commitResponse = await client.PostAsync($"/v1/architecture/run/{runId}/commit", null);
        commitResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage reportResponse = await client.GetAsync($"/v1/pilots/runs/{runId}/first-value-report");
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string markdown = await reportResponse.Content.ReadAsStringAsync();

        foreach (string phrase in expected.RequiredFirstValueReportPhrases)
        {
            markdown.Should().Contain(phrase, because: "first-value report must retain sponsor-safe headings");
        }

        foreach (string forbiddenPhrase in expected.ForbiddenBuyerSafeArtifactPhrases)
        {
            markdown.Should().NotContain(
                forbiddenPhrase,
                because: "buyer-safe sponsor artifacts must not expose raw prompts, completions, or secrets");
        }

        HttpResponseMessage deltasResponse = await client.GetAsync($"/v1/pilots/runs/{runId}/pilot-run-deltas");
        deltasResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string deltasJson = await deltasResponse.Content.ReadAsStringAsync();
        using JsonDocument deltasDoc = JsonDocument.Parse(deltasJson);
        JsonElement deltasRoot = deltasDoc.RootElement;

        JsonElement proof = deltasRoot.GetProperty("proofPackageCompleteness");

        foreach (KeyValuePair<string, JsonElement> required in expected.RequiredProofPackageFields)
        {
            proof.GetProperty(required.Key).GetBoolean().Should().Be(required.Value.GetBoolean(),
                because: $"proofPackageCompleteness.{required.Key} is part of the golden pilot contract");
        }

        int severityTotal = 0;

        if (deltasRoot.TryGetProperty("findingsBySeverity", out JsonElement severityRows)
            && severityRows.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement row in severityRows.EnumerateArray())
            {
                if (row.TryGetProperty("count", out JsonElement countElement))
                    severityTotal += countElement.GetInt32();
            }
        }

        severityTotal.Should().BeGreaterThanOrEqualTo(expected.MinimumFindingsBySeverityTotal);

        HttpResponseMessage zipResponse =
            await client.GetAsync($"/v1/architecture/run/{runId}/traceability-bundle.zip");
        zipResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        IReadOnlyList<string> zipNames = ReadZipEntryNames(await zipResponse.Content.ReadAsByteArrayAsync());

        foreach (string prefix in expected.RequiredTraceabilityZipEntryPrefixes)
        {
            zipNames.Should().Contain(name => name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase),
                because: $"traceability bundle must include an entry starting with '{prefix}'");
        }

        HttpResponseMessage auditResponse = await client.GetAsync("/v1/audit?take=25");
        auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        string auditJson = await auditResponse.Content.ReadAsStringAsync();
        auditJson.Should().NotBeNullOrWhiteSpace();
    }

    private static CorePilotPathExpectedSemantics LoadExpectedSemantics()
    {
        string path = Path.Combine(AppContext.BaseDirectory, "fixtures", "core-pilot-path", "expected-semantics.json");
        File.Exists(path).Should().BeTrue($"golden fixture missing at {path}");

        string json = File.ReadAllText(path);
        CorePilotPathExpectedSemantics? expected =
            JsonSerializer.Deserialize<CorePilotPathExpectedSemantics>(json, JsonOptions);

        expected.Should().NotBeNull();

        return expected!;
    }

    private static StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private static IReadOnlyList<string> ReadZipEntryNames(byte[] zipBytes)
    {
        using MemoryStream ms = new(zipBytes);
        using ZipArchive zip = new(ms, ZipArchiveMode.Read, false);

        return zip.Entries
            .Select(static e => e.FullName)
            .Order(StringComparer.Ordinal)
            .ToList();
    }

    private sealed class CorePilotPathExpectedSemantics
    {
        public string RequestId { get; set; } = string.Empty;

        public string[] RequiredFirstValueReportPhrases { get; set; } = [];

        public string[] ForbiddenBuyerSafeArtifactPhrases { get; set; } = [];

        public Dictionary<string, JsonElement> RequiredProofPackageFields { get; set; } = new();

        public int MinimumFindingsBySeverityTotal { get; set; }

        public string[] RequiredTraceabilityZipEntryPrefixes { get; set; } = [];
    }
}
