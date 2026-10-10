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

public sealed class OperatorShellLlmMonthlyBudgetProbe(ILlmMonthlyTenantDollarBudgetStatusService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.LlmMonthlyBudgetStatus = await service.GetStatusAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.LlmMonthlyBudgetStatus = null;
        }
    }
}
