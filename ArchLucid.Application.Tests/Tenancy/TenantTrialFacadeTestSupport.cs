using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Tenancy;

internal static class TenantTrialFacadeTestSupport
{
    public static TenantTrialFacade Create(
        ITenantRepository tenants,
        IScopeContextProvider scopeProvider,
        IAuditService audit,
        IBillingTrialConversionGate gate,
        ITrialIdentityUserRepository trialUsers,
        ISelfServiceTrialAbuseRepository trialAbuseRepository,
        IOptionsMonitor<TrialLifecycleSchedulerOptions> schedulerOpts) =>
        new(
            tenants,
            scopeProvider,
            new TenantTrialAbuseGuard(trialUsers, trialAbuseRepository),
            new TenantTrialIdentityHandoffStage(tenants, trialUsers, audit),
            new TenantTrialConversionStage(tenants, scopeProvider, audit, gate),
            schedulerOpts);
}
