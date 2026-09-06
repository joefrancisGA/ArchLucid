using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance.Preview;

/// <summary>
///     Read-only governance preview: compares manifest governance without persisting activations or workflow state.
///     Run and manifest access is routed through <see cref = "IRunDetailQueryService"/> so governance preview
///     shares the same canonical run detail path as export and compare features.
/// </summary>
public sealed class GovernancePreviewService(
    IGovernanceEnvironmentActivationRepository activationRepository,
    IRunDetailQueryService runDetailQueryService,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IGovernancePreviewService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IGovernanceEnvironmentActivationRepository _activationRepository =
        activationRepository ?? throw new ArgumentNullException(nameof(activationRepository));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private const string DiffOnlyNote = "Only governance keys that differ are listed; unchanged keys are omitted.";

    public async Task<GovernancePreviewResult> PreviewActivationAsync(GovernancePreviewRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.RunId))
            throw new ArgumentException("RunId is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.ManifestVersion))
            throw new ArgumentException("ManifestVersion is required.", nameof(request));
        string runId = request.RunId.Trim();
        string manifestVersion = request.ManifestVersion.Trim();
        string environment = GovernanceEnvironment.NormalizeAndValidate(request.Environment, nameof(request.Environment));
        // Use the canonical run detail path to validate run existence and load its manifest.
        ArchitectureRunDetail runDetail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken) ??
                                          throw new RunNotFoundException(runId);
        // The candidate manifest is the specific version being previewed — it may differ from
        // the run's current committed manifest (e.g. an older committed version is being evaluated).
        GoldenManifest? candidateManifest =
            runDetail.Manifest is not null && string.Equals(runDetail.Run.CurrentManifestVersion, manifestVersion, StringComparison.OrdinalIgnoreCase)
                ? runDetail.Manifest
                : await unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken);

        if (candidateManifest is null)
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        if (!string.Equals(candidateManifest.RunId, runId, StringComparison.Ordinal))
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await GovernancePreviewSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            candidateManifest,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        IReadOnlyList<GovernanceEnvironmentActivation> activationRows = await activationRepository.GetByEnvironmentAsync(environment, cancellationToken);
        GovernanceEnvironmentActivation? active = activationRows.FirstOrDefault(a => a.IsActive);
        List<string> notes = [DiffOnlyNote];
        GoldenManifest? currentManifest = null;

        if (active is null)
        {
            notes.Add($"No current active governance activation exists for environment '{environment}'.");
            notes.Add("Preview compares candidate governance against empty current state.");
        }
        else
        {
            currentManifest = await LoadManifestForActivationAsync(active, notes, cancellationToken);
            notes.Add(
                $"Compared current run '{active.RunId}' (manifest '{active.ManifestVersion}') to preview run '{runId}' (manifest '{manifestVersion}').");
        }

        List<GovernanceDiffItem> differences = GovernanceManifestComparer.Compare(currentManifest?.Governance, candidateManifest.Governance);
        return new GovernancePreviewResult
        {
            Environment = environment,
            CurrentRunId = active?.RunId,
            CurrentManifestVersion = active?.ManifestVersion,
            PreviewRunId = runId,
            PreviewManifestVersion = manifestVersion,
            Differences = differences,
            Notes = notes
        };
    }

    public async Task<GovernanceEnvironmentComparisonResult> CompareEnvironmentsAsync(GovernanceEnvironmentComparisonRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        string source = GovernanceEnvironment.NormalizeAndValidate(request.SourceEnvironment, nameof(request.SourceEnvironment));
        string target = GovernanceEnvironment.NormalizeAndValidate(request.TargetEnvironment, nameof(request.TargetEnvironment));

        if (string.Equals(source, target, StringComparison.Ordinal))
            throw new ArgumentException("SourceEnvironment and TargetEnvironment must be different.", nameof(request));
        List<string> notes = [DiffOnlyNote];
        IReadOnlyList<GovernanceEnvironmentActivation> sourceRows = await activationRepository.GetByEnvironmentAsync(source, cancellationToken);
        IReadOnlyList<GovernanceEnvironmentActivation> targetRows = await activationRepository.GetByEnvironmentAsync(target, cancellationToken);
        GovernanceEnvironmentActivation? sourceActive = sourceRows.FirstOrDefault(a => a.IsActive);
        GovernanceEnvironmentActivation? targetActive = targetRows.FirstOrDefault(a => a.IsActive);

        if (sourceActive is null)
            notes.Add($"No active governance activation exists for source environment '{source}'.");

        if (targetActive is null)
            notes.Add($"No active governance activation exists for target environment '{target}'.");
        GoldenManifest? sourceManifest = sourceActive is not null
            ? await LoadManifestForActivationAsync(sourceActive, notes, cancellationToken)
            : null;
        GoldenManifest? targetManifest = targetActive is not null
            ? await LoadManifestForActivationAsync(targetActive, notes, cancellationToken)
            : null;

        if (sourceActive is not null && targetActive is not null && sourceManifest is not null && targetManifest is not null)
            notes.Add($"Compared active governance states for environments '{source}' and '{target}'.");

        List<GovernanceDiffItem> differences = GovernanceManifestComparer.Compare(sourceManifest?.Governance, targetManifest?.Governance);

        return new GovernanceEnvironmentComparisonResult { SourceEnvironment = source, TargetEnvironment = target, Differences = differences, Notes = notes };
    }

    private async Task<GoldenManifest?> LoadManifestForActivationAsync(
        GovernanceEnvironmentActivation activation,
        List<string> notes,
        CancellationToken cancellationToken)
    {
        GoldenManifest? manifest =
            await _unifiedGoldenManifestReader.GetByVersionAsync(activation.ManifestVersion, cancellationToken);

        if (manifest is null)
        {
            notes.Add($"Could not load GoldenManifest for activation manifest version '{activation.ManifestVersion}'.");
            return null;
        }

        if (!string.Equals(manifest.RunId, activation.RunId, StringComparison.Ordinal))
        {
            notes.Add(
                $"Golden manifest version '{activation.ManifestVersion}' does not belong to activation run '{activation.RunId}' for environment '{activation.Environment}'.");
            return null;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await GovernancePreviewSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            manifest,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        return manifest;
    }
}
