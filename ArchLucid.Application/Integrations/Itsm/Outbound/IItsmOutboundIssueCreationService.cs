using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public interface IItsmOutboundIssueCreationService
{
    Task<ItsmOutboundIssueCreationResult> TryCreateForFindingAsync(
        ItsmOutboundIssueProvider provider,
        ScopeContext scope,
        string findingId,
        CancellationToken ct);
}
