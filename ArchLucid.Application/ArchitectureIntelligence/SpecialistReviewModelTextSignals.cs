using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Shared text and element signals for heuristic specialist dimensions (TB-2338).</summary>
internal static class SpecialistReviewModelTextSignals
{
    internal static string CollectSearchText(ArchitectureKnowledgeModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        List<string> parts = [];

        foreach (ArchitectureModelElement element in model.Elements)
        {
            AppendIfPresent(parts, element.Name);
            AppendIfPresent(parts, element.Description);

            foreach (KeyValuePair<string, string> property in element.Properties)
            {
                AppendIfPresent(parts, property.Value);
            }
        }

        foreach (KeyValuePair<string, string> answer in model.FramingAnswers)
        {
            AppendIfPresent(parts, answer.Value);
        }

        return string.Join(' ', parts);
    }

    internal static bool ContainsLoadSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("rps", StringComparison.OrdinalIgnoreCase)
            || text.Contains("requests per second", StringComparison.OrdinalIgnoreCase)
            || text.Contains("concurrent users", StringComparison.OrdinalIgnoreCase)
            || text.Contains("users", StringComparison.OrdinalIgnoreCase)
            || text.Contains("throughput", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ContainsSensitiveDataSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("pii", StringComparison.OrdinalIgnoreCase)
            || text.Contains("personal data", StringComparison.OrdinalIgnoreCase)
            || text.Contains("customer data", StringComparison.OrdinalIgnoreCase)
            || text.Contains("sensitive data", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ContainsComplianceSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("gdpr", StringComparison.OrdinalIgnoreCase)
            || text.Contains("hipaa", StringComparison.OrdinalIgnoreCase)
            || text.Contains("pci", StringComparison.OrdinalIgnoreCase)
            || text.Contains("jurisdiction", StringComparison.OrdinalIgnoreCase)
            || text.Contains("data residency", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ContainsExternalIntegrationSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("third-party", StringComparison.OrdinalIgnoreCase)
            || text.Contains("third party", StringComparison.OrdinalIgnoreCase)
            || text.Contains("external api", StringComparison.OrdinalIgnoreCase)
            || text.Contains("vendor api", StringComparison.OrdinalIgnoreCase)
            || text.Contains("saas integration", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ContainsOperationsSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("on-call", StringComparison.OrdinalIgnoreCase)
            || text.Contains("on call", StringComparison.OrdinalIgnoreCase)
            || text.Contains("runbook", StringComparison.OrdinalIgnoreCase)
            || text.Contains("monitoring", StringComparison.OrdinalIgnoreCase)
            || text.Contains("alerting", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ContainsAiSignal(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Contains("llm", StringComparison.OrdinalIgnoreCase)
            || text.Contains("generative ai", StringComparison.OrdinalIgnoreCase)
            || text.Contains("machine learning model", StringComparison.OrdinalIgnoreCase)
            || text.Contains(" ai ", StringComparison.OrdinalIgnoreCase);
    }

    private static void AppendIfPresent(List<string> parts, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            parts.Add(value);
        }
    }
}
