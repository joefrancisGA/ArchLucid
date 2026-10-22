using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Template-only reasoning blurb: severity, decision rule, top evidence, recommendation snippet, risk category.
/// </summary>
public sealed class ReasoningSummaryBuilder : IReasoningSummaryBuilder
{
    private const int MaxEvidenceSummaryChars = 280;

    private static readonly JsonSerializerOptions FindingJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <inheritdoc />
    public string? TryBuild(FindingInspectResponse inspect)
    {
        ArgumentNullException.ThrowIfNull(inspect);

        string? decisionRuleSummary = ResolveDecisionRuleSummary(inspect);

        if (string.IsNullOrWhiteSpace(decisionRuleSummary))
            return null;

        string? evidenceSummary = ResolveTopEvidenceSummary(inspect.Evidence);

        if (string.IsNullOrWhiteSpace(evidenceSummary))
            return null;

        ArchitectureFinding? typedFinding = TryDeserializeFinding(inspect.TypedPayload);

        string? recommendationSource = ResolveRecommendationSource(inspect, typedFinding);
        string? recommendationSentence = FirstSentence(recommendationSource);

        if (string.IsNullOrWhiteSpace(recommendationSentence))
            return null;

        string riskCategory = ResolveRiskCategory(typedFinding);

        string severityWord = HumanizeSeverity(inspect.Severity);

        return
            $"This {severityWord} finding was triggered because {decisionRuleSummary.Trim()}. "
            + $"The evidence shows {evidenceSummary.Trim()}. "
            + $"The recommendation to {recommendationSentence.Trim()} addresses {riskCategory.Trim()}.";
    }

    private static string? ResolveDecisionRuleSummary(FindingInspectResponse inspect)
    {
        string? name = inspect.DecisionRuleName?.Trim();
        string? id = inspect.DecisionRuleId?.Trim();

        if (!string.IsNullOrWhiteSpace(name))
            return name;

        return !string.IsNullOrWhiteSpace(id) ? $"rule '{id}' applied" : null;
    }

    private static string? ResolveTopEvidenceSummary(IReadOnlyList<FindingInspectEvidenceItem> evidence)
    {
        foreach (FindingInspectEvidenceItem item in evidence)
        {
            string? excerpt = item.Excerpt?.Trim();

            if (!string.IsNullOrWhiteSpace(excerpt))
                return ClampEvidenceText(excerpt);

            string? artifact = item.ArtifactId?.Trim();

            if (!string.IsNullOrWhiteSpace(artifact))
                return $"artifact reference {artifact}";
        }

        return null;
    }

    private static string ClampEvidenceText(string excerpt)
    {
        if (excerpt.Length <= MaxEvidenceSummaryChars)
            return excerpt;

        StringBuilder b = new(MaxEvidenceSummaryChars + 1);
        b.Append(excerpt.AsSpan(0, MaxEvidenceSummaryChars - 1));
        b.Append('…');

        return b.ToString();
    }

    private static ArchitectureFinding? TryDeserializeFinding(JsonElement? typedPayload)
    {
        if (!typedPayload.HasValue)
            return null;

        JsonElement element = typedPayload.Value;

        if (element.ValueKind != JsonValueKind.Object)
            return null;

        try
        {
            return element.Deserialize<ArchitectureFinding>(FindingJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? ResolveRecommendationSource(FindingInspectResponse inspect, ArchitectureFinding? typedFinding)
    {
        foreach (string action in inspect.RecommendedActions)
        {
            if (!string.IsNullOrWhiteSpace(action))
                return action.Trim();
        }

        if (typedFinding is null)
            return null;

        string message = typedFinding.Message.Trim();

        return message.Length > 0 ? message : null;
    }

    private static string? FirstSentence(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        ReadOnlySpan<char> t = text.AsSpan().Trim();
        int cut = -1;

        for (int i = 0; i < t.Length; i++)
        {
            char c = t[i];

            if (c != '.' && c != '!' && c != '?')
                continue;

            // Skip ellipsis and decimal fragments: simple rule — end sentence only if followed by space or end.
            if (i + 1 < t.Length && t[i + 1] != ' ' && t[i + 1] != '\t' && t[i + 1] != '\n' && t[i + 1] != '\r')
                continue;

            cut = i;
            break;
        }

        ReadOnlySpan<char> sentence = cut < 0 ? t : t[..(cut + 1)];

        string trimmed = sentence.ToString().Trim();

        return trimmed.Length > 0 ? trimmed : null;
    }

    /// <summary>Prefer persisted <see cref="ArchitectureFinding.Category" />; otherwise a deterministic generic phrase.</summary>
    private static string ResolveRiskCategory(ArchitectureFinding? typedFinding)
    {
        if (typedFinding is null)
            return "the assessed architecture risk";

        string raw = typedFinding.Category.Trim();

        return raw.Length > 0 ? raw : "the assessed architecture risk";
    }

    private static string HumanizeSeverity(FindingSeverity severity) => severity switch
    {
        FindingSeverity.Info => "informational",
        FindingSeverity.Warning => "warning",
        FindingSeverity.Error => "error",
        FindingSeverity.Critical => "critical",
        _ => "informational",
    };
}
