using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

internal static class ServiceNowUrgencyImpactResolver
{
    public static (string Urgency, string Impact) Resolve(FindingSeverity severity) =>
        severity switch
        {
            FindingSeverity.Critical => ("1", "1"),
            FindingSeverity.Error => ("2", "1"),
            FindingSeverity.Warning => ("3", "2"),
            _ => ("3", "3")
        };
}
