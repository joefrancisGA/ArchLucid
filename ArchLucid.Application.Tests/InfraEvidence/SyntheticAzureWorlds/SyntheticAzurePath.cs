using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;

internal sealed class SyntheticAzurePath
{
    public required Guid PathId { get; init; }

    public required PathKind PathKind { get; init; }

    public required PathConfidenceBand ConfidenceBand { get; init; }

    public Guid? CrownJewelAssertionId { get; init; }

    public IReadOnlyList<SyntheticAzureHop> Hops { get; init; } = [];
}
