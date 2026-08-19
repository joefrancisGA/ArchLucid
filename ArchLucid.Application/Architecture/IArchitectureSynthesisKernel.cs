using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Architecture synthesis kernel (Option K / EK-10): draft intake plus generate of a Created-origin
///     run. Generate does not start the authority pipeline or the four-agent review execute loop.
/// </summary>
public interface IArchitectureSynthesisKernel
{
    /// <summary>Forwards to <see cref="IArchitectureRequestDraftService.DraftAsync" />.</summary>
    Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Persists a Created-origin run header without starting Seq and without requiring
    ///     Topology/Cost/Compliance/Critic agent results.
    /// </summary>
    Task<ArchitectureSynthesisGenerateResult> GenerateAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken);
}
