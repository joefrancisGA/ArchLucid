using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Decisioning.CareerArtifacts;

namespace ArchLucid.Application.Exports;

/// <summary>
///     CG-027 — resolves execute posture from pilot-run-deltas JSON for CLI proof-packet bundles.
///     Blocks unlabeled Working Career Simulator archives; stamps <c>REHEARSAL</c> when allowed.
/// </summary>
public static class ExportBundleCareerPostureResolver
{
    public const string CareerPostureRehearsal = "REHEARSAL";

    public const string CareerPostureCareer = "CAREER";

    public const string CareerPostureCareerBlocked = "CAREER_BLOCKED";

    /// <summary>CG-092 — resolves CG-019 run stamp fields for support-bundle triage (no secrets).</summary>
    public static ExportBundleCareerPostureTriageResult? ResolveTriageFromRunFields(
        StructuralExecutionMode? structuralExecutionMode,
        string? workingCareerRehearsalDoor)
    {
        if (structuralExecutionMode is null && string.IsNullOrWhiteSpace(workingCareerRehearsalDoor))
        {
            return null;
        }

        StructuralExecutionMode mode = structuralExecutionMode ?? StructuralExecutionMode.Simulator;
        string door = WorkingCareerRehearsalDoorValues.ParseOrDefault(workingCareerRehearsalDoor);

        bool careerBlocked = SimulatorCareerHonestyPresenter.ShouldBlockWorkingCareer(
            workingDesk: true,
            isSampleRun: false,
            structuralExecutionMode: mode,
            simulatorRehearsalBannerOnArtifact: false,
            workingCareerRehearsalDoor: door);

        bool rehearsalIncomplete = DecisionReceiptCareerPostureStamper.ResolveRehearsalIncomplete(mode, door);

        string careerPostureLabel = careerBlocked
            ? CareerPostureCareerBlocked
            : rehearsalIncomplete
                ? CareerPostureRehearsal
                : CareerPostureCareer;

        return new ExportBundleCareerPostureTriageResult(
            door,
            careerPostureLabel,
            rehearsalIncomplete,
            careerBlocked);
    }

    public static ExportBundleCareerPostureResult ResolveFromDeltasJson(string deltasJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deltasJson);

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        StructuralExecutionMode structuralExecutionMode =
            TryParseStructuralExecutionMode(root) ?? StructuralExecutionMode.Simulator;

        string workingCareerRehearsalDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(
            TryParseWorkingCareerRehearsalDoor(root));

        bool isDemoTenant = TryGetJsonBooleanProperty(root, "isDemoTenant", "is_demo_tenant");

        bool isSampleRun = TryParseSampleRun(root) || isDemoTenant;

        if (isSampleRun)
        {
            return new ExportBundleCareerPostureResult(
                IsBlocked: true,
                BlockReason: CareerArtifactCompletenessValidator.SampleWorkspaceExportBlockMessage,
                Stamp: null);
        }

        bool shouldBlock = SimulatorCareerHonestyPresenter.ShouldBlockWorkingCareer(
            workingDesk: true,
            isSampleRun: false,
            structuralExecutionMode: structuralExecutionMode,
            simulatorRehearsalBannerOnArtifact: false,
            workingCareerRehearsalDoor: workingCareerRehearsalDoor);

        if (shouldBlock)
        {
            return new ExportBundleCareerPostureResult(
                IsBlocked: true,
                BlockReason: SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                Stamp: null);
        }

        bool rehearsalIncomplete = DecisionReceiptCareerPostureStamper.ResolveRehearsalIncomplete(
            structuralExecutionMode,
            workingCareerRehearsalDoor);

        string careerPosture = rehearsalIncomplete ? CareerPostureRehearsal : CareerPostureCareer;

        ExportBundleCareerPostureStamp stamp = new(
            structuralExecutionMode.ToString(),
            workingCareerRehearsalDoor,
            rehearsalIncomplete,
            careerPosture);

        return new ExportBundleCareerPostureResult(
            IsBlocked: false,
            BlockReason: null,
            Stamp: stamp);
    }

    private static bool TryParseSampleRun(JsonElement root) =>
        TryGetJsonBooleanProperty(root, "isSampleRun", "is_sample_run");

    private static bool TryGetJsonBooleanProperty(JsonElement root, string camelCaseName, string snakeCaseName)
    {
        if (TryGetJsonBooleanPropertyExact(root, camelCaseName)
            || TryGetJsonBooleanPropertyExact(root, snakeCaseName))
        {
            return true;
        }

        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!string.Equals(property.Name, camelCaseName, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(property.Name, snakeCaseName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (TryParseJsonBoolean(property.Value))
                return true;
        }

        return false;
    }

    private static bool TryGetJsonBooleanPropertyExact(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out JsonElement element))
            return false;

        return TryParseJsonBoolean(element);
    }

    private static bool TryParseJsonBoolean(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.True)
            return true;

        if (element.ValueKind is JsonValueKind.False)
            return false;

        if (element.ValueKind is JsonValueKind.String)
        {
            string? text = element.GetString();

            if (string.Equals(text, "true", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(text, "false", StringComparison.OrdinalIgnoreCase))
                return false;

            if (bool.TryParse(text, out bool parsed))
                return parsed;

            if (string.Equals(text, "1", StringComparison.Ordinal))
                return true;

            if (string.Equals(text, "0", StringComparison.Ordinal))
                return false;

            if (string.Equals(text, "yes", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "y", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "on", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "t", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(text, "no", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "n", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "off", StringComparison.OrdinalIgnoreCase)
                || string.Equals(text, "f", StringComparison.OrdinalIgnoreCase))
                return false;
        }

        if (element.ValueKind is JsonValueKind.Number)
        {
            if (element.TryGetInt32(out int numeric))
                return numeric != 0;

            if (element.TryGetDouble(out double numericDouble)
                && double.IsFinite(numericDouble)
                && numericDouble >= int.MinValue
                && numericDouble <= int.MaxValue
                && numericDouble == Math.Truncate(numericDouble))
            {
                return numericDouble != 0;
            }
        }

        return false;
    }

    private static StructuralExecutionMode? TryParseStructuralExecutionMode(JsonElement root)
    {
        if (!TryGetJsonStringProperty(root, "structuralExecutionMode", "structural_execution_mode", out JsonElement modeEl))
        {
            return null;
        }

        if (modeEl.ValueKind == JsonValueKind.String
            && Enum.TryParse(modeEl.GetString(), ignoreCase: true, out StructuralExecutionMode parsedFromString))
        {
            return parsedFromString;
        }

        if (modeEl.ValueKind == JsonValueKind.Number
            && modeEl.TryGetInt32(out int modeInt)
            && Enum.IsDefined(typeof(StructuralExecutionMode), modeInt))
        {
            return (StructuralExecutionMode)modeInt;
        }

        return null;
    }

    private static string? TryParseWorkingCareerRehearsalDoor(JsonElement root)
    {
        if (!TryGetJsonStringProperty(root, "workingCareerRehearsalDoor", "working_career_rehearsal_door", out JsonElement doorEl))
        {
            return null;
        }

        if (doorEl.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return doorEl.GetString();
    }

    private static bool TryGetJsonStringProperty(
        JsonElement root,
        string camelCaseName,
        string snakeCaseName,
        out JsonElement value)
    {
        if (root.TryGetProperty(camelCaseName, out value)
            || root.TryGetProperty(snakeCaseName, out value))
        {
            return true;
        }

        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!string.Equals(property.Name, camelCaseName, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(property.Name, snakeCaseName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            value = property.Value;
            return true;
        }

        value = default;
        return false;
    }
}
