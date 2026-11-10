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

        HttpClient client = await IntegrationTestSqlClientBootstrap
            .CreateSqlIntegrationClientAsync(factory)
            .ConfigureAwait(false);

        return new ReplaySession(factory, client, IntegrationTestBase.CreateApiJsonOptions());
    }

    public async Task<string> CreateAndExecuteAsync(string requestId)
    {
        string runId = await IntegrationTestRunLifecycleSupport
            .CreateArchitectureRunForTestAsync(Client, JsonOptions, requestId)
            .ConfigureAwait(false);
        await Client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(Factory, runId).ConfigureAwait(false);

        return runId;
    }

    /// <summary>Create → execute → finalize via the shared lifecycle harness.</summary>
    public Task<FinalizedRun> CreateFinalizedAsync(string requestId) =>
        IntegrationTestRunLifecycleSupport.CreateFinalizedRunForTestAsync(Client, Factory, JsonOptions, requestId);

    /// <summary>Finalize + commit-replay in one call (preferred comparison arrange).</summary>
    public Task<CommittedReplayPair> OpenCommittedPairAsync(string requestId) =>
        CommitAndReplayAsync(requestId);

    public async Task<string> ReplayWithoutCommitAsync(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(
            Factory,
            runId,
            commitReplay: false,
            manifestVersionOverride: null).ConfigureAwait(false);
        ReplayRunResponseDto replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions).ConfigureAwait(false);

        return replayPayload.ReplayRunId;
    }

    /// <summary>Commit-replay with an explicit manifest version (manifest compare tests).</summary>
    public async Task<string> CommitReplayManifestVersionAsync(string runId, string manifestVersionOverride)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersionOverride);

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(
            Factory,
            runId,
            commitReplay: true,
            manifestVersionOverride: manifestVersionOverride).ConfigureAwait(false);
        ReplayRunResponseDto replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions).ConfigureAwait(false);

        return replayPayload.Manifest!.Metadata.ManifestVersion;
    }

    public async Task<CommittedReplayPair> CommitAndReplayAsync(string requestId)
    {
        FinalizedRun finalized = await CreateFinalizedAsync(requestId).ConfigureAwait(false);
        string runId = finalized.RunId;

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(
            Factory,
            runId,
            commitReplay: true,
            manifestVersionOverride: NewReplayCommittedManifestVersion()).ConfigureAwait(false);
        ReplayRunResponseDto replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions).ConfigureAwait(false);

        return new CommittedReplayPair(runId, replayPayload.ReplayRunId);
    }

    public Task<PersistedComparison> PersistEndToEndComparisonAsync(string leftRunId, string rightRunId) =>
        Client.PostPersistEndToEndComparisonForTestAsync(leftRunId, rightRunId);
}
