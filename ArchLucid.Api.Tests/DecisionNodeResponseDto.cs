using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Api.Tests;

public sealed class DecisionNodeResponseDto
{
    public List<DecisionNodeRecord> Decisions
    {
        get;
        set;
    } = [];
}
