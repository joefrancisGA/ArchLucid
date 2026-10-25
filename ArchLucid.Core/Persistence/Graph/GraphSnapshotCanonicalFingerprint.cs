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
    ///     Maps Unicode dot lookalikes to ASCII <c>.</c> for review-cache path parent-segment canonicalization.
    /// </summary>
    public static string NormalizeReviewCacheUnicodeDotScalars(string value) =>
        NormalizeUnicodeDotScalars(value);

    /// <summary>
    ///     Canonicalizes slash-separated reference tokens for review-cache fingerprints after label/id normalization.
    /// </summary>
    public static string NormalizeReviewCachePathLikeToken(string normalizedToken)
    {
        if (normalizedToken.Length == 0)
            return normalizedToken;

        string path = NormalizeUnicodeDotScalars(
                NormalizeUnicodeSlashScalars(
                    NormalizeReviewCacheAlternatePathSeparators(
                        NormalizeReviewCachePathLineBreakScalars(
                            StripReviewCachePathUrlAffixes(
                                NormalizeReviewCacheHashAndQuerySeparatorsBeforeUrlAffixStrip(
                                    DecodePercentEncodedPathTokens(
                                        ReplaceIsolatedPlusWithPathSeparator(normalizedToken))))))))
            .Replace('\\', '/');

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

    // Keep aligned with ClosedLoopReasoningSourceTextNormalizer.UnicodeLineBreakScalars for path tokens.
    private static ReadOnlySpan<char> ReviewCachePathLineBreakScalars =>
    [
        '\0',
        '\t',
        '\u000b',
        '\u000c',
        '\r',
        '\u001c',
        '\u001d',
        '\u001e',
        '\u001f',
        '\u0084',
        '\u0085',
        '\u007f',
        '\u200b',
        '\u2028',
        '\u2029',
    ];

    private static string NormalizeReviewCachePathLineBreakScalars(string value)
    {
        if (value.Length == 0)
            return value;

        string normalized = value.Replace("\r\n", "/", StringComparison.Ordinal);

        foreach (char lineBreak in ReviewCachePathLineBreakScalars)
            normalized = normalized.Replace(lineBreak, '/');

        normalized = normalized.Replace('\n', '/');

        return normalized;
    }

    private static ReadOnlySpan<char> ReviewCacheAlternatePathSeparators =>
    [
        '\u00a0',
        '\u202f',
        '\u3000',
        ';',
        '\uFF1B',
        ',',
        '\uFF0C',
        '|',
        '\uFF5C',
        '&',
        '\uFF06',
        '>',
        '\uFF1E',
        ':',
        '\uFF1A',
        '=',
        '\uFF1D',
        '!',
        '\uFF01',
        '@',
        '\uFF20',
        '~',
        '\uFF5E',
        '^',
        '\uFF3E',
        '$',
        '\uFF04',
        '*',
        '\uFF0A',
        '`',
        '\uFF40',
        '\u00B7',
        '\u2013',
        '\u2014',
        '\u2010',
        '\u2212',
        '\u2012',
        '\u2015',
        '\u2022',
        '\u25CF',
        '\u25AA',
        '\u2043',
        '\u25E6',
        '\u2023',
    ];

    private static string StripReviewCachePathUrlAffixes(string value)
    {
        if (value.Length == 0)
            return value;

        if (TryStripProtocolRelativeAuthorityPath(ref value))
        {
            // Authority-bearing //host/... URLs normalized to AbsolutePath.
        }
        else if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                 || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            if (Uri.TryCreate(value, UriKind.Absolute, out Uri? absoluteUri) && absoluteUri.IsAbsoluteUri)
                value = absoluteUri.AbsolutePath;
        }
        else if (value.StartsWith("file://", StringComparison.OrdinalIgnoreCase))
        {
            value = value["file://".Length..];
        }

        int queryIndex = value.IndexOf('?', StringComparison.Ordinal);
        int fragmentIndex = value.IndexOf('#', StringComparison.Ordinal);

        int cutIndex = queryIndex >= 0 && fragmentIndex >= 0
            ? Math.Min(queryIndex, fragmentIndex)
            : queryIndex >= 0
                ? queryIndex
                : fragmentIndex;

        if (cutIndex >= 0)
            value = value[..cutIndex];

        return value;
    }

    private static bool TryStripProtocolRelativeAuthorityPath(ref string value)
    {
        if (!value.StartsWith("//", StringComparison.Ordinal) || value.StartsWith("///", StringComparison.Ordinal))
            return false;

        int authorityEnd = value.IndexOf('/', 2);

        ReadOnlySpan<char> authority = authorityEnd < 0
            ? value.AsSpan(2)
            : value.AsSpan(2, authorityEnd - 2);

        if (authority.IsEmpty || (!authority.Contains('.') && !authority.Contains(':')))
            return false;

        if (!Uri.TryCreate("https:" + value, UriKind.Absolute, out Uri? absoluteUri) || !absoluteUri.IsAbsoluteUri)
            return false;

        value = absoluteUri.AbsolutePath;

        return true;
    }

    /// <summary>
    ///     When a path token already contains <c>/</c>, map common alternate separators to <c>/</c>
    ///     when they sit between dotless segment names (e.g. <c>docs\u00a0architecture/overview.md</c>)
    ///     without rewriting separators inside file-name segments (e.g. <c>arch\u00a0note.md</c>).
    /// </summary>
    private static string NormalizeReviewCacheHashAndQuerySeparatorsBeforeUrlAffixStrip(string value)
    {
        if (!value.Contains('/', StringComparison.Ordinal))
            return value;

        string normalized = value;

        foreach (char separator in ReviewCacheHashAndQuerySeparatorsBeforeUrlAffixStrip)
        {
            if (!normalized.Contains(separator))
                continue;

            normalized = ReplaceAlternatePathSeparatorWhenDotlessTailWithFollowingSlash(normalized, separator);
        }

        return normalized;
    }

    private static ReadOnlySpan<char> ReviewCacheHashAndQuerySeparatorsBeforeUrlAffixStrip =>
    [
        '#',
        '\uFF03',
        '?',
        '\uFF1F',
    ];

    private static string NormalizeReviewCacheAlternatePathSeparators(string value)
    {
        if (!value.Contains('/', StringComparison.Ordinal))
            return value;

        string normalized = value;

        foreach (char separator in ReviewCacheAlternatePathSeparators)
        {
            if (!normalized.Contains(separator))
                continue;

            normalized = ReplaceAlternatePathSeparatorWhenDotlessTail(normalized, separator);
        }

        return normalized;
    }

    private static string ReplaceAlternatePathSeparatorWhenDotlessTailWithFollowingSlash(string value, char separator)
    {
        StringBuilder builder = new(value.Length);

        for (int index = 0; index < value.Length; index++)
        {
            char current = value[index];

            if (current != separator)
            {
                builder.Append(current);
                continue;
            }

            int tailStart = index + 1;
            int slashIndex = value.IndexOf('/', tailStart);

            if (slashIndex < 0)
            {
                builder.Append(current);
                continue;
            }

            int tailEnd = slashIndex;
            ReadOnlySpan<char> tail = value.AsSpan(tailStart, tailEnd - tailStart);

            builder.Append(tail.Contains('.') ? separator : '/');
        }

        return builder.ToString();
    }

    private static string ReplaceAlternatePathSeparatorWhenDotlessTail(string value, char separator)
    {
        StringBuilder builder = new(value.Length);

        for (int index = 0; index < value.Length; index++)
        {
            char current = value[index];

            if (current != separator)
            {
                builder.Append(current);
                continue;
            }

            int tailStart = index + 1;
            int slashIndex = value.IndexOf('/', tailStart);
            int tailEnd = slashIndex < 0 ? value.Length : slashIndex;
            ReadOnlySpan<char> tail = value.AsSpan(tailStart, tailEnd - tailStart);

            builder.Append(tail.Contains('.') ? separator : '/');
        }

        return builder.ToString();
    }

    private static string ReplaceIsolatedPlusWithPathSeparator(string value)
    {
        if (!value.Contains('+', StringComparison.Ordinal))
            return value;

        StringBuilder builder = new(value.Length);

        for (int index = 0; index < value.Length; index++)
        {
            char current = value[index];

            if (current == '+' && !IsPlusInRun(value, index))
                builder.Append('/');
            else
                builder.Append(current);
        }

        return builder.ToString();
    }

    private static bool IsPlusInRun(string value, int index)
    {
        if (value[index] != '+')
            return false;

        bool previousIsPlus = index > 0 && value[index - 1] == '+';
        bool nextIsPlus = index + 1 < value.Length && value[index + 1] == '+';

        return previousIsPlus || nextIsPlus;
    }

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

    // Keep aligned with AuthSignInReturnPathGuard.IsSlashHomoglyph for review-cache path tokens.
    private static ReadOnlySpan<char> ReviewCacheSlashHomoglyphs =>
    [
        '\u2044',
        '\u2215',
        '\u2216',
        '\u2298',
        '\u244A',
        '\u2571',
        '\u2572',
        '\u27C8',
        '\u27C9',
        '\u27CB',
        '\u27CD',
        '\u29B8',
        '\u29C4',
        '\u29C5',
        '\u29F4',
        '\u29F5',
        '\u29F6',
        '\u29F7',
        '\u29F8',
        '\u29F9',
        '\u29FA',
        '\u2AFB',
        '\u2AFD',
        '\u2AFF',
        '\u2E4A',
        '\uFE68',
        '\uFF0F',
        '\uFF3C',
    ];

    // Keep aligned with AuthSignInReturnPathGuard.IsDotHomoglyph for review-cache parent segments.
    private static ReadOnlySpan<char> ReviewCacheDotHomoglyphs =>
    [
        '\u00B7',
        '\u0387',
        '\u05C3',
        '\u06D4',
        '\u0701',
        '\u0702',
        '\u1362',
        '\u1427',
        '\u166E',
        '\u16EB',
        '\u1803',
        '\u2024',
        '\u2025',
        '\u2027',
        '\u2219',
        '\u22C5',
        '\u2981',
        '\u2E30',
        '\u2E31',
        '\u2E33',
        '\u3002',
        '\u30FB',
        '\uA78F',
        '\uFE12',
        '\uFE30',
        '\uFE52',
        '\uFF0E',
        '\uFF61',
        '\uFF65',
    ];

    private static string NormalizeUnicodeSlashScalars(string value)
    {
        if (value.Length == 0)
            return value;

        foreach (char homoglyph in ReviewCacheSlashHomoglyphs)
            value = value.Replace(homoglyph, '/');

        return value;
    }

    private static string NormalizeUnicodeDotScalars(string value)
    {
        if (value.Length == 0)
            return value;

        foreach (char homoglyph in ReviewCacheDotHomoglyphs)
            value = value.Replace(homoglyph, '.');

        return value;
    }

    private static string CollapseParentPathSegments(string path)
    {
        if (path.Length == 0)
            return path;

        string[] rawSegments = path.Split('/');
        List<string> segments = [];

        foreach (string rawSegment in rawSegments)
        {
            string segment = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(rawSegment.Trim()));

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

