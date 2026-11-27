using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

internal sealed class AuthTokenClaimsDiagnosticOutcome
{
    public bool IsSuccess
    {
        get;
        private init;
    }

    public AdminTokenClaimsDiagnosticResponse? Response
    {
        get;
        private init;
    }

    public string? ErrorDetail
    {
        get;
        private init;
    }

    public int? HttpStatusCode
    {
        get;
        private init;
    }

    public bool IsMissingApiKey
    {
        get;
        private init;
    }

    internal static AuthTokenClaimsDiagnosticOutcome Success(AdminTokenClaimsDiagnosticResponse response) =>
        new() { IsSuccess = true, Response = response };

    internal static AuthTokenClaimsDiagnosticOutcome FromMissingApiKey() =>
        new()
        {
            IsSuccess = false,
            IsMissingApiKey = true,
            ErrorDetail =
                "ARCHLUCID_API_KEY is unset — set an AdminAuthority key before running token diagnostics.",
        };

    internal static AuthTokenClaimsDiagnosticOutcome HttpFailure(int statusCode, string body) =>
        new()
        {
            IsSuccess = false,
            HttpStatusCode = statusCode,
            ErrorDetail = $"POST /v1/admin/auth/diagnose-token returned HTTP {statusCode}: {TrimBody(body)}",
        };

    internal static AuthTokenClaimsDiagnosticOutcome ParseFailure() =>
        new() { IsSuccess = false, ErrorDetail = "Could not parse diagnose-token JSON response." };

    private static string TrimBody(string body)
    {
        string trimmed = body.Trim();

        return trimmed.Length <= 240 ? trimmed : trimmed[..240] + "…";
    }
}
