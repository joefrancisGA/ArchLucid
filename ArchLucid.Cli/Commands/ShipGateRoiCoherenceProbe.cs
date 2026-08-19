using System.Globalization;
using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateRoiCoherenceProbeResult
{
    public required string SignalId
    {
        get;
        init;
    }

    public required bool Success
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }
}

internal static class ShipGateRoiCoherenceProbe
{
    internal const string SponsorReportPath = "/v1/roi/sponsor-report";

    internal static async Task<IReadOnlyList<ShipGateRoiCoherenceProbeResult>> EvaluateAsync(
        HttpClient http,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);

        try
        {
            using HttpResponseMessage response = await http.GetAsync(SponsorReportPath, cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                return
                [
                    Fail(
                        "http-status",
                        $"GET {SponsorReportPath} -> HTTP {(int)response.StatusCode}"),
                ];
            }

            string json = await response.Content.ReadAsStringAsync(cancellationToken);

            return EvaluateJson(json);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
        {
            return [Fail("http-fetch", ex.Message)];
        }
    }

    internal static IReadOnlyList<ShipGateRoiCoherenceProbeResult> EvaluateJson(string json)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            return EvaluateRoot(root);
        }
        catch (JsonException ex)
        {
            return [Fail("json-parse", ex.Message)];
        }
    }

    private static IReadOnlyList<ShipGateRoiCoherenceProbeResult> EvaluateRoot(JsonElement root)
    {
        List<ShipGateRoiCoherenceProbeResult> results =
        [
            EvaluateHeadlineTotal(root),
            EvaluateSystemsArray(root),
            EvaluateBasisBreakdown(root),
            EvaluateHeadlineScopeCode(root),
            EvaluateSystemRowScopeCode(root),
            EvaluateHeadlineScopeDescription(root),
            EvaluateSystemRowScopeDescription(root),
            EvaluateHeadlineMath(root),
        ];

        return results;
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateHeadlineTotal(JsonElement root)
    {
        if (!root.TryGetProperty("totalEstimatedUsdSavings", out JsonElement totalElement)
            || totalElement.ValueKind != JsonValueKind.Number
            || !totalElement.TryGetDecimal(out _))
        {
            return Fail("headline-total-present", "totalEstimatedUsdSavings missing or not numeric");
        }

        return Pass("headline-total-present", "totalEstimatedUsdSavings present");
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateSystemsArray(JsonElement root)
    {
        if (!root.TryGetProperty("systems", out JsonElement systemsElement)
            || systemsElement.ValueKind != JsonValueKind.Array)
        {
            return Fail("systems-array-present", "systems missing or not an array");
        }

        return Pass("systems-array-present", $"systems count={systemsElement.GetArrayLength()}");
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateBasisBreakdown(JsonElement root)
    {
        if (!root.TryGetProperty("basisBreakdown", out JsonElement basisElement)
            || basisElement.ValueKind != JsonValueKind.Object)
        {
            return Fail("basis-breakdown-present", "basisBreakdown missing or not an object");
        }

        string[] requiredFields =
        [
            "openEstimatedUsd",
            "needsEvidenceUsd",
            "realizedUsd",
            "acceptedRiskUsd",
            "deferredUsd",
            "waivedUsd",
        ];

        List<string> missing = [];

        foreach (string fieldName in requiredFields)
        {
            if (!basisElement.TryGetProperty(fieldName, out JsonElement fieldElement)
                || fieldElement.ValueKind != JsonValueKind.Number)
            {
                missing.Add(fieldName);
            }
        }

        if (missing.Count > 0)
        {
            return Fail("basis-breakdown-present", $"basisBreakdown missing numeric fields: {string.Join(", ", missing)}");
        }

        return Pass("basis-breakdown-present", "basisBreakdown disposition buckets present");
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateHeadlineScopeCode(JsonElement root)
    {
        return EvaluateScopeCode(
            root,
            "headlineSavingsScopeCode",
            "headline-scope-code",
            RoiSponsorFacingScopeCodes.HeadlineDispositionAware);
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateSystemRowScopeCode(JsonElement root)
    {
        return EvaluateScopeCode(
            root,
            "systemRowSavingsScopeCode",
            "system-row-scope-code",
            RoiSponsorFacingScopeCodes.SystemRowSnapshotPotential);
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateScopeCode(
        JsonElement root,
        string propertyName,
        string signalId,
        string expectedCode)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement codeElement)
            || codeElement.ValueKind != JsonValueKind.String)
        {
            return Fail(signalId, $"{propertyName} missing or not a string");
        }

        string actualCode = codeElement.GetString() ?? string.Empty;

        if (!string.Equals(actualCode, expectedCode, StringComparison.Ordinal))
        {
            return Fail(signalId, $"{propertyName}={actualCode}; expected={expectedCode}");
        }

        return Pass(signalId, $"{propertyName}={actualCode}");
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateHeadlineScopeDescription(JsonElement root)
    {
        return EvaluateScopeDescription(
            root,
            "headlineSavingsScopeDescription",
            "headline-scope-description",
            RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware);
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateSystemRowScopeDescription(JsonElement root)
    {
        return EvaluateScopeDescription(
            root,
            "systemRowSavingsScopeDescription",
            "system-row-scope-description",
            RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential);
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateScopeDescription(
        JsonElement root,
        string propertyName,
        string signalId,
        string expectedDescription)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement descriptionElement)
            || descriptionElement.ValueKind != JsonValueKind.String)
        {
            return Fail(signalId, $"{propertyName} missing or not a string");
        }

        string actualDescription = descriptionElement.GetString() ?? string.Empty;

        if (!string.Equals(actualDescription, expectedDescription, StringComparison.Ordinal))
        {
            return Fail(signalId, $"{propertyName} drifted from canonical manifest description");
        }

        return Pass(signalId, $"{propertyName} matches manifest");
    }

    private static ShipGateRoiCoherenceProbeResult EvaluateHeadlineMath(JsonElement root)
    {
        if (!root.TryGetProperty("totalEstimatedUsdSavings", out JsonElement totalElement)
            || !totalElement.TryGetDecimal(out decimal headlineTotal))
        {
            return Fail("headline-math-coherent", "totalEstimatedUsdSavings unavailable for math check");
        }

        if (!root.TryGetProperty("basisBreakdown", out JsonElement basisElement)
            || basisElement.ValueKind != JsonValueKind.Object)
        {
            return Fail("headline-math-coherent", "basisBreakdown unavailable for math check");
        }

        if (!TryReadDecimal(basisElement, "openEstimatedUsd", out decimal openUsd)
            || !TryReadDecimal(basisElement, "needsEvidenceUsd", out decimal needsEvidenceUsd))
        {
            return Fail("headline-math-coherent", "basisBreakdown open/needsEvidence buckets unavailable");
        }

        decimal expectedHeadline = openUsd + needsEvidenceUsd;

        if (headlineTotal != expectedHeadline)
        {
            return Fail(
                "headline-math-coherent",
                $"totalEstimatedUsdSavings={headlineTotal.ToString(CultureInfo.InvariantCulture)} != open+needsEvidence={expectedHeadline.ToString(CultureInfo.InvariantCulture)}");
        }

        return Pass(
            "headline-math-coherent",
            $"totalEstimatedUsdSavings equals openEstimatedUsd+needsEvidenceUsd ({expectedHeadline.ToString(CultureInfo.InvariantCulture)})");
    }

    private static bool TryReadDecimal(JsonElement parent, string propertyName, out decimal value)
    {
        value = default;

        if (!parent.TryGetProperty(propertyName, out JsonElement element)
            || element.ValueKind != JsonValueKind.Number)
        {
            return false;
        }

        return element.TryGetDecimal(out value);
    }

    private static ShipGateRoiCoherenceProbeResult Pass(string signalId, string detail) =>
        new()
        {
            SignalId = signalId,
            Success = true,
            Detail = detail,
        };

    private static ShipGateRoiCoherenceProbeResult Fail(string signalId, string detail) =>
        new()
        {
            SignalId = signalId,
            Success = false,
            Detail = detail,
        };
}
