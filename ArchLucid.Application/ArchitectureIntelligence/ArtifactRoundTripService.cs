using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArtifactRoundTripService : IArtifactRoundTripService
{
    public bool CanRegenerate(ArtifactOwnershipClass ownership)
    {
        return ownership switch
        {
            ArtifactOwnershipClass.Managed => true,
            ArtifactOwnershipClass.Hybrid => true,
            ArtifactOwnershipClass.Imported => false,
            _ => false,
        };
    }

    public bool ProposeModelDiffFromEdit(
        ArchitectureKnowledgeModel model,
        string editedArtifactId,
        string editedContent,
        bool userApprovalGranted)
    {
        ArgumentNullException.ThrowIfNull(model);

        if (string.IsNullOrWhiteSpace(editedArtifactId))
        {
            throw new ArgumentException("EditedArtifactId is required.", nameof(editedArtifactId));
        }

        if (string.IsNullOrWhiteSpace(editedContent))
        {
            throw new ArgumentException("EditedContent is required.", nameof(editedContent));
        }

        if (!userApprovalGranted)
        {
            return false;
        }

        model.Elements.Add(new ArchitectureModelElement
        {
            ElementId = Guid.NewGuid().ToString("N"),
            Kind = ArchitectureElementKind.Assumption,
            Name = $"Edited artifact delta for {editedArtifactId}",
            Description = editedContent,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.UserAsserted,
                SupportStatus = SupportStatus.DirectlyEstablished,
                Confidence = 1.0,
                SourceArtifactId = editedArtifactId,
                Notes = "User-approved artifact round-trip edit.",
            },
        });

        model.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return true;
    }
}
