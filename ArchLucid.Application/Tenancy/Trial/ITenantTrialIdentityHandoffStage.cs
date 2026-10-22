using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy.Trial;

public interface ITenantTrialIdentityHandoffStage
{
    Task<TenantTrialLinkEntraResult> LinkEntraAsync(
        TenantTrialLinkEntraBody body,
        TenantRecord tenant,
        ScopeContext scope,
        string actor,
        string? normalizedLocalEmail,
        bool hasIdentityPayload,
        CancellationToken cancellationToken);
}
