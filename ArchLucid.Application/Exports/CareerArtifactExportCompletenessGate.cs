using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Exports;

/// <summary>Applies ADR 0078 server-side blocks for career exports (FC-03).</summary>
public static class CareerArtifactExportCompletenessGate
{
    private static readonly CareerArtifactCompletenessValidator Validator = new();

    public static string? ResolveBlockedReason(CareerExportCoverageHonestyInput input, CareerArtifactCompletenessInput validatorInput)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(validatorInput);

        CareerArtifactCompletenessResult result = Validator.Evaluate(validatorInput);

        if (result.CanRender)
        {
            return null;
        }

        return result.BlockReasons.FirstOrDefault()?.Message
            ?? CareerExportCoverageHonestyComposer.ResolveBlockedReason(input);
    }

    public static void EnsureCanExport(CareerExportCoverageHonestyInput input, CareerArtifactCompletenessInput validatorInput)
    {
        string? blockedReason = ResolveBlockedReason(input, validatorInput);

        if (blockedReason is not null)
        {
            throw new CareerArtifactExportBlockedException(blockedReason);
        }
    }
}
