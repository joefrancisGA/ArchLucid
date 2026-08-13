using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents;

public interface IReviewModelAliasResolver
{
    Task<ReviewModelAliasResolution> ResolveForRunCreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken);
}

public sealed record ReviewModelAliasResolution(
    string EffectiveAliasId,
    string WorkspaceDefaultAliasId,
    string? RequestedOverrideRaw,
    bool RejectedOutsideAllowedSet,
    bool RejectedMissingSubprocessorAcknowledgment);
