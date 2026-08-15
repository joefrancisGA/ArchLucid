using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Reads stated RTO and cost constraints from L0 framing before model inference (TB-2339 item 42).</summary>
internal static class ArchitectureFramingConstraintReader
{
    internal static int? GetStatedRtoMinutes(ArchitectureKnowledgeModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        int? fromFraming = ParseRtoFromFramingAnswers(model.FramingAnswers);

        if (fromFraming is not null)
        {
            return fromFraming;
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.Kind is not ArchitectureElementKind.RecoveryObjective
                and not ArchitectureElementKind.Constraint)
            {
                continue;
            }

            int? fromElement = SpecialistReviewModelAdequacy.TryParseRtoMinutes(
                BuildElementText(element));

            if (fromElement is not null)
            {
                return fromElement;
            }
        }

        return SpecialistReviewModelAdequacy.TryParseRtoMinutes(
            SpecialistReviewModelTextSignals.CollectSearchText(model));
    }

    internal static decimal? GetStatedMonthlyCostCeilingUsd(ArchitectureKnowledgeModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        decimal? fromFraming = ParseCostCeilingFromFramingAnswers(model.FramingAnswers);

        if (fromFraming is not null)
        {
            return fromFraming;
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.Kind is not ArchitectureElementKind.Constraint
                and not ArchitectureElementKind.CostDriver)
            {
                continue;
            }

            decimal? fromElement = SpecialistReviewModelAdequacy.TryParseMonthlyCostCeilingUsd(
                BuildElementText(element));

            if (fromElement is not null)
            {
                return fromElement;
            }
        }

        return SpecialistReviewModelAdequacy.TryParseMonthlyCostCeilingUsd(
            SpecialistReviewModelTextSignals.CollectSearchText(model));
    }

    private static int? ParseRtoFromFramingAnswers(Dictionary<string, string> framingAnswers)
    {
        foreach (KeyValuePair<string, string> pair in framingAnswers)
        {
            if (!IsRecoveryFramingKey(pair.Key))
            {
                continue;
            }

            int? parsed = SpecialistReviewModelAdequacy.TryParseRtoMinutes(pair.Value);

            if (parsed is not null)
            {
                return parsed;
            }
        }

        return null;
    }

    private static decimal? ParseCostCeilingFromFramingAnswers(Dictionary<string, string> framingAnswers)
    {
        foreach (KeyValuePair<string, string> pair in framingAnswers)
        {
            if (!IsCostFramingKey(pair.Key))
            {
                continue;
            }

            decimal? parsed = SpecialistReviewModelAdequacy.TryParseMonthlyCostCeilingUsd(pair.Value);

            if (parsed is not null)
            {
                return parsed;
            }
        }

        return null;
    }

    private static bool IsRecoveryFramingKey(string key)
    {
        return key.Contains("recovery", StringComparison.OrdinalIgnoreCase)
            || key.Contains("rto", StringComparison.OrdinalIgnoreCase)
            || key.Contains("unacceptable", StringComparison.OrdinalIgnoreCase)
            || key.Contains("failure", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCostFramingKey(string key)
    {
        return key.Contains("cost", StringComparison.OrdinalIgnoreCase)
            || key.Contains("budget", StringComparison.OrdinalIgnoreCase)
            || key.Contains("ceiling", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildElementText(ArchitectureModelElement element)
    {
        List<string> parts = [];

        if (!string.IsNullOrWhiteSpace(element.Name))
        {
            parts.Add(element.Name);
        }

        if (!string.IsNullOrWhiteSpace(element.Description))
        {
            parts.Add(element.Description);
        }

        foreach (KeyValuePair<string, string> property in element.Properties)
        {
            if (!string.IsNullOrWhiteSpace(property.Value))
            {
                parts.Add(property.Value);
            }
        }

        return string.Join(' ', parts);
    }
}
