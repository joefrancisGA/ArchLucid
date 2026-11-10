using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>One-verb arrange helpers for governance integration tests.</summary>
public static class GovernanceScenario
{
    /// <summary>Create → execute → finalize (committed manifest) using a parallel-safe request id.</summary>
    public static Task<FinalizedRun> CommittedAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string scenario,
        string testMethod = "",
        CancellationToken cancellationToken = default) =>
        ArchitectureScenario.FinalizedAsync(client, factory, jsonOptions, scenario, testMethod, cancellationToken);
}
