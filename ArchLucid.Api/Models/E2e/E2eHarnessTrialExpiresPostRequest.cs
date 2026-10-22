using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.E2e;

/// <summary>Body for <c>POST /v1/e2e/trial/set-expires</c> (harness only).</summary>
// ReSharper disable once InconsistentNaming
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class E2eHarnessTrialExpiresPostRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }
}
