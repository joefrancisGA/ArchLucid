using System.Text.Json;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Serializes draft document state for manifest-free intake reasoning (SAQ-013).</summary>
public static class DraftIntakeReasoningContextBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string BuildContextJson(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        object context = new
        {
            document.FreeTextIntent,
            document.SystemName,
            document.BusinessOutcome,
            document.ActorSet,
            document.QuestionAnswers,
            document.RequiredMustQuestionKeys,
            transparencyTrail = document.TransparencyTrail,
        };

        return JsonSerializer.Serialize(context, JsonOptions);
    }
}
