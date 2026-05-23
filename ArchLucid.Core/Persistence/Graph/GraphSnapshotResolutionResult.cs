using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Result of <see cref="GraphSnapshotReuseEvaluator.ResolveAsync" />: the snapshot plus how it was produced (for
///     diagnostics).
/// </summary>
/// <param name="Snapshot">The graph snapshot for the run.</param>
/// <param name="ResolutionMode">
///     <c>fresh_canonical_change</c> â€” context fingerprint differs from latest committed; graph rebuilt.
///     <c>fresh_no_stored_graph</c> â€” context matched prior but no stored graph; rebuilt.
///     <c>cloned_from_prior_graph</c> â€” reused topology from a prior run with equivalent context (deterministic clone).
/// </param>
public sealed record GraphSnapshotResolutionResult(GraphSnapshot Snapshot, string ResolutionMode);

