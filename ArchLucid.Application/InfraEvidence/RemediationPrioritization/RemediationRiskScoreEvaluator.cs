using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPrioritization;

public sealed class RemediationRiskFactorContribution
{
    public RemediationRiskFactor Factor
    {
        get;
        init;
    }

    public decimal NormalizedValue
    {
        get;
        init;
    }

    public decimal Weight
    {
        get;
        init;
    }

    public decimal WeightedContribution
    {
        get;
        init;
    }

    public string Source
    {
        get;
        init;
    } = string.Empty;
}

public sealed class RemediationRiskScoreResult
{
    public decimal TotalScore
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationRiskFactorContribution> Contributions
    {
        get;
        init;
    } = [];

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string BreakdownJson
    {
        get;
        init;
    } = string.Empty;
}

/// <summary>Deterministic, explainable remediation priority scoring (no LLM).</summary>
public static class RemediationRiskScoreEvaluator
{
    public static IReadOnlyDictionary<RemediationRiskFactor, decimal> DefaultWeights() =>
        new Dictionary<RemediationRiskFactor, decimal>
        {
            [RemediationRiskFactor.Severity] = 0.15m,
            [RemediationRiskFactor.Exploitability] = 0.12m,
            [RemediationRiskFactor.KnownExploitation] = 0.10m,
            [RemediationRiskFactor.InternetExposure] = 0.10m,
            [RemediationRiskFactor.IdentityControlPlaneImpact] = 0.10m,
            [RemediationRiskFactor.AssetCriticality] = 0.10m,
            [RemediationRiskFactor.DataSensitivity] = 0.08m,
            [RemediationRiskFactor.BlastRadius] = 0.10m,
            [RemediationRiskFactor.CompensatingControls] = 0.05m,
            [RemediationRiskFactor.RemediationComplexity] = 0.05m,
            [RemediationRiskFactor.RemediationRisk] = 0.05m,
        };

    public static RemediationRiskScoreResult Evaluate(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        bool hasActiveException,
        string? compensatingControls,
        RemediationAutomationLevel? automationLevel,
        bool patternHasRollback,
        IReadOnlyDictionary<RemediationRiskFactor, decimal>? weights = null)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(metadata);

        IReadOnlyDictionary<RemediationRiskFactor, decimal> effectiveWeights = weights ?? DefaultWeights();
        Dictionary<string, string?> metadataMap = metadata.ToDictionary(
            item => item.MetadataKey,
            item => item.MetadataValue,
            StringComparer.OrdinalIgnoreCase);

        List<RemediationRiskFactorContribution> contributions = [];

        AddContribution(
            contributions,
            RemediationRiskFactor.Severity,
            effectiveWeights,
            NormalizeSeverity(finding.Severity),
            finding.Severity ?? "unknown");

        AddContribution(
            contributions,
            RemediationRiskFactor.Exploitability,
            effectiveWeights,
            NormalizeLevel(finding.Exploitability),
            finding.Exploitability ?? "unknown");

        string? knownExploitation = GetMetadata(metadataMap, "knownExploitation", "known_exploitation");

        AddContribution(
            contributions,
            RemediationRiskFactor.KnownExploitation,
            effectiveWeights,
            NormalizeBoolean(knownExploitation),
            knownExploitation ?? "false");

        AddContribution(
            contributions,
            RemediationRiskFactor.InternetExposure,
            effectiveWeights,
            NormalizeLevel(finding.Exposure),
            finding.Exposure ?? "unknown");

        string? identityImpact = GetMetadata(metadataMap, "identityControlPlaneImpact", "identity_control_plane_impact");

        AddContribution(
            contributions,
            RemediationRiskFactor.IdentityControlPlaneImpact,
            effectiveWeights,
            NormalizeLevel(identityImpact),
            identityImpact ?? "unknown");

        AddContribution(
            contributions,
            RemediationRiskFactor.AssetCriticality,
            effectiveWeights,
            NormalizeLevel(finding.BusinessCriticality),
            finding.BusinessCriticality ?? "unknown");

