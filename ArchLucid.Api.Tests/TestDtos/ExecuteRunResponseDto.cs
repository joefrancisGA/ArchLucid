using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Tests.TestDtos;

public sealed class ExecuteRunResponseDto
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public List<AgentResult> Results
    {
        get;
        set;
    } = [];
}
