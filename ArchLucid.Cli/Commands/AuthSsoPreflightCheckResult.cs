namespace ArchLucid.Cli.Commands;

/// <summary>One row in <c>archlucid auth sso-preflight</c> output (no secrets).</summary>
internal sealed record AuthSsoPreflightCheckResult(
    string Component,
    AuthSsoPreflightCheckStatus Status,
    string Detail);

internal enum AuthSsoPreflightCheckStatus
{
    Pass = 0,
    Warn = 1,
    Fail = 2,
    Info = 3,
}
