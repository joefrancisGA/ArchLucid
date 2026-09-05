using System.Text.RegularExpressions;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class ArchitectureDiagramServiceTypeInferencer
{
    private static readonly (string Pattern, string Kind)[] LabelRules =
    [
        ("user|person|actor|customer", ArchitectureDiagramNodeKinds.User),
        ("external|third[- ]party|partner|vendor", ArchitectureDiagramNodeKinds.External),
        ("boundary|trust zone|dmz", ArchitectureDiagramNodeKinds.Boundary),
    ];

    public void ApplyLabelInference(ArchitectureDiagramNodeRecord node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (string.Equals(node.Provenance, ArchitectureDiagramProvenanceKinds.Asserted, StringComparison.Ordinal))
        {
            return;
        }

        foreach ((string pattern, string kind) in LabelRules)
        {
            if (Regex.IsMatch(node.Label, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            {
                node.Kind = kind;
                node.Provenance = ArchitectureDiagramProvenanceKinds.Inferred;

                return;
            }
        }

        node.Kind = ArchitectureDiagramNodeKinds.System;
        node.Provenance = ArchitectureDiagramProvenanceKinds.Inferred;
    }

    public double LabelOnlyConfidence => 0.7d;
}
