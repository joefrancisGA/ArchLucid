using Microsoft.Net.Http.Headers;

namespace ArchLucid.Api.Http;

/// <summary>Resolves pilot value report response format from the Accept header.</summary>
public static class PilotValueReportAcceptFormat
{
    public static bool PrefersMarkdown(string? acceptHeader)
    {
        if (string.IsNullOrWhiteSpace(acceptHeader))
            return false;

        IList<MediaTypeHeaderValue> mediaTypes = ParseAcceptHeader(acceptHeader);

        if (mediaTypes.Count == 0)
            return acceptHeader.Contains("text/markdown", StringComparison.OrdinalIgnoreCase);

        // An explicit Accept entry wins over a less-specific wildcard even when q=0.
        // Otherwise "text/markdown;q=0, */*;q=1" incorrectly selects Markdown.
        double markdownQuality = GetEffectiveMediaTypeQuality(mediaTypes, "text/markdown");
        double jsonQuality = GetEffectiveMediaTypeQuality(mediaTypes, "application/json");

        if (markdownQuality <= 0)
            return false;

        if (markdownQuality > jsonQuality)
            return true;

        if (markdownQuality < jsonQuality)
            return false;

        int markdownIndex = IndexOfFirstMatch(mediaTypes, "text/markdown");
        int jsonIndex = IndexOfFirstJsonMatch(mediaTypes);

        if (markdownIndex < 0)
            return false;

        if (jsonIndex < 0)
            return true;

        // Equal q: prefer a concrete markdown entry over JSON-family wildcards (application/*, */*).

        if (markdownQuality > 0 && !HasConcreteJsonAtQuality(mediaTypes, markdownQuality))
            return true;

        return markdownIndex < jsonIndex;
    }

    private static List<MediaTypeHeaderValue> ParseAcceptHeader(string acceptHeader)
    {
        List<MediaTypeHeaderValue> mediaTypes = [];
        string[] parts = acceptHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string part in parts)
        {
            if (MediaTypeHeaderValue.TryParse(part, out MediaTypeHeaderValue? parsed))
                mediaTypes.Add(parsed);
        }

        return mediaTypes;
    }

    /// <summary>
    /// Returns q for the most specific matching media range, honoring explicit exclusions.
    /// </summary>
    private static double GetEffectiveMediaTypeQuality(IList<MediaTypeHeaderValue> mediaTypes, string requestedMediaType)
    {
        int bestSpecificity = -1;
        double bestQuality = 0.0;

        foreach (MediaTypeHeaderValue candidate in mediaTypes)
        {
            if (!candidate.MatchesMediaType(requestedMediaType))
                continue;

            int specificity = MatchesExactMediaType(candidate, requestedMediaType)
                ? 2
                : string.Equals(candidate.MediaType.Value, "*/*", StringComparison.Ordinal) ? 0 : 1;
            double quality = candidate.Quality ?? 1.0;

            if (specificity > bestSpecificity)
            {
                bestSpecificity = specificity;
                bestQuality = quality;
            }
            else if (specificity == bestSpecificity && quality > bestQuality)
            {
                bestQuality = quality;
            }
        }

        return bestQuality;
    }

    private static bool MatchesExactMediaType(MediaTypeHeaderValue candidate, string mediaType)
    {
        return string.Equals(candidate.MediaType.Value, mediaType, StringComparison.OrdinalIgnoreCase);
    }

    private static int IndexOfFirstMatch(IList<MediaTypeHeaderValue> mediaTypes, string mediaType)
    {
        for (int index = 0; index < mediaTypes.Count; index++)
        {
            if (mediaTypes[index].MatchesMediaType(mediaType))
                return index;
        }

        return -1;
    }

    private static bool HasConcreteJsonAtQuality(IList<MediaTypeHeaderValue> mediaTypes, double quality)
    {
        foreach (MediaTypeHeaderValue candidate in mediaTypes)
        {
            if (!MatchesExactMediaType(candidate, "application/json"))
                continue;

            double candidateQuality = candidate.Quality ?? 1.0;

            if (Math.Abs(candidateQuality - quality) < 0.0001)
                return true;
        }

        return false;
    }

    private static int IndexOfFirstJsonMatch(IList<MediaTypeHeaderValue> mediaTypes)
    {
        for (int index = 0; index < mediaTypes.Count; index++)
        {
            MediaTypeHeaderValue candidate = mediaTypes[index];

            if (candidate.MatchesMediaType("application/json")
                || candidate.MatchesMediaType("application/*")
                || candidate.MatchesMediaType("*/*"))
            {
                return index;
            }
        }

        return -1;
    }
}
