using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Bundles client, factory, and JSON options for the comparison-replay golden path so tests do not pass those three in lockstep.
/// </summary>
public sealed class ReplaySession
{
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

    /// <summary>Create → execute → finalize via the shared lifecycle harness.</summary>
    public Task<FinalizedRun> CreateFinalizedAsync(string requestId = "REQ-FIXTURE-001") =>
        IntegrationTestRunLifecycleSupport.CreateFinalizedRunForTestAsync(Client, Factory, JsonOptions, requestId);

    public async Task<CommittedReplayPair> CommitAndReplayAsync(string requestId = "REQ-FIXTURE-001")
    {
        FinalizedRun finalized = await CreateFinalizedAsync(requestId).ConfigureAwait(false);
        string runId = finalized.RunId;

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(
            Factory,
            runId,
            commitReplay: true,
            manifestVersionOverride: NewReplayCommittedManifestVersion()).ConfigureAwait(false);
        await replayResponse.EnsureSuccessForTestAsync().ConfigureAwait(false);
        ReplayRunResponseDto? replayPayload =
            await replayResponse.Content.ReadFromJsonAsync<ReplayRunResponseDto>(JsonOptions).ConfigureAwait(false);

        return new CommittedReplayPair(runId, replayPayload!.ReplayRunId);
    }

    public Task<string> PersistEndToEndComparisonAsync(string leftRunId, string rightRunId) =>
        Client.PostPersistEndToEndComparisonForTestAsync(leftRunId, rightRunId);
}
