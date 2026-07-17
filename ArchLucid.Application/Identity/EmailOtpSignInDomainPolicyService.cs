using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public enum EmailOtpSignInDomainDecision
{
    AllowEmailOtp = 0,
    RequireEnterpriseSso = 1
}

public sealed class EmailOtpSignInDomainEvaluation
{
    public EmailOtpSignInDomainDecision Decision
    {
        get;
        init;
    }

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;

    public AuthSignInRoutingBypassKind BypassKind
    {
        get;
        init;
    }
}

public interface IEmailOtpSignInDomainPolicyService
{
    Task<EmailOtpSignInDomainEvaluation> EvaluateAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken);
}

public sealed class EmailOtpSignInDomainPolicyService(IAuthSignInRoutingService routingService)
    : IEmailOtpSignInDomainPolicyService
{
    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    public async Task<EmailOtpSignInDomainEvaluation> EvaluateAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        AuthSignInRoutingEvaluation evaluation = await _routingService.EvaluateAsync(
            new AuthSignInRoutingRequest
            {
                NormalizedEmail = normalizedEmail,
                InvitationToken = invitationToken
            },
            cancellationToken).ConfigureAwait(false);

        if (evaluation.SsoRequired)
        {
            return new EmailOtpSignInDomainEvaluation
            {
                Decision = EmailOtpSignInDomainDecision.RequireEnterpriseSso,
                CustomerMessage = evaluation.CustomerMessage
            };
        }

        return new EmailOtpSignInDomainEvaluation
        {
            Decision = EmailOtpSignInDomainDecision.AllowEmailOtp,
            BypassKind = evaluation.BypassKind
        };
    }
}
