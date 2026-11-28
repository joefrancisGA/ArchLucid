using System.Collections.ObjectModel;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPrioritization;

public enum RemediationAdvisoryEvidence
{
    Recorded,
    Missing,
    Unrecognized,
    Conflicting,
}

/// <summary>A unitless ordinal factor. Contribution bounds are in weighted points before normalization.</summary>
public sealed record RemediationAdvisoryFactor(
    RemediationRiskFactor Factor,
    RemediationAdvisoryEvidence Evidence,
    decimal? NormalizedValue,
    decimal Weight,
    decimal LowerContribution,
    decimal UpperContribution);

/// <summary>A bounded ordinal axis, not a calibrated probability.</summary>
public sealed record RemediationAdvisoryAxis(
    decimal? LowerBound,
    decimal? UpperBound,
    decimal? Score,
    IReadOnlyList<RemediationAdvisoryFactor> Factors);

public sealed record RemediationRiskAdvisoryReport(
    string RuleVersion,
    RemediationAdvisoryAxis Urgency,
    RemediationAdvisoryAxis ExecutionRisk,
    IReadOnlyDictionary<RemediationRiskFactor, decimal> EffectiveWeights);

public static partial class RemediationRiskScoreEvaluator
{
    public const string AdvisoryRuleVersion = "IE15-priority-v2-shadow";

    /// <summary>
    /// Compare urgency and execution risk without changing v1 ordering or stored scores.
    /// Null means unverified evidence. False is an explicit negative observation, not a missing value.
    /// Compensating controls must be independently verified for this finding to receive mitigation credit.
    /// </summary>
    public static RemediationRiskAdvisoryReport EvaluateAdvisory(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        bool? verifiedCompensatingControls,
        RemediationAutomationLevel? automationLevel,
        bool? rollbackDefined,
        IReadOnlyDictionary<RemediationRiskFactor, decimal>? weightOverrides = null)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(metadata);

        Dictionary<RemediationRiskFactor, decimal> weights = DefaultWeights().ToDictionary();
        if (weightOverrides is not null)
        {
            foreach ((RemediationRiskFactor factor, decimal weight) in weightOverrides)
            {
                if (!weights.ContainsKey(factor))
                    throw new ArgumentException("An advisory weight refers to an unknown factor.", nameof(weightOverrides));

                if (weight is < 0m or > 1m)
                    throw new ArgumentOutOfRangeException(nameof(weightOverrides), "Advisory weights must be in [0, 1].");

                weights[factor] = weight;
            }
        }

        RemediationAdvisoryFactor Factor(RemediationRiskFactor factor, FactorEvidence evidence, bool mitigation = false)
        {
            decimal weight = weights[factor];
            decimal lower = evidence.Value ?? 0m;
            decimal upper = evidence.Value ?? 1m;
            return new(factor, evidence.Status, evidence.Value, weight,
                mitigation ? -upper * weight : lower * weight,
                mitigation ? -lower * weight : upper * weight);
        }

        RemediationAdvisoryFactor[] urgency =
        [
            Factor(RemediationRiskFactor.Severity, Recorded(finding.Severity, RecognizedSeverity)),
            Factor(RemediationRiskFactor.Exploitability, Recorded(finding.Exploitability, RecognizedLevel)),
            Factor(RemediationRiskFactor.KnownExploitation,
                RecordedMetadata(metadata, RecognizedBoolean, "knownExploitation", "known_exploitation")),
            Factor(RemediationRiskFactor.InternetExposure, Recorded(finding.Exposure, RecognizedLevel)),
            Factor(RemediationRiskFactor.IdentityControlPlaneImpact,
                RecordedMetadata(metadata, RecognizedLevel, "identityControlPlaneImpact", "identity_control_plane_impact")),
            Factor(RemediationRiskFactor.AssetCriticality, Recorded(finding.BusinessCriticality, RecognizedLevel)),
            Factor(RemediationRiskFactor.DataSensitivity, RecordedMetadata(metadata, RecognizedLevel, "dataSensitivity", "data_sensitivity")),
            Factor(RemediationRiskFactor.BlastRadius, Recorded(finding.BlastRadius, RecognizedLevel)),
            Factor(RemediationRiskFactor.CompensatingControls, EvidenceValue(verifiedCompensatingControls switch
            {
                true => 1m,
                false => 0m,
                _ => null
            }), mitigation: true),
        ];

        decimal? automation = automationLevel.HasValue ? RecognizedAutomation(automationLevel.Value) : null;
        FactorEvidence complexity = automationLevel.HasValue && automation is null
            ? new(null, RemediationAdvisoryEvidence.Unrecognized)
            : EvidenceValue(1m - automation);
        RemediationAdvisoryFactor[] execution =
        [
            Factor(RemediationRiskFactor.RemediationComplexity, complexity),
            Factor(RemediationRiskFactor.RemediationRisk, EvidenceValue(rollbackDefined switch
            {
                true => 0.25m,
                false => 0.75m,
                _ => null
            })),
        ];

        decimal urgencyMass = urgency.Where(item => item.Factor != RemediationRiskFactor.CompensatingControls)
            .Sum(item => item.Weight);
        return new(AdvisoryRuleVersion, BuildAxis(urgency, urgencyMass), BuildAxis(execution, execution.Sum(item => item.Weight)),
            new ReadOnlyDictionary<RemediationRiskFactor, decimal>(weights));
    }

    private static RemediationAdvisoryAxis BuildAxis(RemediationAdvisoryFactor[] factors, decimal mass)
    {
        IReadOnlyList<RemediationAdvisoryFactor> readOnly = Array.AsReadOnly(factors);
        if (mass == 0m)
            return new(null, null, null, readOnly);

        decimal lower = Math.Clamp(factors.Sum(item => item.LowerContribution), 0m, mass) / mass;
        decimal upper = Math.Clamp(factors.Sum(item => item.UpperContribution), 0m, mass) / mass;
        bool fullyObserved = factors.All(item => item.Weight == 0m || item.Evidence == RemediationAdvisoryEvidence.Recorded);
        return new(lower, upper, fullyObserved ? lower : null, readOnly);
    }

    private static FactorEvidence Recorded(string? raw, Func<string?, decimal?> normalize) =>
        string.IsNullOrWhiteSpace(raw) ? EvidenceValue(null) :
        normalize(raw) is { } value ? EvidenceValue(value) : new(null, RemediationAdvisoryEvidence.Unrecognized);

    private static FactorEvidence RecordedMetadata(
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata, Func<string?, decimal?> normalize,
        string first, string second)
    {
        decimal? value = null;
        bool unrecognized = false;
        foreach (OperationalSecurityFindingMetadataRecord record in metadata)
        {
            if ((!string.Equals(record.MetadataKey, first, StringComparison.OrdinalIgnoreCase)
                 && !string.Equals(record.MetadataKey, second, StringComparison.OrdinalIgnoreCase))
                || string.IsNullOrWhiteSpace(record.MetadataValue))
                continue;

            decimal? candidate = normalize(record.MetadataValue);
            if (candidate is null)
                unrecognized = true;
            else if (value is not null && value != candidate)
                return new(null, RemediationAdvisoryEvidence.Conflicting);
            else
                value = candidate;
        }

        return unrecognized ? new(null, RemediationAdvisoryEvidence.Unrecognized) : EvidenceValue(value);
    }

    private static FactorEvidence EvidenceValue(decimal? value) =>
        new(value, value.HasValue ? RemediationAdvisoryEvidence.Recorded : RemediationAdvisoryEvidence.Missing);

    private readonly record struct FactorEvidence(decimal? Value, RemediationAdvisoryEvidence Status);
}
