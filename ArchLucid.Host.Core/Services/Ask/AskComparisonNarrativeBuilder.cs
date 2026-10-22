using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Ask;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Ask;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Generates optional comparison narrative prose for two-run Ask requests.</summary>
public sealed class AskComparisonNarrativeBuilder(
    IAgentCompletionClient llm,
    IOptionsMonitor<AskComparisonNarrativeOptions> askComparisonNarrativeOptions,
    ILogger<AskComparisonNarrativeBuilder> logger)
{
    private const string ComparisonNarrativeSystemPrompt =
        "You are an enterprise architect. Given the delta between two architecture runs, write a 3–5 sentence narrative: "
        + "(1) the most significant improvement, (2) any new risk introduced, (3) whether the architecture is net-better or net-worse. "
        + "Return ONLY the narrative prose.";

    private readonly IAgentCompletionClient _llm =
        llm ?? throw new ArgumentNullException(nameof(llm));

    private readonly IOptionsMonitor<AskComparisonNarrativeOptions> _askComparisonNarrativeOptions =
        askComparisonNarrativeOptions ?? throw new ArgumentNullException(nameof(askComparisonNarrativeOptions));

    private readonly ILogger<AskComparisonNarrativeBuilder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<string?> TryBuildAsync(AskPreparedContext prepared, CancellationToken cancellationToken)
    {
        if (!_askComparisonNarrativeOptions.CurrentValue.GenerateComparisonNarrative)
            return null;

        if (!prepared.BaseRunId.HasValue || !prepared.TargetRunId.HasValue || prepared.ComparisonResult is null)
            return null;

        ComparisonNarrativeSummaryBuilder.ComparisonNarrativeSummary summary =
            ComparisonNarrativeSummaryBuilder.Build(prepared.ComparisonResult);

        if (summary.TotalDeltaCount <= 0)
            return null;

        string userPrompt =
            "Structured comparison delta JSON:\n" +
            JsonSerializer.Serialize(summary, ContractJson.CamelCaseIgnoreNullCompact);

        try
        {
            string narrative = await _llm.CompleteJsonAsync(
                ComparisonNarrativeSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: cancellationToken);

            return string.IsNullOrWhiteSpace(narrative) ? null : narrative.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Comparison narrative generation failed (ThreadId={ThreadId}).",
                LogSanitizer.Sanitize(prepared.Thread.ThreadId.ToString()));

            return null;
        }
    }
}
