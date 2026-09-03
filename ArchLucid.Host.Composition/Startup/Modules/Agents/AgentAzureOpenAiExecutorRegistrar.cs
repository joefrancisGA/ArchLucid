// Azure OpenAI completion-client agent executor registrations (extracted from AgentExecutionCompositionModule).

using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.AzureOpenAI;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
///     Azure OpenAI completion pipeline, circuit breakers, and tier router for real-mode agent execution.
/// </summary>
internal static partial class AgentAzureOpenAiExecutorRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ILlmCompletionOutputTruncationReporter, AuditLlmCompletionOutputTruncationReporter>();

        FallbackLlmOptions fallbackOpts =
            configuration.GetSection(FallbackLlmOptions.SectionName).Get<FallbackLlmOptions>()
            ?? new FallbackLlmOptions();

        bool fallbackLlmEnabled = fallbackOpts.Enabled;

        if (fallbackLlmEnabled)
            _ = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(fallbackOpts);

        RegisterCircuitBreakers(services, configuration, fallbackLlmEnabled);
        RegisterCompletionClients(services, configuration);
        RegisterScopedCompletionChain(services, configuration, fallbackLlmEnabled);
        RegisterTierRouter(services);
    }
}
