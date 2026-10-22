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

public sealed class OperatorShellStickinessProbe(IOperatorStickinessSnapshotReader reader) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            PilotFunnelSnapshot funnel = await reader
                .GetFunnelSnapshotAsync(
                    builder.Scope.TenantId,
                    builder.Scope.WorkspaceId,
                    builder.Scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);

            OperatorStickinessSignals signals = await reader
                .GetOperatorSignalsAsync(
                    builder.Scope.TenantId,
                    builder.Scope.WorkspaceId,
                    builder.Scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);

            builder.StickinessSnapshot = OperatorShellStickinessSnapshotMapper.Map(funnel, signals);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.StickinessSnapshot = null;
        }
    }
}
