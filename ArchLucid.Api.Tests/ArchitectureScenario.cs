using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>One-verb arrange helpers for SQL lifecycle integration tests.</summary>
public static class ArchitectureScenario
{
    public static Task<FinalizedRun> FinalizedAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string scenario,
        string testMethod = "",
        CancellationToken cancellationToken = default) =>
        IntegrationTestRunLifecycleSupport.CreateFinalizedRunForTestAsync(
            client,
            factory,
            jsonOptions,
            TestRequestIds.ForScenario(scenario, testMethod),
            cancellationToken);

    public static Task<CommittedReplayPair> CommittedPairAsync(
        ReplaySession replay,
        string scenario,
        string testMethod = "") =>
        replay.OpenCommittedPairAsync(TestRequestIds.ForScenario(scenario, testMethod));
}
