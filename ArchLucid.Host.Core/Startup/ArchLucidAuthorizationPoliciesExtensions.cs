using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Authorization;

using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Registers ArchLucid <see cref="AuthorizationOptions"/> policies (RBAC + permission claims).</summary>
public static class ArchLucidAuthorizationPoliciesExtensions
{
    /// <summary>
    /// Registers role- and claim-based policies. <see cref="AuthorizationOptions.FallbackPolicy"/> requires an authenticated user;
    /// use <c>[AllowAnonymous]</c> only for intentional public routes (health, version).
    /// </summary>
    public static IServiceCollection AddArchLucidAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(
                new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build())
            .AddPolicy(ArchLucidPolicies.AuthenticatedUserOnly, static policy =>
            {
                policy.RequireAuthenticatedUser();
            })
            .AddPolicy(ArchLucidPolicies.ReadAuthority, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Read));
            })
            .AddPolicy(ArchLucidPolicies.ExecuteAuthority, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Execute));
                policy.Requirements.Add(new TrialActiveRequirement());
            })
            .AddPolicy(ArchLucidPolicies.AdminAuthority, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.TenantAdminOnly));
                policy.Requirements.Add(new TrialActiveRequirement());
            })
            .AddPolicy(ArchLucidPolicies.PolicyPackMutationAuthority, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.PolicyPackMutation));
                policy.Requirements.Add(new TrialActiveRequirement());
            })
            .AddPolicy(ArchLucidPolicies.RequireAuditor, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole(
                    ArchLucidRoles.Auditor,
                    ArchLucidRoles.Admin,
                    ArchLucidRoles.WorkspaceAdmin);
            })
            .AddPolicy(ArchLucidPolicies.CanCommitRuns, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.CommitRun));
            })
            .AddPolicy("CanSeedResults", policy =>
                policy.RequireClaim("permission", "seed:results"))
            .AddPolicy(ArchLucidPolicies.CanExportConsultingDocx, policy =>
                policy.RequireClaim("permission", "export:consulting-docx"))
            .AddPolicy(ArchLucidPolicies.CanReplayComparisons, policy =>
                policy.RequireClaim("permission", "replay:comparisons"))
            .AddPolicy(ArchLucidPolicies.CanViewReplayDiagnostics, policy =>
                policy.RequireClaim("permission", "replay:diagnostics"))
            .AddPolicy(ArchLucidPolicies.RequireOperatorRole, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Execute));
                policy.Requirements.Add(new TrialActiveRequirement());
            })
            .AddPolicy(ArchLucidPolicies.ScimWrite, policy =>
            {
                policy.AddAuthenticationSchemes(ScimBearerDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
            })
            .AddPolicy(ArchLucidPolicies.ArchitectureDefinitionImport, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.Requirements.Add(
                    new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.ArchitectureDefinitionImport));
                policy.Requirements.Add(new TrialActiveRequirement());
            })
            .AddPolicy(ArchLucidPolicies.PlatformTenantDeletionAuthority, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireClaim("permission", "platform:tenant-delete");
            });

        return services;
    }
}
