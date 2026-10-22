using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Operator.Probes;

public sealed class OperatorShellAssignedToMeFindingsProbe(
    IActorContext actor,
    IArchitectureRiskRegisterService register) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<string> ids = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actor);

            if (ids.Count == 0)
            {
                builder.AssignedToMeFindingsCount = 0;
                return;
            }

            builder.AssignedToMeFindingsCount = await register.CountAsync(
                builder.Scope.TenantId,
                builder.Scope.WorkspaceId,
                builder.Scope.ProjectId,
                new ArchitectureRiskRegisterListOptions
                {
                    AssignedToUserIds = ids,
                    OpenFindingsOnly = true,
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.AssignedToMeFindingsCount = null;
        }
    }
}
