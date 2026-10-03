namespace ArchLucid.Application.Governance;

/// <summary>Problem type URIs returned in governance batch-review item results.</summary>
internal static class GovernanceFacadeProblemCodes
{
    public const string ValidationFailed = "https://archlucid.example.org/errors#validation-failed";
    public const string RunNotFound = "https://archlucid.example.org/errors#run-not-found";
    public const string ResourceNotFound = "https://archlucid.example.org/errors#resource-not-found";
    public const string GovernanceSelfApproval = "https://archlucid.example.org/errors#governance-self-approval";
    public const string Conflict = "https://archlucid.example.org/errors#conflict";
}
