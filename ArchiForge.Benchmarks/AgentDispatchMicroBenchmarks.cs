using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;

using BenchmarkDotNet.Attributes;

namespace ArchiForge.Benchmarks;

/// <summary>CPU-only micro-benchmarks for agent task ordering (no LLM / SQL).</summary>
[MemoryDiagnoser]
public sealed class AgentDispatchMicroBenchmarks
{
    private AgentTask[] _tasks = [];

    [GlobalSetup]
    public void Setup()
    {
        string runId = Guid.NewGuid().ToString("N");

        _tasks =
        [
            new AgentTask { TaskId = "a", RunId = runId, AgentType = AgentType.Topology },
            new AgentTask { TaskId = "b", RunId = runId, AgentType = AgentType.Critic },
            new AgentTask { TaskId = "c", RunId = runId, AgentType = AgentType.Cost },
            new AgentTask { TaskId = "d", RunId = runId, AgentType = AgentType.Compliance },
        ];
    }

    [Benchmark(Baseline = true)]
    public AgentTask[] OrderTasksByDispatchKey()
    {
        return _tasks
            .OrderBy(t => AgentTypeKeys.ResolveDispatchKey(t), StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
