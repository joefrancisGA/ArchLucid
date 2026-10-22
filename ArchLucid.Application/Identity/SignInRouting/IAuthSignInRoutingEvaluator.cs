namespace ArchLucid.Application.Identity.SignInRouting;

public interface IAuthSignInRoutingEvaluator
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
