using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Common;

/// <summary>
///     Baseline architecture events whose durable <c>dbo.AuditEvents</c> echo must fail closed (ADR 0075 / DR-07).
/// </summary>
internal static class BaselineMutationAuditGovernedArchitectureEventTypes
{
    public static bool IsGovernedEcho(string eventType) =>
        string.Equals(eventType, AuditEventTypes.Baseline.Architecture.RunCompleted, StringComparison.Ordinal);
}
