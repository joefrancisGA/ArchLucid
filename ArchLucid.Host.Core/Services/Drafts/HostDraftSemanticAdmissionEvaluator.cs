using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Services.Drafts;

/// <inheritdoc cref="IDraftSemanticAdmissionEvaluator" />
public sealed class HostDraftSemanticAdmissionEvaluator(
    IAgentCompletionClient completionClient,
    IOptionsMonitor<DraftSemanticAdmissionOptions> optionsMonitor,
    ILogger<HostDraftSemanticAdmissionEvaluator> logger) : IDraftSemanticAdmissionEvaluator
{
    private const string AdmissionSystemPrompt =
        "You classify whether free-text input is a designable software architecture request. "
        + "Respond with a single JSON object only (no markdown fences). "
        + "Keys: disposition (admitted|redirect|non_architecture), reason (string, required when not admitted). "
        + "Use admitted when the text describes systems, components, constraints, or architecture decisions. "
        + "Use non_architecture for unrelated topics (recipes, HR, general chat). "
        + "Use redirect when architecture-adjacent but too vague to design.";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IOptionsMonitor<DraftSemanticAdmissionOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<HostDraftSemanticAdmissionEvaluator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<DraftSemanticAdmissionEvaluation> EvaluateAsync(
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        DraftSemanticAdmissionOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
        {
            return DraftAdmissionDomainHeuristic.Evaluate(document);
        }

        string intent = document.FreeTextIntent?.Trim() ?? string.Empty;
        string outcome = document.BusinessOutcome?.Trim() ?? string.Empty;
        string userPrompt =
            $"Intent:\n{intent}\n\nBusiness outcome:\n{outcome}\n\nActor count: {document.ActorSet.Actors.Count}";

        try
        {
            string raw = await _completionClient.CompleteJsonAsync(
                AdmissionSystemPrompt,
                userPrompt,
                maxTokens: null,
                cancellationToken: cancellationToken);

            AdmissionShape? parsed = JsonSerializer.Deserialize<AdmissionShape>(raw, JsonRead);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.Disposition))
            {
                return ResolveEvaluatorUnavailable(options);
            }

            return MapDisposition(parsed.Disposition.Trim(), parsed.Reason?.Trim());
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Draft semantic admission evaluator failed; applying fail-open policy.");

            return ResolveEvaluatorUnavailable(options);
        }
    }

    private static DraftSemanticAdmissionEvaluation ResolveEvaluatorUnavailable(DraftSemanticAdmissionOptions options)
    {
        if (options.FailOpenOnEvaluatorUnavailable)
        {
            return new DraftSemanticAdmissionEvaluation
            {
                Disposition = DraftSemanticAdmissionDispositionKind.EvaluatorUnavailable,
            };
        }

        return new DraftSemanticAdmissionEvaluation
        {
            Disposition = DraftSemanticAdmissionDispositionKind.Redirect,
            RedirectReason =
                "Semantic admission is temporarily unavailable. Add more architecture context or retry shortly.",
        };
    }

    private static DraftSemanticAdmissionEvaluation MapDisposition(string disposition, string? reason)
    {
        if (string.Equals(disposition, "admitted", StringComparison.OrdinalIgnoreCase))
        {
            return new DraftSemanticAdmissionEvaluation
            {
                Disposition = DraftSemanticAdmissionDispositionKind.Admitted,
            };
        }

        if (string.Equals(disposition, "non_architecture", StringComparison.OrdinalIgnoreCase))
        {
            return new DraftSemanticAdmissionEvaluation
            {
                Disposition = DraftSemanticAdmissionDispositionKind.NonArchitecture,
                RedirectReason = string.IsNullOrWhiteSpace(reason)
                    ? "REJECT-AS-WRITTEN: The request does not appear to be a software architecture request."
                    : reason,
            };
        }

        return new DraftSemanticAdmissionEvaluation
        {
            Disposition = DraftSemanticAdmissionDispositionKind.Redirect,
            RedirectReason = string.IsNullOrWhiteSpace(reason)
                ? "I need more architecture context before this draft can be admitted."
                : reason,
        };
    }

    private sealed class AdmissionShape
    {
        [JsonPropertyName("disposition")]
        public string? Disposition
        {
            get;
            init;
        }

        [JsonPropertyName("reason")]
        public string? Reason
        {
            get;
            init;
        }
    }
}
