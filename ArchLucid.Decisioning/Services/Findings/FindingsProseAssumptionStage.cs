using ArchLucid.Core.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed class FindingsProseAssumptionStage(
    IProseAssumptionFindingGenerator proseAssumptionFindingGenerator,
    ILogger<FindingsProseAssumptionStage> logger) : IFindingsProseAssumptionStage
{
    private readonly IProseAssumptionFindingGenerator _proseAssumptionFindingGenerator =
        proseAssumptionFindingGenerator ?? throw new ArgumentNullException(nameof(proseAssumptionFindingGenerator));

    private readonly ILogger<FindingsProseAssumptionStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<Contracts.Findings.Finding> generated = await _proseAssumptionFindingGenerator.GenerateAsync(
            context.GraphSnapshot,
            context.AnalysisContext,
            cancellationToken).ConfigureAwait(false);

        if (generated.Count == 0)
            return;

        context.AllFindings.AddRange(generated);
        context.SuccessfulEngineTypes.Add("declaration-premise-conflict");

        _logger.LogDebug(
            "Prose assumption pass appended {GeneratedCount} findings to snapshot run {RunId}.",
            generated.Count,
            context.RunId);
    }
}