        string? dataSensitivity = GetMetadata(metadataMap, "dataSensitivity", "data_sensitivity");

        AddContribution(
            contributions,
            RemediationRiskFactor.DataSensitivity,
            effectiveWeights,
            NormalizeLevel(dataSensitivity),
            dataSensitivity ?? "unknown");

        AddContribution(
            contributions,
            RemediationRiskFactor.BlastRadius,
            effectiveWeights,
            NormalizeLevel(finding.BlastRadius),
            finding.BlastRadius ?? "unknown");

        decimal compensatingValue = hasActiveException && !string.IsNullOrWhiteSpace(compensatingControls)
            ? 1.0m
            : 0.0m;

        AddContribution(
            contributions,
            RemediationRiskFactor.CompensatingControls,
            effectiveWeights,
            compensatingValue,
            hasActiveException ? "active-exception" : "none",
            subtractive: true);

        decimal complexityValue = automationLevel.HasValue
            ? 1.0m - NormalizeAutomationComplexity(automationLevel.Value)
            : 0.5m;

        AddContribution(
            contributions,
            RemediationRiskFactor.RemediationComplexity,
            effectiveWeights,
            complexityValue,
            automationLevel?.ToString() ?? "unknown");

        decimal remediationRiskValue = patternHasRollback ? 0.25m : 0.75m;

        AddContribution(
            contributions,
            RemediationRiskFactor.RemediationRisk,
            effectiveWeights,
            remediationRiskValue,
            patternHasRollback ? "rollback-defined" : "no-rollback");

        decimal total = contributions.Sum(item => item.WeightedContribution);
        total = Math.Clamp(total, 0m, 1m);

        string summary = string.Format(
            CultureInfo.InvariantCulture,
            "Rule={0}; Total={1:F4}; Factors={2}",
            RemediationPrioritizationConstants.RuleVersion,
            total,
            contributions.Count);

        string breakdownJson = JsonSerializer.Serialize(contributions);

        return new RemediationRiskScoreResult
        {
            TotalScore = total,
            Contributions = contributions,
            ExplanationSummary = summary,
            BreakdownJson = breakdownJson,
        };
    }

    private static void AddContribution(
        List<RemediationRiskFactorContribution> contributions,
        RemediationRiskFactor factor,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        decimal normalizedValue,
        string source,
        bool subtractive = false)
    {
        decimal weight = weights[factor];
        decimal clamped = Math.Clamp(normalizedValue, 0m, 1m);
        decimal weighted = subtractive ? -(clamped * weight) : clamped * weight;

        contributions.Add(new RemediationRiskFactorContribution
        {
            Factor = factor,
            NormalizedValue = clamped,
            Weight = weight,
            WeightedContribution = weighted,
            Source = source,
        });
    }

    private static decimal NormalizeSeverity(string? severity) =>
        (severity ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "critical" => 1.0m,
            "high" => 0.75m,
            "medium" => 0.5m,
            "low" => 0.25m,
            _ => 0.1m,
        };

    private static decimal NormalizeLevel(string? level) =>
        (level ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "critical" => 1.0m,
            "high" => 0.85m,
            "medium" => 0.55m,
            "low" => 0.3m,
            "none" => 0.0m,
            _ => 0.2m,
        };

    private static decimal NormalizeBoolean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0m;

        return value.Trim().ToLowerInvariant() switch
        {
            "true" or "yes" or "1" or "active" or "known" => 1.0m,
            _ => 0m,
        };
    }

    private static decimal NormalizeAutomationComplexity(RemediationAutomationLevel level) =>
        level switch
        {
            RemediationAutomationLevel.Manual => 0.25m,
            RemediationAutomationLevel.Guided => 0.5m,
            RemediationAutomationLevel.SemiAutomated => 0.75m,
            RemediationAutomationLevel.Automated => 1.0m,
            _ => 0.5m,
        };

    private static string? GetMetadata(IReadOnlyDictionary<string, string?> metadata, params string[] keys)
    {
        foreach (string key in keys)
        {
            if (metadata.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
