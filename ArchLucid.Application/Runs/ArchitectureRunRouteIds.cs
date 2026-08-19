namespace ArchLucid.Application.Runs;

/// <summary>Normalises run route identifiers for storage keys (idempotency rows, correlation with <c>dbo.Runs</c>).</summary>
public static class ArchitectureRunRouteIds
{
    /// <summary>Returns <see cref="Guid" /> canonical <c>N</c> formatting when parsing succeeds.</summary>
    public static string NormalizeForScopeKey(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();

        if (Guid.TryParse(trimmed, out Guid parsed))
            return parsed.ToString("N");

        return trimmed;
    }
}
