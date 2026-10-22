using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Services.Findings;

partial class FindingsEngineInvokeStage
{
    private bool TryAcceptValidatedFinding(
        IFindingPayloadValidator validator,
        Finding finding,
        EngineAdapter engine,
        List<FindingEngineFailure> engineFailures,
        out string? rejectionReason)
    {
        if (FindingPayloadValidatorExtensions.TryValidate(validator, finding, out rejectionReason))
            return true;

        engineFailures.Add(
            new FindingEngineFailure
            {
                EngineType = engine.EngineType,
                Category = engine.Category,
                ErrorMessage =
                    $"Dropped finding '{finding.FindingId}' ({finding.FindingType}): {rejectionReason}",
                ExceptionType = nameof(InvalidOperationException),
                DurationMs = 0,
                OccurredUtc = _clock.UtcNowDateTime(),
            });

        ArchLucidInstrumentation.RecordFindingEngineFailure(engine.EngineType, engine.Category);
        return false;
    }
}
