namespace ArchLucid.Api.Tests;

internal static class ArchLucidHttpComparisonRecordHeaderExtensions
{
    internal static string ReadComparisonRecordIdHeaderForTest(this HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("X-ArchLucid-ComparisonRecordId", out IEnumerable<string>? values))
            throw new InvalidOperationException("X-ArchLucid-ComparisonRecordId header missing.");

        string? comparisonRecordId = values.FirstOrDefault();

        if (string.IsNullOrEmpty(comparisonRecordId))
            throw new InvalidOperationException("X-ArchLucid-ComparisonRecordId header missing.");

        return comparisonRecordId;
    }
}
