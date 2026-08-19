using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.ArtifactSynthesis.Services;

/// <summary>
///     Synthesizes an <see cref="ArtifactBundle" /> from a committed <see cref="ManifestDocument" /> by invoking
///     all registered <see cref="IArtifactGenerator" /> implementations and validating the resulting bundle.
/// </summary>
/// <remarks>
///     Generators are invoked in ascending <see cref="IArtifactGenerator.ArtifactType" /> order to produce
///     deterministic bundle output. The bundle trace records which generators ran and any diagnostic notes.
/// </remarks>
public class ArtifactSynthesisService(
    IEnumerable<IArtifactGenerator> generators,
    IArtifactBundleValidator validator,
    ITechnologyLedgerArtifactLinter technologyLedgerArtifactLinter,
    IOptions<TechnologyLedgerArtifactLintOptions> artifactLintOptions,
    ILogger<ArtifactSynthesisService> logger)
    : IArtifactSynthesisService
{
    private const string NoArtifactsNote = "No artifacts were generated.";

    private readonly ITechnologyLedgerArtifactLinter _technologyLedgerArtifactLinter =
        technologyLedgerArtifactLinter ?? throw new ArgumentNullException(nameof(technologyLedgerArtifactLinter));

    private readonly IOptions<TechnologyLedgerArtifactLintOptions> _artifactLintOptions =
        artifactLintOptions ?? throw new ArgumentNullException(nameof(artifactLintOptions));

    public Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        return SynthesizeAsync(manifest, [], ct);
    }

    public async Task<ArtifactBundle> SynthesizeAsync(
        ManifestDocument manifest,
        IReadOnlyList<TechnologyLedgerEntry> technologyLedgerEntries,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(technologyLedgerEntries);

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation(
                "Artifact synthesis starting: RunId={RunId}, ManifestId={ManifestId}, GeneratorCount={GeneratorCount}",
                manifest.RunId,
                manifest.ManifestId,
                generators.Count());

        ArtifactBundle bundle = new()
        {
            TenantId = manifest.TenantId,
            WorkspaceId = manifest.WorkspaceId,
            ProjectId = manifest.ProjectId,
            BundleId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Trace = new SynthesisTrace
            {
                TraceId = Guid.NewGuid(),
                RunId = manifest.RunId,
                ManifestId = manifest.ManifestId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                SourceDecisionIds = manifest.Decisions.Select(x => x.DecisionId).ToList()
            }
        };

        List<string> decisionIds = manifest.Decisions.Select(x => x.DecisionId).ToList();

        foreach (IArtifactGenerator generator in generators.OrderBy(x => x.ArtifactType,
                     StringComparer.OrdinalIgnoreCase))
        {
            SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, ct);
            foreach (string id in decisionIds)
                artifact.ContributingDecisionIds.Add(id);
            bundle.Artifacts.Add(artifact);
            bundle.Trace.GeneratorsUsed.Add(generator.GetType().Name);
        }

        if (bundle.Artifacts.Count == 0)
        {
            bundle.Trace.Notes.Add(NoArtifactsNote);

            if (logger.IsEnabled(LogLevel.Warning))

                logger.LogWarning(
                    "Artifact synthesis produced zero artifacts: RunId={RunId}, ManifestId={ManifestId}, TraceId={TraceId}",
                    manifest.RunId,
                    manifest.ManifestId,
                    bundle.Trace.TraceId);
        }

        validator.Validate(bundle);
        ApplyTechnologyLedgerArtifactLint(bundle, technologyLedgerEntries);

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation(
                "Artifact synthesis completed: RunId={RunId}, ManifestId={ManifestId}, TraceId={TraceId}, ArtifactCount={ArtifactCount}, GeneratorsUsed={GeneratorsUsed}",
                manifest.RunId,
                manifest.ManifestId,
                bundle.Trace.TraceId,
                bundle.Artifacts.Count,
                string.Join(',', bundle.Trace.GeneratorsUsed));

        return bundle;
    }

    private void ApplyTechnologyLedgerArtifactLint(
        ArtifactBundle bundle,
        IReadOnlyList<TechnologyLedgerEntry> technologyLedgerEntries)
    {
        TechnologyLedgerArtifactLintOptions options = _artifactLintOptions.Value;
        options.Normalize();

        if (!options.Enabled)
            return;

        IReadOnlyList<TechnologyLedgerArtifactLintFinding> lintFindings =
            _technologyLedgerArtifactLinter.Lint(bundle, technologyLedgerEntries, options);

        if (lintFindings.Count == 0)
            return;

        if (options.Mode == TechnologyConsistencyFindingEngineMode.Enforcing)
        {
            string summary = string.Join(
                "; ",
                lintFindings.Select(static finding =>
                    $"{finding.RuleId}@{finding.ArtifactType}:{finding.MatchedToken}"));

            throw new InvalidOperationException($"Technology ledger artifact lint failed: {summary}");
        }

        foreach (TechnologyLedgerArtifactLintFinding finding in lintFindings)
        {
            bundle.Trace.Notes.Add(
                $"TechnologyLedgerArtifactLint[{finding.RuleId}]: {finding.Message} (artifact={finding.ArtifactType}, token={finding.MatchedToken})");
        }

        bundle.Status = ArtifactBundleStatus.Partial;
    }
}
