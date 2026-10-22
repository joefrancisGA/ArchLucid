using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings;

/// <summary>
///     ADR 0099: rescore Unchecked decision-grade rows with the Premium LLM judge before finalize honesty.
/// </summary>
public interface IFindingSemanticSupportBandFinalizeJudge
{
    Task ApplyAsync(
        ArchitectureRun run,
        FindingsSnapshot snapshot,
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}
