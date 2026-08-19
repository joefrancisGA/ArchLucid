namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Names typed contradiction elements from source text (TB-2350 item 53).</summary>
internal static class ArchitectureContradictionClassifier
{
    internal static (string Name, string Notes) Classify(string sourceText)
    {
        ArgumentNullException.ThrowIfNull(sourceText);

        if (Contains(sourceText, "diagram")
            && (Contains(sourceText, "prose")
                || Contains(sourceText, "narrative")
                || Contains(sourceText, "document")))
        {
            return (
                "Diagram vs prose contradiction",
                "Contradiction type: diagram-vs-prose. Contradiction marker detected.");
        }

        if (Contains(sourceText, "policy") && Contains(sourceText, "component"))
        {
            return (
                "Policy vs component contradiction",
                "Contradiction type: policy-vs-component. Contradiction marker detected.");
        }

        return (
            "Contradiction",
            "Contradiction type: generic. Contradiction marker detected.");
    }

    private static bool Contains(string sourceText, string needle)
    {
        return sourceText.Contains(needle, StringComparison.OrdinalIgnoreCase);
    }
}
