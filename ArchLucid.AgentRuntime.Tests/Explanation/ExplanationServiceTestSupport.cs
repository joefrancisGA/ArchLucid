using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.AgentRuntime.Explanation.Stages;
using ArchLucid.Decisioning.Validation;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Explanation;

internal static class ExplanationServiceTestSupport
{
    internal static ExplanationService Create(
        IAgentCompletionClient completionClient,
        IDeterministicExplanationService? deterministic = null,
        IOptions<ExplanationServiceOptions>? explanationOptions = null,
        ISchemaValidationService? schemaValidation = null,
        ILogger<ExplanationLlmNarrativeStage>? llmLogger = null)
    {
        deterministic ??= new DeterministicExplanationService(
            NullLogger<DeterministicExplanationService>.Instance);
        explanationOptions ??= Options.Create(new ExplanationServiceOptions());
        schemaValidation ??= new PassthroughSchemaValidationService();
        llmLogger ??= NullLogger<ExplanationLlmNarrativeStage>.Instance;

        IExplanationSignalStage signalStage = new ExplanationSignalStage(deterministic);
        IExplanationLlmNarrativeStage llmNarrativeStage = new ExplanationLlmNarrativeStage(
            completionClient,
            explanationOptions,
            schemaValidation,
            llmLogger);
        IExplanationFallbackStage fallbackStage = new ExplanationFallbackStage(
            deterministic,
            completionClient,
            explanationOptions);

        return new ExplanationService(signalStage, llmNarrativeStage, fallbackStage);
    }
}
