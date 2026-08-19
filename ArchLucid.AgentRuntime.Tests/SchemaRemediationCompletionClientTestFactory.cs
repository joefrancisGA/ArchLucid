namespace ArchLucid.AgentRuntime.Tests;

/// <summary>Wraps a stub completion client for handler tests requiring <see cref="ISchemaRemediationAgentCompletionClient" />.</summary>
public static class SchemaRemediationCompletionClientTestFactory
{
    public static ISchemaRemediationAgentCompletionClient Create(IAgentCompletionClient inner) =>
        new SchemaRemediationAgentCompletionClientAdapter(inner);
}
