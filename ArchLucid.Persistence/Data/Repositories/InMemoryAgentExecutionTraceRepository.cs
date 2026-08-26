using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IAgentExecutionTraceRepository" /> for tests (JSON clone-on-read).
/// </summary>
public sealed partial class InMemoryAgentExecutionTraceRepository : IAgentExecutionTraceRepository
{
    private readonly Lock _gate = new();
    private readonly List<AgentExecutionTrace> _items = [];
}
