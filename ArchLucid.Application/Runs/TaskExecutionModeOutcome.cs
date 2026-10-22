using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>
/// Final persisted execution-mode inputs for one agent task (INV-002 / TB-969).
/// </summary>
/// <param name="TaskId">Stable agent task identifier within the run.</param>
/// <param name="Mode">Final structural mode for this task after execute or selective resume.</param>
/// <param name="CacheServed">When true, the completion was served from cache; does not change <paramref name="Mode" />.</param>
public readonly record struct TaskExecutionModeOutcome(string TaskId, StructuralExecutionMode Mode, bool CacheServed = false);
