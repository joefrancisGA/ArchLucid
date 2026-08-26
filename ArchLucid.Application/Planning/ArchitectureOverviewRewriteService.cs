using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Conservative architecture-overview rewrite from a human-owned structured brief.
///     Separate from architecture-intelligence closed-loop refine — prose only, no findings.
/// </summary>
public sealed class ArchitectureOverviewRewriteService(
    IAgentCompletionClient completionClient) : IArchitectureOverviewRewriteService
{
    /// <summary>
    ///     Output budget for a full-document overview rewrite. Intake allows 50,000 characters;
    ///     ~4 characters per token plus JSON wrapping still fits in 16,384, the typical Azure OpenAI
    ///     gpt-4o output cap. Passing null would fall back to the host default of 4,096 tokens and
    ///     silently truncate customer overviews.
    /// </summary>
    internal const int RewriteMaxCompletionTokens = 16_384;

    private const string RewriteSystemPrompt =
        "You are an enterprise architecture intake assistant. " +
        "Rewrite the operator's architecture overview so the narrative matches their confirmed structured brief. " +
        "Incorporate confirmed constraints, assumptions, and required capabilities into the prose. " +
        "Strike or clearly qualify any inference the operator denied — do not present denied items as facts. " +
        "Do not add design, topology, services, or controls the operator did not confirm. " +
        "Do not start a review, publish findings, or invent regulation citations. " +
        "Preserve useful structure from the current overview when it still applies. " +
        "Keep comparable length and completeness — do not summarize, omit, or truncate sections unless the operator denied those facts. " +
        "Return the full rewritten overview, not a shorter digest. " +
        "Respond with a single JSON object only (no markdown fences), key: rewrittenOverview (string).";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                  ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<RewriteArchitectureOverviewResponse> RewriteAsync(
        RewriteArchitectureOverviewInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (string.IsNullOrWhiteSpace(input.CurrentOverview))
            throw new ArgumentException("CurrentOverview is required.", nameof(input));

        ArchitectureDraftStructuredBrief brief = input.StructuredBrief ?? new ArchitectureDraftStructuredBrief();
        string userPrompt = BuildUserPrompt(input, brief);

        string responseJson = await _completionClient.CompleteJsonAsync(
            RewriteSystemPrompt,
            userPrompt,
            maxTokens: RewriteMaxCompletionTokens,
            temperature: null,
            cancellationToken: cancellationToken);

        if (string.IsNullOrWhiteSpace(responseJson))
            throw new InvalidOperationException("Rewrite response was empty.");

        string normalizedJson = NormalizeLlmJsonPayload(responseJson);
        RewriteResponseShape? response = JsonSerializer.Deserialize<RewriteResponseShape>(normalizedJson, JsonOptions);

        if (response is null || string.IsNullOrWhiteSpace(response.RewrittenOverview))
            throw new InvalidOperationException("Rewrite response was empty.");

        return new RewriteArchitectureOverviewResponse
        {
            RewrittenOverview = response.RewrittenOverview.Trim(),
        };
    }

    internal static string BuildUserPrompt(RewriteArchitectureOverviewInput input, ArchitectureDraftStructuredBrief brief)
    {
        StringBuilder builder = new();

        string systemName = input.SystemName?.Trim() ?? string.Empty;
        string businessOutcome = input.BusinessOutcome?.Trim() ?? string.Empty;

        if (systemName.Length > 0)
            builder.AppendLine($"System name: {systemName}");

        if (businessOutcome.Length > 0)
            builder.AppendLine($"Business outcome: {businessOutcome}");

        builder.AppendLine();
        builder.AppendLine("Current architecture overview:");
        builder.AppendLine(input.CurrentOverview.Trim());
        builder.AppendLine();

        AppendBriefListSection(builder, "Confirmed constraints", brief.ConfirmedConstraints);
        AppendBriefListSection(builder, "Confirmed assumptions", brief.ConfirmedAssumptions);
        AppendBriefListSection(builder, "Confirmed required capabilities", brief.ConfirmedRequiredCapabilities);
        AppendBriefListSection(builder, "Denied constraints (do not state as facts)", brief.DeniedConstraints);
        AppendBriefListSection(builder, "Denied assumptions (strike or qualify)", brief.DeniedAssumptions);
        AppendBriefListSection(
            builder,
            "Denied required capabilities (do not imply as requirements)",
            brief.DeniedRequiredCapabilities);

        return builder.ToString().TrimEnd();
    }

    private static void AppendBriefListSection(StringBuilder builder, string title, IReadOnlyList<string> items)
    {
        List<string> confirmed = [];

        foreach (string item in items)
        {
            if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(item))
                confirmed.Add(item.Trim());
        }

        if (confirmed.Count == 0)
            return;

        builder.AppendLine($"{title}:");
        foreach (string item in confirmed)
            builder.AppendLine($"- {item}");

        builder.AppendLine();
    }

    internal static string NormalizeLlmJsonPayload(string raw)
    {
        string trimmed = raw.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
            return trimmed;

        int firstNewline = trimmed.IndexOf('\n');

        if (firstNewline < 0)
            return trimmed;

        int contentStart = firstNewline + 1;
        int fenceEnd = trimmed.LastIndexOf("```", StringComparison.Ordinal);

        if (fenceEnd <= contentStart)
            return trimmed;

        return trimmed.Substring(contentStart, fenceEnd - contentStart).Trim();
    }

    private sealed class RewriteResponseShape
    {
        [JsonPropertyName("rewrittenOverview")]
        public string? RewrittenOverview
        {
            get;
            init;
        }
    }
}
