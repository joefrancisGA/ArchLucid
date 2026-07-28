using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArtifactRoundTripService
{
    bool CanRegenerate(ArtifactOwnershipClass ownership);

    bool ProposeModelDiffFromEdit(
        ArchitectureKnowledgeModel model,
        string editedArtifactId,
        string editedContent,
        bool userApprovalGranted);
}
