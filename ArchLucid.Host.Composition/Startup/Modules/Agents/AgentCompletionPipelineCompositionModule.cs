// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// Public entry points for agent completion pipeline variants.
/// </summary>
public static class AgentCompletionPipelineCompositionModule
{
    public static void RegisterEchoPipeline(IServiceCollection services)
    {
        EchoAgentCompletionPipelineRegistrar.RegisterEchoAgentCompletionPipeline(services);
    }

    public static void RegisterFakeClient(IServiceCollection services)
    {
        FakeAgentCompletionPipelineRegistrar.RegisterFakeAgentCompletionClient(services);
    }

    public static void RegisterSchemaRemediationClient(IServiceCollection services, bool useAzureOpenAi)
    {
        SchemaRemediationCompletionRegistrar.RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi);
    }

    public static void ConfigureLlmTelemetryLabels(
        IServiceCollection services,
        IConfiguration configuration,
        string? agentMode,
        bool useAzureOpenAi,
        bool useEchoClient)
    {
        AgentLlmTelemetryRegistrar.ConfigureLlmTelemetryLabels(
            services,
            configuration,
            agentMode,
            useAzureOpenAi,
            useEchoClient);
    }
}
