namespace ArchLucid.Api.Models;

/// <summary>Validation bounds for <c>POST /v1/diagnostics/client-error</c> operator-shell client error reports.</summary>
public static class ClientErrorTelemetryIngestLimits
{
    public const int MaxMessageLength = 500;
    public const int MaxStackLength = 2000;
    public const int MaxPathnameLength = 200;
    public const int MaxUserAgentLength = 500;
    public const int MaxContextEntries = 10;
    public const int MaxContextKeyLength = 50;
    public const int MaxContextValueLength = 200;
}
