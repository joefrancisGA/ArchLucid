using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed record ExternalTicketCreateContext(
    ScopeContext Scope,
    FindingInspectResponse Inspect,
    TenantItsmOutboundSettings? TenantSettings,
    FindingSeverity Severity,
    string Summary,
    string Description);
