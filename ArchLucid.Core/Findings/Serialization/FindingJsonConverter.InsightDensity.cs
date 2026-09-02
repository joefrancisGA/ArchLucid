using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    private static void ReadInsightDensityFields(JsonElement root, Finding finding)
    {
        if (TryGetPropertyCaseInsensitive(root, "insightDensityScore", out JsonElement scoreElement)
            && TryReadInt32(scoreElement, out int insightDensityScore))
        {
            finding.InsightDensityScore = insightDensityScore;
        }

        if (TryGetPropertyCaseInsensitive(root, "treatment", out JsonElement treatmentElement))
            finding.Treatment = ReadTreatment(treatmentElement);

        if (TryGetPropertyCaseInsensitive(root, "classification", out JsonElement classificationElement))
            finding.Classification = ReadClassification(classificationElement);

        finding.WhyThisIsNotGeneric = ReadOptionalString(root, "whyThisIsNotGeneric");
        finding.PrincipalArchitectValue = ReadOptionalString(root, "principalArchitectValue");
        finding.DecisionConsequence = ReadOptionalString(root, "decisionConsequence");
    }

    private static void WriteInsightDensityFields(Utf8JsonWriter writer, Finding value)
    {
        if (value.InsightDensityScore is { } insightDensityScore)
            writer.WriteNumber("insightDensityScore", insightDensityScore);

        if (value.Treatment is { } treatment)
            writer.WriteString("treatment", treatment.ToString());

        if (value.Classification is { } classification)
            writer.WriteString("classification", classification.ToString());

        WriteOptionalString(writer, "whyThisIsNotGeneric", value.WhyThisIsNotGeneric);
        WriteOptionalString(writer, "principalArchitectValue", value.PrincipalArchitectValue);
        WriteOptionalString(writer, "decisionConsequence", value.DecisionConsequence);
    }
}
