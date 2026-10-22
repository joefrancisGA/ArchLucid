using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-10 suggestion 95: pins κ content hash alongside <see cref="RunRecord.KnowledgeModelId" />.
/// </summary>
public static class RunHeaderKnowledgeModelContentPin
{
    public static void ApplyToHeader(RunRecord header, ArchitectureKnowledgeModel? knowledgeModel, string? knowledgeModelId)
    {
        ArgumentNullException.ThrowIfNull(header);

        if (!string.IsNullOrWhiteSpace(knowledgeModelId))
            header.KnowledgeModelId = knowledgeModelId;

        header.PinnedKnowledgeModelContentHashSha256 =
            Architecture.KnowledgeModelContentFingerprint.TryComputeContentHashSha256(knowledgeModel);
    }
}
