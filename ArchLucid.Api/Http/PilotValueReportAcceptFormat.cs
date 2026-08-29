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

        double markdownQuality = GetMediaTypeQuality(mediaTypes, "text/markdown");
        double jsonQuality = Math.Max(
            GetMediaTypeQuality(mediaTypes, "application/json"),
            Math.Max(GetMediaTypeQuality(mediaTypes, "application/*"), GetMediaTypeQuality(mediaTypes, "*/*")));

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

    private static double GetMediaTypeQuality(IList<MediaTypeHeaderValue> mediaTypes, string mediaType)
    {
        double bestQuality = 0.0;

        foreach (MediaTypeHeaderValue candidate in mediaTypes)
        {
            if (!candidate.MatchesMediaType(mediaType))
                continue;

            double quality = candidate.Quality ?? 1.0;

            if (quality > bestQuality)
                bestQuality = quality;
        }

        return bestQuality;
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
