using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>
///     Maps specialist-review <see cref="QualityDimension" /> values to canonical
///     <see cref="ArchitecturePillar" /> keys for persistence and posture grouping.
/// </summary>
public static class ArchitecturePillarRollup
{
    public static ArchitecturePillar FromSpecialistDimension(QualityDimension dimension)
    {
        switch (dimension)
        {
            case QualityDimension.Reliability:
                return ArchitecturePillar.ReliabilityAndResilience;
            case QualityDimension.Security:
                return ArchitecturePillar.Security;
            case QualityDimension.PerformanceScalability:
                return ArchitecturePillar.PerformanceAndScalability;
            case QualityDimension.Cost:
                return ArchitecturePillar.CostEffectiveness;
            case QualityDimension.Operations:
                return ArchitecturePillar.OperationalExcellence;
            case QualityDimension.PrivacyCompliance:
                return ArchitecturePillar.DataAndCompliance;

            // Revisable judgement: data architecture themes often span compliance and reliability.
            case QualityDimension.DataArchitecture:
                return ArchitecturePillar.DataAndCompliance;

            // Revisable judgement: integration failures usually surface as reliability gaps.
            case QualityDimension.Integration:
                return ArchitecturePillar.ReliabilityAndResilience;

            // Revisable judgement: maintainability is operational hygiene, not a separate buyer pillar.
            case QualityDimension.Maintainability:
                return ArchitecturePillar.OperationalExcellence;

            // Revisable judgement: AI-specific risk is filed under security until a dedicated pillar exists.
            case QualityDimension.AiSpecificRisk:
                return ArchitecturePillar.Security;
            default:
                throw new ArgumentOutOfRangeException(nameof(dimension), dimension, "Unhandled specialist quality dimension.");
        }
    }

    public static string ToStorageKey(ArchitecturePillar pillar)
    {
        return pillar.ToString();
    }
}
