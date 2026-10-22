using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class GovernanceApprovalRequestRepository(
    IDbConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider)
    : IGovernanceApprovalRequestRepository
{
    private void ApplyScopeToNewRow(GovernanceApprovalRequest item)
    {
        ScopeContext ctx = scopeContextProvider.GetCurrentScope();

        if (ctx.TenantId == Guid.Empty)
            return;

        item.TenantId = ctx.TenantId;
        item.WorkspaceId = ctx.WorkspaceId;
        item.ProjectId = ctx.ProjectId;
    }
}
