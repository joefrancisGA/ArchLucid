using System.Text;

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

        if (!HaveSameProducingKnowledgeModelId(priorKnowledgeModel, currentKnowledgeModel))
            return false;

        return string.Equals(
            ComputeKnowledgeModelFingerprint(priorKnowledgeModel),
            ComputeKnowledgeModelFingerprint(currentKnowledgeModel),
            StringComparison.Ordinal);
    }

    /// <summary>
    ///     Γ reuse is bound to the producing κ identity, not only canonical context equivalence.
    /// </summary>
    private static bool HaveSameProducingKnowledgeModelId(
        ArchitectureKnowledgeModel? priorKnowledgeModel,
        ArchitectureKnowledgeModel? currentKnowledgeModel)
    {
        if (priorKnowledgeModel is null && currentKnowledgeModel is null)
            return true;

        if (priorKnowledgeModel is null || currentKnowledgeModel is null)
            return false;

        return string.Equals(
            priorKnowledgeModel.ModelId,
            currentKnowledgeModel.ModelId,
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

        IEnumerable<string> elementParts = SelectCanonicalKnowledgeModelElements(knowledgeModel.Elements)
            .Select(FormatKnowledgeModelElementFingerprint);

        return string.Join(
            "\n",
            [
                knowledgeModel.ModelId,
                knowledgeModel.TenantId ?? string.Empty,
                knowledgeModel.RunId ?? string.Empty,
                knowledgeModel.SchemaVersion.ToString(),
                knowledgeModel.UpdatedUtc.ToString("O"),
                knowledgeModel.IsProvisionalSynthesis ? "provisional" : "complete",
                FormatFramingAnswers(knowledgeModel),
                FormatDeclaredPriorities(knowledgeModel),
                .. elementParts,
            ]);
    }

    /// <summary>
    ///     Stable κ content fingerprint for review-cache partitioning (omits run/model identity and <see cref="ArchitectureKnowledgeModel.UpdatedUtc" />).
    /// </summary>
    public static string ComputeReviewCacheKnowledgeModelFingerprint(ArchitectureKnowledgeModel? knowledgeModel)
    {
        if (knowledgeModel is null)
            return string.Empty;

        IEnumerable<string> elementParts = SelectCanonicalKnowledgeModelElements(knowledgeModel.Elements)
            .Select(FormatKnowledgeModelElementFingerprint);

        return string.Join(
            "\n",
            [
                NormalizeArtifactReferenceForFingerprint(knowledgeModel.TenantId),
                knowledgeModel.SchemaVersion.ToString(),
                knowledgeModel.IsProvisionalSynthesis ? "provisional" : "complete",
                FormatFramingAnswers(knowledgeModel),
                FormatDeclaredPriorities(knowledgeModel),
                .. elementParts,
            ]);
    }

    private static string FormatDeclaredPriorities(ArchitectureKnowledgeModel knowledgeModel)
    {
        if (knowledgeModel.DeclaredPriorities is null || knowledgeModel.DeclaredPriorities.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = knowledgeModel.DeclaredPriorities
            .Select(static priority => NormalizeArtifactReferenceForFingerprint(priority))
            .Where(static priority => priority.Length > 0)
            .GroupBy(static priority => priority, StringComparer.Ordinal)
            .OrderBy(static group => group.Key, StringComparer.Ordinal)
            .Select(static group => group.OrderBy(static priority => priority, StringComparer.Ordinal).First());

        return string.Join(",", parts);
    }

    private static string FormatFramingAnswers(ArchitectureKnowledgeModel knowledgeModel)
    {
        if (knowledgeModel.FramingAnswers is null || knowledgeModel.FramingAnswers.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = knowledgeModel.FramingAnswers
            .Select(static pair => (
                Key: NormalizeArtifactReferenceForFingerprint(pair.Key),
                Value: NormalizeArtifactReferenceForFingerprint(pair.Value)))
            .Where(static pair => pair.Key.Length > 0)
            .GroupBy(static pair => pair.Key, StringComparer.Ordinal)
            .OrderBy(static group => group.Key, StringComparer.Ordinal)
            .Select(static group =>
            {
                string value = group.OrderBy(static pair => pair.Value, StringComparer.Ordinal).First().Value;

                return $"{group.Key}={value}";
            });

        return string.Join(",", parts);
    }

    private static string NormalizeFingerprintText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(value.Trim())).Normalize(NormalizationForm.FormC);
    }

    private static string NormalizeElementIdForFingerprint(string? value)
    {
        string normalized = NormalizeFingerprintText(value);

        return normalized.Length == 0 ? normalized : normalized.ToLowerInvariant();
    }

    private static string NormalizeLabelForFingerprint(string? value)
    {
        string normalized = NormalizeFingerprintText(value);

        return normalized.Length == 0 ? normalized : normalized.ToLowerInvariant();
    }

    private static string NormalizeUnicodeSpaces(string value) =>
        value
            .Replace('\u00a0', ' ')
            .Replace('\u202f', ' ');

    private static string CollapseInteriorAsciiSpaces(string content)
    {
        while (content.Contains("  ", StringComparison.Ordinal))
            content = content.Replace("  ", " ", StringComparison.Ordinal);

        return content;
    }

    private static IEnumerable<ArchitectureModelElement> SelectCanonicalKnowledgeModelElements(
        IReadOnlyList<ArchitectureModelElement>? elements)
    {
        return (elements ?? [])
            .Where(static element => element is not null)
            .GroupBy(element => NormalizeArtifactReferenceForFingerprint(element.ElementId), StringComparer.Ordinal)
            .OrderBy(static group => group.Key, StringComparer.Ordinal)
            .Select(static group => group
                .OrderBy(FormatKnowledgeModelElementFingerprint, StringComparer.Ordinal)
                .First());
    }

    private static string FormatKnowledgeModelElementFingerprint(ArchitectureModelElement element)
    {
        string related = string.Join(
            ",",
            (element.RelatedElementIds ?? [])
                .Select(static id => NormalizeArtifactReferenceForFingerprint(id))
                .Where(static id => id.Length > 0)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static id => id, StringComparer.Ordinal));

        IEnumerable<string> propertyParts = (element.Properties ?? [])
            .Select(static pair => (
                Key: NormalizeArtifactReferenceForFingerprint(pair.Key),
                Value: NormalizeArtifactReferenceForFingerprint(pair.Value)))
            .Where(static pair => pair.Key.Length > 0)
            .GroupBy(static pair => pair.Key, StringComparer.Ordinal)
            .OrderBy(static group => group.Key, StringComparer.Ordinal)
            .Select(static group => group.OrderBy(static pair => pair.Value, StringComparer.Ordinal).First())
            .Select(static pair => $"{pair.Key}={pair.Value}");

        string properties = string.Join(",", propertyParts);
        string passages = string.Join(
            ",",
            (element.SourcePassageIds ?? [])
                .Select(static id => NormalizeArtifactReferenceForFingerprint(id))
                .Where(static id => id.Length > 0)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static id => id, StringComparer.Ordinal));

        string name = NormalizeArtifactReferenceForFingerprint(element.Name);
        string description = NormalizeArtifactReferenceForFingerprint(element.Description);

        return string.Join(
            "|",
            NormalizeArtifactReferenceForFingerprint(element.ElementId),
            element.Kind.ToString(),
            name,
            description,
            element.LifecycleScope.ToString(),
            element.ExtractionConfidence.ToString(System.Globalization.CultureInfo.InvariantCulture),
            FormatElementProvenance(element.Provenance),
            passages,
            related,
            properties);
    }

    private static string NormalizeSectionPathForFingerprint(string? value) =>
        NormalizePathLikeFingerprintToken(NormalizeLabelForFingerprint(value));

    private static string NormalizeArtifactReferenceForFingerprint(string? value) =>
        NormalizePathLikeFingerprintToken(NormalizeElementIdForFingerprint(value));

    /// <summary>
    ///     Maps Unicode slash lookalikes to ASCII <c>/</c> for review-cache path tokens and source file names.
    /// </summary>
    public static string NormalizeReviewCacheUnicodeSlashScalars(string value) =>
        NormalizeUnicodeSlashScalars(value);

    /// <summary>
    ///     Canonicalizes slash-separated reference tokens for review-cache fingerprints after label/id normalization.
    /// </summary>
    public static string NormalizeReviewCachePathLikeToken(string normalizedToken)
    {
        if (normalizedToken.Length == 0)
            return normalizedToken;

        string path = NormalizeUnicodeSlashScalars(DecodePercentEncodedPathTokens(normalizedToken)).Replace('\\', '/');

        while (path.Contains("//", StringComparison.Ordinal))
            path = path.Replace("//", "/", StringComparison.Ordinal);

        while (path.Contains("/./", StringComparison.Ordinal))
            path = path.Replace("/./", "/", StringComparison.Ordinal);

        while (path.StartsWith("./", StringComparison.Ordinal))
            path = path[2..];

        while (path.StartsWith('/'))
            path = path[1..];

        while (path.EndsWith('/') && path.Length > 0)
            path = path[..^1];

        return CollapseParentPathSegments(path);
    }

    private static string NormalizePathLikeFingerprintToken(string normalizedToken) =>
        NormalizeReviewCachePathLikeToken(normalizedToken);

    private static string DecodePercentEncodedPathTokens(string value)
    {
        string decoded = value;

        while (decoded.Contains('%', StringComparison.Ordinal))
        {
            string next = Uri.UnescapeDataString(decoded);

            if (string.Equals(next, decoded, StringComparison.Ordinal))
                break;

            decoded = next;
        }

        return decoded;
    }

    private static string NormalizeUnicodeSlashScalars(string value)
    {
        if (value.Length == 0)
            return value;

        return value
            .Replace('\u2215', '/')
            .Replace('\uFF0F', '/');
    }

    private static string CollapseParentPathSegments(string path)
    {
        if (path.Length == 0)
            return path;

        string[] rawSegments = path.Split('/');
        List<string> segments = [];

        foreach (string segment in rawSegments)
        {
            if (segment.Length == 0 || string.Equals(segment, ".", StringComparison.Ordinal))
                continue;

            if (string.Equals(segment, "..", StringComparison.Ordinal))
            {
                if (segments.Count > 0)
                    segments.RemoveAt(segments.Count - 1);

                continue;
            }

            segments.Add(segment);
        }

        return segments.Count == 0 ? string.Empty : string.Join('/', segments);
    }

    private static string FormatPassageLocatorFingerprint(SourcePassageLocator? passageLocator)
    {
        if (passageLocator is null)
            return string.Empty;

        string artifactId = NormalizeArtifactReferenceForFingerprint(passageLocator.ArtifactId);
        string startOffset = FormatPassageOffsetToken(
            passageLocator.StartOffset,
            passageLocator.EndOffset,
            isStart: true);
        string endOffset = FormatPassageOffsetToken(
            passageLocator.StartOffset,
            passageLocator.EndOffset,
            isStart: false);
        string quote = NormalizeArtifactReferenceForFingerprint(passageLocator.Quote);
        string sectionPath = NormalizeSectionPathForFingerprint(passageLocator.SectionPath);

        if (artifactId.Length == 0 &&
            startOffset.Length == 0 &&
            endOffset.Length == 0 &&
            quote.Length == 0 &&
            sectionPath.Length == 0)
        {
            return string.Empty;
        }

        return string.Join(":", artifactId, startOffset, endOffset, quote, sectionPath);
    }

    private static string FormatPassageOffsetToken(int? startOffset, int? endOffset, bool isStart)
    {
        if (isStart)
        {
            if (startOffset is null)
            {
                if (endOffset is null or 0)
                    return string.Empty;

                return "0";
            }

            if (startOffset is 0 && endOffset is null or 0)
                return string.Empty;

            return startOffset.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        if (endOffset is null or 0)
            return string.Empty;

        return endOffset.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
    }

    private static string FormatElementProvenance(ClaimProvenance? provenance)
    {
        if (provenance is null)
            return string.Empty;

        string locator = FormatPassageLocatorFingerprint(provenance.PassageLocator);

        return string.Join(
            ":",
            provenance.Origin.ToString(),
            provenance.SupportStatus.ToString(),
            provenance.Confidence.ToString(System.Globalization.CultureInfo.InvariantCulture),
            NormalizeArtifactReferenceForFingerprint(provenance.SourceArtifactId),
            NormalizeArtifactReferenceForFingerprint(provenance.Notes),
            locator);
    }
}

