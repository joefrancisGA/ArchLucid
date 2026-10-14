namespace ArchLucid.Integrations.GcpExtractor;

internal static class GcpWorkloadIdentityPoolProvider
{
    private const string ProjectsPrefix = "projects/";
    private const string AudiencePrefix = "//iam.googleapis.com/";
    private const string HttpsAudiencePrefix = "https://iam.googleapis.com/";

    public static bool TryGetProjectId(string workloadIdentityPoolProvider, out string projectId)
    {
        projectId = string.Empty;

        if (string.IsNullOrWhiteSpace(workloadIdentityPoolProvider))
            return false;

        string trimmed = StripAudiencePrefix(workloadIdentityPoolProvider.Trim());

        if (!TryParseCanonicalProviderResource(trimmed, out projectId))
            return false;

        return !string.IsNullOrWhiteSpace(projectId);
    }

    private static bool TryParseCanonicalProviderResource(string trimmed, out string projectId)
    {
        projectId = string.Empty;

        if (!trimmed.StartsWith(ProjectsPrefix, StringComparison.OrdinalIgnoreCase))
            return false;

        string[] segments = trimmed.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length < 8)
            return false;

        if (!segments[0].Equals("projects", StringComparison.OrdinalIgnoreCase)
            || !segments[2].Equals("locations", StringComparison.OrdinalIgnoreCase)
            || !segments[4].Equals("workloadIdentityPools", StringComparison.OrdinalIgnoreCase)
            || !segments[6].Equals("providers", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(segments[1])
            || string.IsNullOrWhiteSpace(segments[3])
            || string.IsNullOrWhiteSpace(segments[5])
            || string.IsNullOrWhiteSpace(segments[7]))
        {
            return false;
        }

        projectId = segments[1];

        return true;
    }

    public static void EnsureProjectMatches(string projectId, string workloadIdentityPoolProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

        if (!TryGetProjectId(workloadIdentityPoolProvider, out string providerProjectId))
        {
            throw new ArgumentException(
                "Workload identity pool provider is not a valid GCP provider resource name.",
                nameof(workloadIdentityPoolProvider));
        }

        if (!string.Equals(projectId.Trim(), providerProjectId, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"Project ID '{projectId.Trim()}' does not match workload identity pool provider project '{providerProjectId}'.",
                nameof(projectId));
        }
    }

    private static string StripAudiencePrefix(string value)
    {
        if (value.StartsWith(AudiencePrefix, StringComparison.OrdinalIgnoreCase))
            return value[AudiencePrefix.Length..];

        if (value.StartsWith(HttpsAudiencePrefix, StringComparison.OrdinalIgnoreCase))
            return value[HttpsAudiencePrefix.Length..];

        return value.TrimStart('/');
    }
}
