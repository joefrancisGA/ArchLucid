using ArchLucid.Core.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.Coverage.Stages;

/// <summary>Loaded pack and assignment state for coverage preview emission.</summary>
public sealed class CoveragePreviewLoadResult
{
    public required IReadOnlyList<PolicyPack> Packs { get; init; }

    public required IReadOnlyList<PolicyPackAssignment> Assignments { get; init; }

    public required IReadOnlyDictionary<string, PolicyPack> PackByName { get; init; }

    public required IReadOnlyDictionary<Guid, PolicyPackAssignment> AssignmentByPackId { get; init; }
}
