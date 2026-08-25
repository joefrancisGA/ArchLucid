using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning;

public sealed class ArchitectureRequestDraftService(
    IAgentCompletionClient completionClient,
    IArchitectureRequestDraftSemanticUniquePass semanticUniquePass,
    IBriefAssumptionEvidenceContradictionPass assumptionEvidenceContradictionPass,
    ILogger<ArchitectureRequestDraftService> logger) : IArchitectureRequestDraftService
{
    private const string DraftSystemPrompt =
        "You are an enterprise architecture intake assistant. " +
        "Given an architecture overview (possibly markdown with sections, tables, ADRs, and evidence), " +
        "extract constraints, required capabilities, assumptions, and a failure-mode/recovery note the reviewer should treat as confirmed facts. " +
        "Produce a JSON object with keys: " +
        "suggestedConstraints (string[]), suggestedCapabilities (string[]), suggestedAssumptions (string[]), " +
        "topologyHints (string[]), securityBaselineHints (string[]), suggestedFailureModeNote (string or null). " +
        "Use those exact key names (not constraints/requiredCapabilities/assumptions). " +
        "suggestedFailureModeNote should be one concise sentence on what breaks first and how operators recover (omit or null when unclear). " +
        "When the text mentions limits, deferrals, ADRs, SLOs, or trust boundaries, each array should contain at least one concise item. " +
        "Each array item must express exactly one distinct fact or obligation — one idea per item. " +
        "Do not include paraphrases of the same fact; keep the more specific wording only. " +
        "Do not restate items already listed in current constraints or current assumptions supplied by the caller. " +
        "Be specific and concise. Return ONLY valid JSON.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IArchitectureRequestDraftSemanticUniquePass _semanticUniquePass = semanticUniquePass
        ?? throw new ArgumentNullException(nameof(semanticUniquePass));

    private readonly IBriefAssumptionEvidenceContradictionPass _assumptionEvidenceContradictionPass =
        assumptionEvidenceContradictionPass
        ?? throw new ArgumentNullException(nameof(assumptionEvidenceContradictionPass));

    private readonly ILogger<ArchitectureRequestDraftService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private const int SlowDraftWarningThresholdMs = 45_000;

    private static readonly EventId DraftCompletedEvent = new(20_401, "ArchitectureRequestDraft.Completed");
    private static readonly EventId DraftSlowEvent = new(20_402, "ArchitectureRequestDraft.Slow");

    public async Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken,
        IArchitectureRequestDraftProgress? progress = null)
    {
        ArgumentNullException.ThrowIfNull(input);

        long totalStartTicks = Stopwatch.GetTimestamp();
        int overviewLength = input.FreeTextDescription.Trim().Length;

        if (string.IsNullOrWhiteSpace(input.FreeTextDescription))
            throw new ArgumentException("FreeTextDescription is required.", nameof(input));

        progress?.ReportStep(AdvisoryDraftOperationSteps.ReadingOverview, 1, AdvisoryDraftOperationSteps.TotalSteps);

        string userPrompt = BuildDraftUserPrompt(input);

        long extractionStartTicks = Stopwatch.GetTimestamp();

        progress?.ReportStep(AdvisoryDraftOperationSteps.Extracting, 2, AdvisoryDraftOperationSteps.TotalSteps);

        string responseJson = await _completionClient.CompleteJsonAsync(
            DraftSystemPrompt,
            userPrompt,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        double extractionMs = Stopwatch.GetElapsedTime(extractionStartTicks).TotalMilliseconds;

        DraftArchitectureRequestResponseShape? response =
            JsonSerializer.Deserialize<DraftArchitectureRequestResponseShape>(responseJson, JsonOptions);

        if (response is null)
            throw new InvalidOperationException("Draft response was empty.");

        string[] normalizedConstraints = Normalize(response.SuggestedConstraints, response.Constraints);
        string[] normalizedAssumptions = Normalize(response.SuggestedAssumptions, response.Assumptions);
        string[] existingConstraints = ArchitectureRequestDraftSemanticUniquePass.NormalizeExact(input.CurrentConstraints);
        string[] existingAssumptions = ArchitectureRequestDraftSemanticUniquePass.NormalizeExact(input.CurrentAssumptions);

        long postProcessStartTicks = Stopwatch.GetTimestamp();

        progress?.ReportStep(AdvisoryDraftOperationSteps.PostProcessing, 3, AdvisoryDraftOperationSteps.TotalSteps);

        Task<string[]> filteredConstraintsTask = _semanticUniquePass.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Constraints,
            existingConstraints,
            normalizedConstraints,
            cancellationToken);

        Task<string[]> filteredAssumptionsTask = _semanticUniquePass.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Assumptions,
            existingAssumptions,
            normalizedAssumptions,
            cancellationToken);

        Task<IReadOnlyList<EvidenceContradictedBriefAssumption>> contradictionsTask =
            _assumptionEvidenceContradictionPass.DetectAsync(
                input.FreeTextDescription,
                input.ConfirmedAssumptions,
                cancellationToken);

        await Task.WhenAll(filteredConstraintsTask, filteredAssumptionsTask, contradictionsTask);

        string[] filteredConstraints = await filteredConstraintsTask;
        string[] filteredAssumptions = await filteredAssumptionsTask;
        IReadOnlyList<EvidenceContradictedBriefAssumption> evidenceContradictedAssumptions =
            await contradictionsTask;

        double postProcessMs = Stopwatch.GetElapsedTime(postProcessStartTicks).TotalMilliseconds;
        double totalMs = Stopwatch.GetElapsedTime(totalStartTicks).TotalMilliseconds;

        progress?.ReportStep(AdvisoryDraftOperationSteps.Completing, 4, AdvisoryDraftOperationSteps.TotalSteps);

        LogDraftTiming(
            overviewLength,
            extractionMs,
            postProcessMs,
            totalMs,
            filteredConstraints.Length,
            filteredAssumptions.Length,
            Normalize(response.SuggestedCapabilities, response.RequiredCapabilities).Length);

        return new DraftArchitectureRequestResponse
        {
            SuggestedConstraints = filteredConstraints,
            SuggestedCapabilities = Normalize(response.SuggestedCapabilities, response.RequiredCapabilities),
            SuggestedAssumptions = filteredAssumptions,
            TopologyHints = Normalize(response.TopologyHints),
            SecurityBaselineHints = Normalize(response.SecurityBaselineHints),
            SuggestedFailureModeNote = NormalizeFailureModeNote(response.SuggestedFailureModeNote, response.FailureModeNote),
            EvidenceContradictedAssumptions = evidenceContradictedAssumptions.ToList(),
        };
    }

    private void LogDraftTiming(
        int overviewLength,
        double extractionMs,
        double postProcessMs,
        double totalMs,
        int constraintCount,
        int assumptionCount,
        int capabilityCount)
    {
        if (!_logger.IsEnabled(LogLevel.Information))
            return;

        _logger.LogInformation(
            DraftCompletedEvent,
            "Architecture request draft completed in {TotalMs:F0}ms (extraction {ExtractionMs:F0}ms, post-process {PostProcessMs:F0}ms) overviewLength={OverviewLength} constraints={ConstraintCount} assumptions={AssumptionCount} capabilities={CapabilityCount}",
            totalMs,
            extractionMs,
            postProcessMs,
            overviewLength,
            constraintCount,
            assumptionCount,
            capabilityCount);

        if (totalMs < SlowDraftWarningThresholdMs)
            return;

        _logger.LogWarning(
            DraftSlowEvent,
            "Architecture request draft exceeded slow threshold ({TotalMs:F0}ms >= {ThresholdMs}ms) overviewLength={OverviewLength}",
            totalMs,
            SlowDraftWarningThresholdMs,
            overviewLength);
    }

    internal static string BuildDraftUserPrompt(DraftArchitectureRequestInput input)
    {
        StringBuilder builder = new();
        builder.AppendLine("Architecture overview:");
        builder.AppendLine(input.FreeTextDescription.Trim());
        builder.AppendLine();
        builder.AppendLine("Current constraints already on the draft (do not restate or paraphrase):");
        AppendListItems(builder, input.CurrentConstraints);
        builder.AppendLine();
        builder.AppendLine("Current assumptions already on the draft (do not restate or paraphrase):");
        AppendListItems(builder, input.CurrentAssumptions);

        return builder.ToString();
    }

    private static void AppendListItems(StringBuilder builder, string[]? items)
    {
        string[] normalized = ArchitectureRequestDraftSemanticUniquePass.NormalizeExact(items ?? []);

        if (normalized.Length == 0)
        {
            builder.AppendLine("(none)");
            return;
        }

        foreach (string item in normalized)
            builder.AppendLine($"- {item}");
    }

    private static string? NormalizeFailureModeNote(params string?[] valueSets)
    {
        foreach (string? value in valueSets)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            return value.Trim();
        }

        return null;
    }

    private static string[] Normalize(params string[]?[] valueSets)
    {
        IEnumerable<string> merged = [];

        foreach (string[]? values in valueSets)
        {
            if (values is null || values.Length == 0)
                continue;

            merged = merged.Concat(values);
        }

        return merged
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private sealed class DraftArchitectureRequestResponseShape
    {
        [JsonPropertyName("suggestedConstraints")]
        public string[]? SuggestedConstraints
        {
            get;
            init;
        }

        [JsonPropertyName("suggestedCapabilities")]
        public string[]? SuggestedCapabilities
        {
            get;
            init;
        }

        [JsonPropertyName("suggestedAssumptions")]
        public string[]? SuggestedAssumptions
        {
            get;
            init;
        }

        // Chat-intake and older prompts sometimes return these alternate key names.
        [JsonPropertyName("constraints")]
        public string[]? Constraints
        {
            get;
            init;
        }

        [JsonPropertyName("requiredCapabilities")]
        public string[]? RequiredCapabilities
        {
            get;
            init;
        }

        [JsonPropertyName("assumptions")]
        public string[]? Assumptions
        {
            get;
            init;
        }

        [JsonPropertyName("topologyHints")]
        public string[]? TopologyHints
        {
            get;
            init;
        }

        [JsonPropertyName("securityBaselineHints")]
        public string[]? SecurityBaselineHints
        {
            get;
            init;
        }

        [JsonPropertyName("suggestedFailureModeNote")]
        public string? SuggestedFailureModeNote
        {
            get;
            init;
        }

        [JsonPropertyName("failureModeNote")]
        public string? FailureModeNote
        {
            get;
            init;
        }
    }
}
