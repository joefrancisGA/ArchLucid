namespace ArchLucid.Core.DevTesting;

/// <summary>
///     Development-only HTTP header the UI proxy sends to override <c>AgentExecution:Mode</c> per request.
/// </summary>
public static class DevAgentExecutionModeHeaderNames
{
    public const string Header = "X-ArchLucid-Dev-Agent-Execution-Mode";

    public const string Real = "Real";

    public const string Simulator = "Simulator";
}
