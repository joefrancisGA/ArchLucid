namespace ArchLucid.Api.Tests;

/// <summary>
///     Serializes tests that mutate process environment variables and long-running boots (same host process singletons).
/// </summary>
[CollectionDefinition("ArchLucidEnvMutation", DisableParallelization = true)]
public sealed class ArchLucidEnvMutationCollectionDefinition;
