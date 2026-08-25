using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Compares two <see cref="ContextSnapshot" /> canonical object sets for incremental graph reuse.
/// </summary>
public static class GraphSnapshotCanonicalFingerprint
{
    /// <summary>
    ///     When both snapshots have the same ordered fingerprint of canonical identity fields,
    ///     a previously built <see cref="GraphSnapshot" /> can be cloned with new ids instead of rebuilding.
    /// </summary>
    public static bool AreEquivalent(ContextSnapshot? previous, ContextSnapshot current)
    {
        if (previous is null)
            return false;

        return previous.SnapshotId != current.SnapshotId &&
               string.Equals(Compute(previous), Compute(current), StringComparison.Ordinal);
    }

    /// <summary>
    ///     Context equivalence plus matching architecture knowledge model fingerprints when either side carries a model.
    /// </summary>
    public static bool AreEquivalentForReuse(
        ContextSnapshot? previous,
        ContextSnapshot current,
        ArchitectureKnowledgeModel? priorKnowledgeModel,
        ArchitectureKnowledgeModel? currentKnowledgeModel)
    {
        ArgumentNullException.ThrowIfNull(current);

        if (!AreEquivalent(previous, current))
            return false;

        return string.Equals(
            ComputeKnowledgeModelFingerprint(priorKnowledgeModel),
            ComputeKnowledgeModelFingerprint(currentKnowledgeModel),
            StringComparison.Ordinal);
    }

    /// <summary>Deterministic string over canonical objects (ObjectId, type, name, source).</summary>
    public static string Compute(ContextSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        IEnumerable<string> parts = snapshot.CanonicalObjects
            .OrderBy(o => o.ObjectId, StringComparer.OrdinalIgnoreCase)
            .Select(o =>
                $"{o.ObjectId}|{o.ObjectType}|{o.Name}|{o.SourceType}|{o.SourceId}");

        return string.Join("\n", parts);
    }

    /// <summary>
    ///     Stable fingerprint for κ so graph reuse does not clone Γ when the knowledge model changed.
    /// </summary>
    public static string ComputeKnowledgeModelFingerprint(ArchitectureKnowledgeModel? knowledgeModel)
    {
        if (knowledgeModel is null)
            return string.Empty;

        IEnumerable<string> elementParts = knowledgeModel.Elements
            .OrderBy(element => element.ElementId, StringComparer.OrdinalIgnoreCase)
            .Select(FormatKnowledgeModelElementFingerprint);

        return string.Join(
            "\n",
            [
                knowledgeModel.ModelId,
                knowledgeModel.SchemaVersion.ToString(),
                knowledgeModel.UpdatedUtc.ToString("O"),
                .. elementParts,
            ]);
    }

    private static string FormatKnowledgeModelElementFingerprint(ArchitectureModelElement element)
    {
        string related = string.Join(
            ",",
            element.RelatedElementIds.OrderBy(static id => id, StringComparer.OrdinalIgnoreCase));

        IEnumerable<string> propertyParts = element.Properties
            .OrderBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static pair => $"{pair.Key}={pair.Value}");

        string properties = string.Join(",", propertyParts);

        return string.Join(
            "|",
            element.ElementId,
            element.Kind.ToString(),
            element.Name,
            element.LifecycleScope.ToString(),
            related,
            properties);
    }
}

