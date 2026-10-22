namespace ArchLucid.Integrations.GcpExtractor;

internal static class GcpServiceAccountEmail
{
    private const string ServiceAccountDomainSuffix = ".iam.gserviceaccount.com";

    public static bool TryGetProjectId(string serviceAccountEmail, out string projectId)
    {
        projectId = string.Empty;

        if (string.IsNullOrWhiteSpace(serviceAccountEmail))
            return false;

        string trimmed = serviceAccountEmail.Trim();
        int atIndex = trimmed.IndexOf('@');

        if (atIndex <= 0 || atIndex >= trimmed.Length - 1)
            return false;

        string domain = trimmed[(atIndex + 1)..];

        if (!domain.EndsWith(ServiceAccountDomainSuffix, StringComparison.OrdinalIgnoreCase))
            return false;

        projectId = domain[..^ServiceAccountDomainSuffix.Length];

        return !string.IsNullOrWhiteSpace(projectId);
    }

    public static void EnsureProjectMatches(string projectId, string serviceAccountEmail)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

        if (!TryGetProjectId(serviceAccountEmail, out string serviceAccountProjectId))
        {
            throw new ArgumentException(
                "Service account email is not a valid GCP service account email.",
                nameof(serviceAccountEmail));
        }

        if (!string.Equals(projectId.Trim(), serviceAccountProjectId, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"Project ID '{projectId.Trim()}' does not match service account project '{serviceAccountProjectId}'.",
                nameof(projectId));
        }
    }
}
