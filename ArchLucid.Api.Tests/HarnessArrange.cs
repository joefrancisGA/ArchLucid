using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>Single entry point for one-verb SQL lifecycle arrange helpers (finalize, governance, replay pair).</summary>
public static class HarnessArrange
{
    public static Task<FinalizedRun> FinalizedAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string scenario,
        string testMethod = "",
        CancellationToken cancellationToken = default) =>
        ArchitectureScenario.FinalizedAsync(client, factory, jsonOptions, scenario, testMethod, cancellationToken);

    public static Task<FinalizedRun> GovernanceCommittedAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string scenario,
        string testMethod = "",
        CancellationToken cancellationToken = default) =>
        GovernanceScenario.CommittedAsync(client, factory, jsonOptions, scenario, testMethod, cancellationToken);

    public static Task<CommittedReplayPair> CommittedPairAsync(
        ReplaySession replay,
        string scenario,
        string testMethod = "") =>
        ArchitectureScenario.CommittedPairAsync(replay, scenario, testMethod);
}
