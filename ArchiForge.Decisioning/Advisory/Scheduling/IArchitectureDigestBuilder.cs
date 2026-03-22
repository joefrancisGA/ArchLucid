using ArchiForge.Decisioning.Advisory.Models;

namespace ArchiForge.Decisioning.Advisory.Scheduling;

public interface IArchitectureDigestBuilder
{
    ArchitectureDigest Build(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        Guid? comparedToRunId,
        ImprovementPlan plan);
}
