using System.Security.Claims;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Primitives;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     Validates that optional scope headers do not disagree with JWT or API-key scope claims (TB-072).
/// </summary>
public static class ScopeIdentityBindingValidator
{
    /// <summary>Result of <see cref="Validate" />.</summary>
    public readonly record struct ScopeIdentityBindingResult(bool IsValid, string? FailureMessage)
    {
        public static ScopeIdentityBindingResult Ok() => new(true, null);

        public static ScopeIdentityBindingResult Forbidden(string message) => new(false, message);
    }

    /// <summary>
    ///     When both a claim and a header parse as GUIDs for the same dimension, they must match.
    /// </summary>
    public static ScopeIdentityBindingResult Validate(ClaimsPrincipal? user, IHeaderDictionary? headers)
    {
        ScopeIdentityBindingResult tenant = ValidateDimension(
            user,
            headers,
            "tenant_id",
            "x-tenant-id",
            "tenant");

        if (!tenant.IsValid)
            return tenant;

        ScopeIdentityBindingResult workspace = ValidateDimension(
            user,
            headers,
            "workspace_id",
            "x-workspace-id",
            "workspace");

        if (!workspace.IsValid)
            return workspace;

        return ValidateDimension(user, headers, "project_id", "x-project-id", "project");
    }

    /// <summary>
    ///     Rejects scope headers that steer a dimension when the principal has no parseable claim for that dimension (TB-072).
    /// </summary>
    public static ScopeIdentityBindingResult ValidateHeaderOnlyScopeEscalation(
        ClaimsPrincipal? user,
        IHeaderDictionary? headers,
        string? authenticationType)
    {
        if (!RequiresBoundScopeClaimsForHeaders(authenticationType))
            return ScopeIdentityBindingResult.Ok();

        ScopeIdentityBindingResult tenant = ValidateHeaderOnlyDimensionEscalation(
            user,
            headers,
            "tenant_id",
            "x-tenant-id",
            "tenant",
            authenticationType);

        if (!tenant.IsValid)
            return tenant;

        ScopeIdentityBindingResult workspace = ValidateHeaderOnlyDimensionEscalation(
            user,
            headers,
            "workspace_id",
            "x-workspace-id",
            "workspace",
            authenticationType);

        if (!workspace.IsValid)
            return workspace;

        return ValidateHeaderOnlyDimensionEscalation(
            user,
            headers,
            "project_id",
            "x-project-id",
            "project",
            authenticationType);
    }

    private static ScopeIdentityBindingResult ValidateHeaderOnlyDimensionEscalation(
        ClaimsPrincipal? user,
        IHeaderDictionary? headers,
        string claimType,
        string headerName,
        string label,
        string? authenticationType)
    {
        if (TryParseClaimGuid(user, claimType, out _))
            return ScopeIdentityBindingResult.Ok();

        if (!TryParseHeaderGuid(headers, headerName, out _))
            return ScopeIdentityBindingResult.Ok();

        if (string.Equals(claimType, "tenant_id", StringComparison.Ordinal)
            && string.Equals(authenticationType, "ApiKey", StringComparison.Ordinal))
        {
            return ScopeIdentityBindingResult.Forbidden(
                "API key authentication requires Authentication:ApiKey:TenantId (tenant_id claim); "
                + "x-tenant-id cannot be used without a bound key scope.");
        }

        return ScopeIdentityBindingResult.Forbidden(
            $"Authenticated scope is not bound to a {claimType} claim; "
            + $"{headerName} cannot be used to steer {label} scope.");
    }

    private static bool RequiresBoundScopeClaimsForHeaders(string? authenticationType)
    {
        if (string.Equals(authenticationType, "ApiKey", StringComparison.Ordinal))
            return true;

        if (string.Equals(authenticationType, "Bearer", StringComparison.Ordinal))
            return true;

        if (string.Equals(authenticationType, ScimBearerDefaults.AuthenticationScheme, StringComparison.Ordinal))
            return true;

        if (string.Equals(authenticationType, "Saml2", StringComparison.Ordinal)
            || string.Equals(authenticationType, "Saml2", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static ScopeIdentityBindingResult ValidateDimension(
        ClaimsPrincipal? user,
        IHeaderDictionary? headers,
        string claimType,
        string headerName,
        string label)
    {
        if (!TryParseClaimGuid(user, claimType, out Guid claimId))
            return ScopeIdentityBindingResult.Ok();

        if (!TryParseHeaderGuid(headers, headerName, out Guid headerId))
            return ScopeIdentityBindingResult.Ok();

        if (claimId == headerId)
            return ScopeIdentityBindingResult.Ok();

        return ScopeIdentityBindingResult.Forbidden(
            $"Scope header '{headerName}' does not match the authenticated {label} claim.");
    }

    private static bool TryParseClaimGuid(ClaimsPrincipal? user, string claimType, out Guid value)
    {
        value = Guid.Empty;
        string? raw = user?.FindFirst(claimType)?.Value;

        return !string.IsNullOrWhiteSpace(raw) && Guid.TryParse(raw, out value);
    }

    private static bool TryParseHeaderGuid(IHeaderDictionary? headers, string headerName, out Guid value)
    {
        value = Guid.Empty;

        if (headers is null || !headers.TryGetValue(headerName, out StringValues headerRaw))
            return false;

        string text = headerRaw.ToString();

        return !string.IsNullOrWhiteSpace(text) && Guid.TryParse(text, out value);
    }
}
