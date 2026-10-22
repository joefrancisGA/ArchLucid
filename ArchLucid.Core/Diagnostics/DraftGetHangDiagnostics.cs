namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Temporary one-line JSON diagnostics for <c>GET /v1/architecture/draft/{id}</c> 60s hangs.
///     Remove after the root cause is found.
/// </summary>
public static class DraftGetHangDiagnostics
{
    public const string Component = "archlucid-api-draft-get-diag";

    public static void Log(string eventName, IReadOnlyDictionary<string, object?> fields)
    {
        ConsoleHangDiagnostics.Log(Component, eventName, fields);
    }

    public static void Log(string eventName, params (string Key, object? Value)[] fields)
    {
        ConsoleHangDiagnostics.Log(Component, eventName, fields);
    }
}
