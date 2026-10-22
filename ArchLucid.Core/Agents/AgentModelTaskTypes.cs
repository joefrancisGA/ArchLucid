using ArchLucid.Contracts.Common;
using ArchLucid.Core.Llm;

namespace ArchLucid.Core.Agents;

/// <summary>Task labels used for alias approval checks (TB-869).</summary>
public static class AgentModelTaskTypes
{
    public const string Ask = "Ask";

    public const string Explanation = "Explanation";

    public const string SemanticJudge = "SemanticJudge";

    public const string Primary = "Primary";

    public const string SchemaRemediation = "SchemaRemediation";

    public const string Unknown = "Unknown";

    public static string FromAgentType(AgentType agentType)
    {
        return agentType.ToString();
    }

    public static string FromAgentTypeName(string agentTypeName)
    {
        if (string.IsNullOrWhiteSpace(agentTypeName))
        {
            return Unknown;
        }

        return agentTypeName.Trim();
    }

    public static string FromInvokeKind(LlmInvokeKind invokeKind)
    {
        return invokeKind switch
        {
            LlmInvokeKind.Ask => Ask,
            LlmInvokeKind.Explanation => Explanation,
            LlmInvokeKind.SemanticJudge => SemanticJudge,
            LlmInvokeKind.Primary => Primary,
            _ => Unknown
        };
    }
}
