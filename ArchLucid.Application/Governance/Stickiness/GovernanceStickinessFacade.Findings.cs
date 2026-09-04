using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    private async Task EnsureRunInScopeWhenProvidedAsync(ScopeContext scope, Guid? runId, CancellationToken ct)
    {
        if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
            return;

        Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, resolvedRunId, ct)
            .ConfigureAwait(false);

        if (run is null)
            throw new RunNotFoundException(resolvedRunId.ToString("D"));
    }

    private async Task EnsureManifestMatchesRunWhenProvidedAsync(
        ScopeContext scope,
        Guid? runId,
        Guid? manifestId,
        CancellationToken ct)
    {
        if (manifestId is Guid resolvedManifestId && resolvedManifestId != Guid.Empty)
        {
            if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Run id is required when manifest id is specified.",
                    nameof(runId));
            }

            Persistence.Models.RunRecord? run = await _runRepository
                .GetByIdAsync(scope, resolvedRunId, ct)
                .ConfigureAwait(false);

            if (run is null)
                throw new RunNotFoundException(resolvedRunId.ToString("D"));

            if (run.GoldenManifestId is not Guid boundManifest || boundManifest != resolvedManifestId)
            {
                throw new GoldenManifestVersionNotFoundException(
                    resolvedManifestId.ToString("D"),
                    resolvedRunId.ToString("D"));
            }

            return;
        }

        if (runId is not Guid _ || runId == Guid.Empty)
            return;
    }

    private async Task EnsureFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
        _ = await RequireFindingInspectInScopeAsync(scope, findingId, ct);
    }

    private async Task<FindingInspectResponse> RequireFindingInspectInScopeAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct)
    {
        findingId = findingId.Trim();

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId,
            ct,
            FindingInspectReadOptions.MetadataOnly);

        if (finding is null)
            throw new InvalidOperationException("Finding was not found.");

        return finding;
    }

    private static void EnsureRunMatchesFindingAuthorityRun(Guid? runId, FindingInspectResponse finding)
    {
        if (finding.RunId == Guid.Empty)
            return;

        if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
        {
            throw new ArgumentException(
                "runId is required when the finding is bound to an authority run.",
                nameof(runId));
        }

        if (finding.RunId != resolvedRunId)
        {
            throw new ArgumentException(
                "runId does not match the finding's authority run.",
                nameof(runId));
        }
    }

    private async Task<bool> IsFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
        findingId = findingId.Trim();

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId,
            ct,
            FindingInspectReadOptions.MetadataOnly);

        return finding is not null;
    }
}
