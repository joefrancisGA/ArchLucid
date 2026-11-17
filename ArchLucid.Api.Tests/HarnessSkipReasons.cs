namespace ArchLucid.Api.Tests;

/// <summary>Stable skip messages for SQL integration tests (grep-friendly in CI).</summary>
public static class HarnessSkipReasons
{
    public const string ShardOverload = "greenfield SQL shard overload or transient 503 during warmup";

    public const string AuthorityPipelineCompleteOnCreate =
        "authority-pipeline complete on create; execute idempotency test not applicable";

    public const string AuthorityPipelineCompleteOnCreatePilot =
        "authority-pipeline complete on create; pilot execute audit test not applicable";
}
