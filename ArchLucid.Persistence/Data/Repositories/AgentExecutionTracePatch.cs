using ArchLucid.Contracts.Agents;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Result of a successful trace blob read-modify-write: the mutated trace plus its re-serialized JSON. Callers need
///     both because the typed columns dual-written alongside the blob (TB-931) are set from post-merge trace values.
/// </summary>
/// <param name="Trace">The stored trace after the caller's mutation was applied.</param>
/// <param name="Json">The re-serialized blob to write back to <c>TraceJson</c>.</param>
internal sealed record AgentExecutionTracePatch(AgentExecutionTrace Trace, string Json);
