using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>Builds optional board-pack sponsor narrative from ROI summary JSON (TB-241).</summary>
public sealed class SponsorRoiBoardPackNarrativeBuilder(
    IAgentCompletionClient completionClient,
    ILogger<SponsorRoiBoardPackNarrativeBuilder> logger)
{
    private const string SystemPrompt =
        "You are an enterprise architecture advisor writing a 4-sentence sponsor report for a board pack. "
        + "Be concrete. Do not round up claims. Use the exact numbers provided.";

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<SponsorRoiBoardPackNarrativeBuilder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<string?> TryBuildNarrativeAsync(SponsorRoiSummaryResponse summary, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);

        string topCategory = summary.TopSystemicIssues.Count > 0
            ? summary.TopSystemicIssues[0].Category
            : "none";

        object payload = new
        {
            totalSavingsUsd = summary.TotalEstimatedUsdSavings,
            systemCount = summary.SystemCount,
            topFindingCategory = topCategory,
            resolvedFindingsCount30Days = summary.ResolvedFindingsCount30Days,
            confidenceLabel = summary.SavingsPricingBasis,
        };

        string userPrompt = "Board-pack metrics JSON:\n" + JsonSerializer.Serialize(payload);

        try
        {
            string narrative = await _completionClient
                .CompleteJsonAsync(SystemPrompt, userPrompt, 400, null, cancellationToken)
                .ConfigureAwait(false);

            return string.IsNullOrWhiteSpace(narrative) ? null : narrative.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Board-pack sponsor narrative generation failed; exporting structural content only.");

            return null;
        }
    }

    public static string PrefixMarkdown(string markdown, string? narrative)
    {
        ArgumentNullException.ThrowIfNull(markdown);

        if (string.IsNullOrWhiteSpace(narrative))
            return markdown;

        return "## Sponsor report\n\n" + narrative.Trim() + "\n\n" + markdown;
    }
}
