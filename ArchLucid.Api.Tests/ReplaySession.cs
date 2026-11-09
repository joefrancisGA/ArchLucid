using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Bundles client, factory, and JSON options for the comparison-replay golden path so tests do not pass those three in lockstep.
/// </summary>
public sealed class ReplaySession
{
    private static readonly JsonSerializerOptions ReplayBodyJson = new(JsonSerializerDefaults.Web);

    private ReplaySession(ArchLucidApiFactory factory, HttpClient client, JsonSerializerOptions jsonOptions)
    {
        Factory = factory;
        Client = client;
        JsonOptions = jsonOptions;
    }

    public ArchLucidApiFactory Factory { get; }

    public HttpClient Client { get; }

    public JsonSerializerOptions JsonOptions { get; }

    /// <summary>Unique manifest label for replay commit (parallel suites on a shared DB).</summary>
    public static string NewReplayCommittedManifestVersion() => $"v1r{Guid.NewGuid():N}";

    /// <summary>Uses an existing scoped client (e.g. from <see cref="IntegrationTestBase" />).</summary>
    public static ReplaySession From(ArchLucidApiFactory factory, HttpClient client, JsonSerializerOptions jsonOptions) =>
        new(factory, client, jsonOptions);

    /// <summary>Creates a scoped client the same way <see cref="IntegrationTestBase" /> does.</summary>
    public static async Task<ReplaySession> OpenAsync(ArchLucidApiFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        HttpClient client = await factory.CreateBoundedClientAsync().ConfigureAwait(false);
        WireDefaultSqlIntegrationScopeHeaders(client);
        await IntegrationTestWorkspaceModeSupport.PinGuidedWorkspaceModeForDevUserAsync(factory).ConfigureAwait(false);

        return new ReplaySession(factory, client, IntegrationTestBase.CreateApiJsonOptions());
    }

    public static void WireDefaultSqlIntegrationScopeHeaders(HttpClient client) =>
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

    public async Task<string> CreateAndExecuteAsync(string requestId = "REQ-FIXTURE-001")
    {
        string runId = await IntegrationTestRunLifecycleSupport
            .CreateArchitectureRunForTestAsync(Client, JsonOptions, requestId)
            .ConfigureAwait(false);
        await Client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(Factory, runId).ConfigureAwait(false);

        return runId;
    }

    public async Task<(string RunId, string ReplayRunId)> CommitAndReplayAsync(string requestId = "REQ-FIXTURE-001")
    {
        string runId = await CreateAndExecuteAsync(requestId).ConfigureAwait(false);
        HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId).ConfigureAwait(false);
        await commitResponse.EnsureSuccessForTestAsync().ConfigureAwait(false);

        HttpResponseMessage replayResponse = await Client.PostAsync(
            IntegrationTestRunLifecycleSupport.ReplayReviewRelativeUrl(runId),
            JsonContent(new
            {
                commitReplay = true,
                executionMode = "Current",
                manifestVersionOverride = NewReplayCommittedManifestVersion()
            })).ConfigureAwait(false);
        await replayResponse.EnsureSuccessForTestAsync().ConfigureAwait(false);
        ReplayRunResponseDto? replayPayload =
            await replayResponse.Content.ReadFromJsonAsync<ReplayRunResponseDto>(JsonOptions).ConfigureAwait(false);

        return (runId, replayPayload!.ReplayRunId);
    }

    public async Task<string> PersistEndToEndComparisonAsync(string leftRunId, string rightRunId)
    {
        HttpResponseMessage persist = await Client.PostAsync(
            $"/v1/architecture/review/compare/end-to-end/summary?leftRunId={Uri.EscapeDataString(leftRunId)}&rightRunId={Uri.EscapeDataString(rightRunId)}",
            new StringContent("""{"persist":true}""", Encoding.UTF8, "application/json")).ConfigureAwait(false);
        await persist.EnsureSuccessForTestAsync().ConfigureAwait(false);

        if (!persist.Headers.TryGetValues("X-ArchLucid-ComparisonRecordId", out IEnumerable<string>? values))
            throw new InvalidOperationException("X-ArchLucid-ComparisonRecordId header missing.");

        string? comparisonRecordId = values.FirstOrDefault();

        if (string.IsNullOrEmpty(comparisonRecordId))
            throw new InvalidOperationException("X-ArchLucid-ComparisonRecordId header missing.");

        return comparisonRecordId;
    }

    private static StringContent JsonContent(object value) =>
        new(JsonSerializer.Serialize(value, ReplayBodyJson), Encoding.UTF8, "application/json");
}
