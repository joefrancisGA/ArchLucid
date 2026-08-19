using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Produces tenant-scoped pilot report cards grounded in relational pilots telemetry.</summary>
public interface IPilotReportCardService
{
    Task<PilotReportCard> GenerateReportCardAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        CancellationToken cancellationToken);
}
