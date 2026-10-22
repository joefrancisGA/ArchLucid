namespace ArchLucid.Api.Support;

/// <summary>API-layer forwarding shim for <see cref="Application.Runs.AuthorityRunIdentifier"/>.</summary>
public static class AuthorityRunIdentifier
{
    public static bool TryParse(string? runId, out Guid runGuid) =>
        Application.Runs.AuthorityRunIdentifier.TryParse(runId, out runGuid);

    public static bool Matches(string routeRunId, Guid payloadRunId) =>
        Application.Runs.AuthorityRunIdentifier.Matches(routeRunId, payloadRunId);

    public static string SanitizeForFileStem(string? runId) =>
        Application.Runs.AuthorityRunIdentifier.SanitizeForFileStem(runId);
}
