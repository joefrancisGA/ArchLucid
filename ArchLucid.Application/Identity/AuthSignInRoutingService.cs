using ArchLucid.Application.Identity.SignInRouting;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public enum AuthSignInRoutingDecision
{
    AllowEmailCode = 0,
    RequireEnterpriseSso = 1
}

public sealed class AuthSignInRoutingEvaluation
{
    public AuthSignInRoutingDecision Decision
    {
        get;
        init;
    }

    public bool AllowEmailCode => Decision == AuthSignInRoutingDecision.AllowEmailCode;

    public bool SsoRequired => Decision == AuthSignInRoutingDecision.RequireEnterpriseSso;

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;

    public string? SafeReturnPath
    {
        get;
        init;
    }

    public AuthSignInRoutingBypassKind BypassKind
    {
        get;
        init;
    }
}

public sealed class AuthSignInRoutingRequest
{
    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ReturnPath
    {
        get;
        init;
    }
}

public interface IAuthSignInRoutingService
{
    Task<AuthSignInRoutingEvaluation> EvaluateAsync(
        AuthSignInRoutingRequest request,
        CancellationToken cancellationToken);

    Task<AuthSignInRoutingEvaluation> EvaluateEnforcementPreviewAsync(
        AuthSignInRoutingRequest request,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken);
}

/// <inheritdoc cref="IAuthSignInRoutingService" />
public sealed class AuthSignInRoutingService(IAuthSignInRoutingEvaluator evaluator) : IAuthSignInRoutingService
{
    private readonly IAuthSignInRoutingEvaluator _evaluator =
        evaluator ?? throw new ArgumentNullException(nameof(evaluator));

    public Task<AuthSignInRoutingEvaluation> EvaluateAsync(
        AuthSignInRoutingRequest request,
        CancellationToken cancellationToken) =>
        _evaluator.EvaluateAsync(request, cancellationToken);

    public Task<AuthSignInRoutingEvaluation> EvaluateEnforcementPreviewAsync(
        AuthSignInRoutingRequest request,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken) =>
        _evaluator.EvaluateEnforcementPreviewAsync(request, tenantId, normalizedDomain, cancellationToken);
}
