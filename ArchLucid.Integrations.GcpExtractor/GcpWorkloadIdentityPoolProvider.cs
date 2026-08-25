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

        if (!trimmed.StartsWith(ProjectsPrefix, StringComparison.OrdinalIgnoreCase))
            return false;

        int projectStart = ProjectsPrefix.Length;
        int slashAfterProject = trimmed.IndexOf('/', projectStart);

        if (slashAfterProject <= projectStart)
            return false;

        projectId = trimmed.Substring(projectStart, slashAfterProject - projectStart);

        return !string.IsNullOrWhiteSpace(projectId);
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
