using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Decisioning.Decisions;

public static class DecisionRecordMapper
{
    public static DecisionNodeRecord ToRecord(DecisionNode domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        return RoundTrip<DecisionNode, DecisionNodeRecord>(domain);
    }

    public static DecisionNode ToDomain(DecisionNodeRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return RoundTrip<DecisionNodeRecord, DecisionNode>(record);
    }

    public static AgentEvaluationRecord ToRecord(AgentEvaluation domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        return RoundTrip<AgentEvaluation, AgentEvaluationRecord>(domain);
    }

    public static AgentEvaluation ToDomain(AgentEvaluationRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return RoundTrip<AgentEvaluationRecord, AgentEvaluation>(record);
    }

    public static IReadOnlyList<DecisionNodeRecord> ToRecords(IReadOnlyCollection<DecisionNode> domains)
    {
        ArgumentNullException.ThrowIfNull(domains);

        return domains.Select(ToRecord).ToList();
    }

    public static IReadOnlyList<DecisionNode> ToDomain(IReadOnlyList<DecisionNodeRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        return records.Select(ToDomain).ToList();
    }

    public static IReadOnlyList<AgentEvaluationRecord> ToRecords(IReadOnlyCollection<AgentEvaluation> domains)
    {
        ArgumentNullException.ThrowIfNull(domains);

        return domains.Select(ToRecord).ToList();
    }

    public static IReadOnlyList<AgentEvaluation> ToDomain(IReadOnlyList<AgentEvaluationRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        return records.Select(ToDomain).ToList();
    }

    private static TTarget RoundTrip<TSource, TTarget>(TSource source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        TTarget? target = JsonSerializer.Deserialize<TTarget>(json, ContractJson.Default);

        return target ?? throw new InvalidOperationException(
            $"DecisionRecordMapper round-trip produced null {typeof(TTarget).Name}.");
    }
}
