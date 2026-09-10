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

        ProseAssumptionGenerationResult result = await _proseAssumptionFindingGenerator.GenerateAsync(
            context.GraphSnapshot,
            context.AnalysisContext,
            cancellationToken).ConfigureAwait(false);

        if (result.RegisterEntries.Count > 0)
            context.ProseAssumptionRegisterEntries.AddRange(result.RegisterEntries);

        if (result.Findings.Count == 0)
            return;

        context.AllFindings.AddRange(result.Findings);
        context.SuccessfulEngineTypes.Add("declaration-premise-conflict");

        _logger.LogDebug(
            "Prose assumption pass appended {GeneratedCount} findings and {RegisterCount} register rows to snapshot run {RunId}.",
            result.Findings.Count,
            result.RegisterEntries.Count,
            context.RunId);
    }
}
