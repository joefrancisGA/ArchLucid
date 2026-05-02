namespace ArchLucid.Persistence.Orchestration;

/// <summary>Truncates exception text for persistence on outbox telemetry columns (<c>LastAttemptError</c>).</summary>
public static class AuthorityPipelineWorkErrorSummary
{
    public const int MaxLength = 400;

    public static string From(Exception exception)
    {
        if (exception is null)
            return string.Empty;

        string composed = $"{exception.GetType().Name}:{exception.Message}";
        return Truncate(composed);
    }

    public static string TruncateNullable(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        return Truncate(value);
    }

    private static string Truncate(string value)
    {
        const int ellipsis = MaxLength - 3;
        return value.Length <= MaxLength ? value : $"{value[..ellipsis]}...";
    }
}
