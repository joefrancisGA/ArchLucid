namespace ArchLucid.Core.Configuration;

/// <summary>
///     Keyed DI registration for the judge-only <c>IAgentCompletionClient</c> (see AgentRuntime). Inner Azure client uses
///     JSON object mode (no AgentResult schema); outer stack matches agent completions via
///     <c>LlmCompletionAccountingClient</c> — same tenant token windows and monthly USD cap as agents (no separate judge bucket).
/// </summary>
public static class AgentOutputLlmJudgeCompletionServiceKey
{
    public const string Value = "ArchLucid.AgentOutput.LlmJudge.IAgentCompletionClient";
}
