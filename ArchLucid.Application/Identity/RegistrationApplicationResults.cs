using ArchLucid.Core.Marketing;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

/// <summary>HTTP-agnostic input for anonymous tenant self-registration.</summary>
public sealed class TenantSelfRegistrationRequest
{
    public string OrganizationName
    {
        get;
        init;
    } = string.Empty;

    public string AdminEmail
    {
        get;
        init;
    } = string.Empty;

    public string? AdminDisplayName
    {
        get;
        init;
    }

    public decimal? BaselineReviewCycleHours
    {
        get;
        init;
    }

    public string? BaselineReviewCycleSource
    {
        get;
        init;
    }

    public string? CompanySize
    {
        get;
        init;
    }

    public int? ArchitectureTeamSize
    {
        get;
        init;
    }

    public string? IndustryVertical
    {
        get;
        init;
    }

    public string? IndustryVerticalOther
    {
        get;
        init;
    }

    public string? ClientIp
    {
        get;
        init;
    }

    public MarketingAttributionSnapshot? FirstTouch
    {
        get;
        init;
    }
}

/// <summary>Outcome of <see cref="IRegistrationApplicationService.RegisterAsync"/>.</summary>
public enum RegistrationOutcome
{
    Created,
    InviteOnly,
    BodyRequired,
    ValidationFailed,
    Conflict,
    InternalError,
}

/// <summary>Result of <see cref="IRegistrationApplicationService.RegisterAsync"/>.</summary>
public sealed record RegistrationResult(
    RegistrationOutcome Outcome,
    string UserMessage,
    TenantProvisioningResult? Provisioned = null)
{
    public static RegistrationResult Created(TenantProvisioningResult provisioned) =>
        new(RegistrationOutcome.Created, string.Empty, provisioned);

    public static RegistrationResult InviteOnly(string message) =>
        new(RegistrationOutcome.InviteOnly, message);

    public static RegistrationResult BodyRequired(string message) =>
        new(RegistrationOutcome.BodyRequired, message);

    public static RegistrationResult ValidationFailed(string message) =>
        new(RegistrationOutcome.ValidationFailed, message);

    public static RegistrationResult Conflict(string message) =>
        new(RegistrationOutcome.Conflict, message);

    public static RegistrationResult InternalError(string message) =>
        new(RegistrationOutcome.InternalError, message);
}
