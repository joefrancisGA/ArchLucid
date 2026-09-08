using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Exports;

/// <summary>Applies ADR 0078 server-side blocks for career exports (FC-03).</summary>
public static class CareerArtifactExportCompletenessGate
{
    private static readonly CareerArtifactCompletenessValidator Validator = new();

    public static CareerArtifactExportBlock? ResolveBlock(
        CareerExportCoverageHonestyInput input,
        CareerArtifactCompletenessInput validatorInput)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(validatorInput);

        CareerArtifactCompletenessResult result = Validator.Evaluate(validatorInput);

        if (result.CanRender)
        {
            return null;
        }

        CareerArtifactBlockReason? primaryReason = result.BlockReasons.FirstOrDefault();

        if (primaryReason is not null)
        {
            return new CareerArtifactExportBlock(primaryReason.Code, primaryReason.Message);
        }

        string? fallbackMessage = CareerExportCoverageHonestyComposer.ResolveBlockedReason(input);

        if (fallbackMessage is null)
        {
            return null;
        }

        return new CareerArtifactExportBlock(CareerArtifactCompletenessValidator.MeasurementFloorCode, fallbackMessage);
    }

    public static string? ResolveBlockedReason(CareerExportCoverageHonestyInput input, CareerArtifactCompletenessInput validatorInput)
    {
        return ResolveBlock(input, validatorInput)?.Message;
    }

    public static void EnsureCanExport(CareerExportCoverageHonestyInput input, CareerArtifactCompletenessInput validatorInput)
    {
        CareerArtifactExportBlock? block = ResolveBlock(input, validatorInput);

        if (block is not null)
        {
            throw new CareerArtifactExportBlockedException(block.Message, block.Code);
        }
    }

    public static void EnsureCanExportFromHonestyMaterial(CareerExportCoverageHonestyInput careerExportHonesty)
    {
        ArgumentNullException.ThrowIfNull(careerExportHonesty);

        TransparencyTrail? transparencyTrail = careerExportHonesty.CoverageContext.Verdict?.TransparencyTrail;
        CareerArtifactCompletenessInput validatorInput = CareerArtifactCompletenessInputMapper.MapForExport(
            careerExportHonesty,
            transparencyTrail);
        EnsureCanExport(careerExportHonesty, validatorInput);
    }
}
