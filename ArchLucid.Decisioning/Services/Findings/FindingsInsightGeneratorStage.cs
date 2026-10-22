using ArchLucid.Core.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed class FindingsInsightGeneratorStage(
    IInsightFindingGenerator insightFindingGenerator,
    ILogger<FindingsInsightGeneratorStage> logger) : IFindingsInsightGeneratorStage
{
    private readonly IInsightFindingGenerator _insightFindingGenerator =
        insightFindingGenerator ?? throw new ArgumentNullException(nameof(insightFindingGenerator));

    private readonly ILogger<FindingsInsightGeneratorStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<Contracts.Findings.Finding> generated = await _insightFindingGenerator.GenerateAsync(
            context.AllFindings,
            context.GraphSnapshot,
            context.AnalysisContext,
            cancellationToken).ConfigureAwait(false);

        if (generated.Count == 0)
        {
            return;
        }

        context.AllFindings.AddRange(generated);
        context.SuccessfulEngineTypes.Add("insight-generator");

        _logger.LogDebug(
            "Insight generator appended {GeneratedCount} findings to snapshot run {RunId}.",
            generated.Count,
            context.RunId);
    }
}
