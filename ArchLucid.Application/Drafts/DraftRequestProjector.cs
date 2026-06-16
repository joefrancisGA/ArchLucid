using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftRequestProjector" />
public sealed class DraftRequestProjector : IDraftRequestProjector
{
    private const int MinimumDescriptionLength = 10;

    /// <inheritdoc />
    public ArchitectureRequest Project(DraftRequestDocument document, Guid draftId)
    {
        ArgumentNullException.ThrowIfNull(document);

        string description = BuildDescription(document);
        string systemName = ResolveSystemName(document, draftId);
        List<string> assumptions = BuildAssumptions(document);

        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = description,
            SystemName = systemName,
            Environment = "prod",
            CloudProvider = CloudProvider.None,
            Assumptions = assumptions,
            RequestSource = "draft-intake",
            InlineRequirements = BuildInlineRequirements(document),
            IntakeTransparencyTrail = CloneTransparencyTrail(document.TransparencyTrail),
        };
    }

    private static string ResolveSystemName(DraftRequestDocument document, Guid draftId)
    {
        if (!string.IsNullOrWhiteSpace(document.SystemName))
            return document.SystemName.Trim();

        return $"Draft-{draftId:N}"[..Math.Min(200, $"Draft-{draftId:N}".Length)];
    }

    private static string BuildDescription(DraftRequestDocument document)
    {
        string intent = document.FreeTextIntent.Trim();
        string? outcome = document.BusinessOutcome?.Trim();

        if (!string.IsNullOrWhiteSpace(outcome))
            intent = $"{intent}\n\nBusiness outcome: {outcome}";

        if (intent.Length >= MinimumDescriptionLength)
            return intent;

        return intent.PadRight(MinimumDescriptionLength, '.');
    }

    private static List<string> BuildInlineRequirements(DraftRequestDocument document)
    {
        if (string.IsNullOrWhiteSpace(document.BusinessOutcome))
            return [];

        return [document.BusinessOutcome.Trim()];
    }

    private static List<string> BuildAssumptions(DraftRequestDocument document)
    {
        List<string> assumptions = [];

        foreach (InferredTrailEntry inferred in document.TransparencyTrail.Inferred)
        {
            if (string.IsNullOrWhiteSpace(inferred.Key))
                continue;

            assumptions.Add($"[inferred:{inferred.Confidence}] {inferred.Key}={inferred.Value}");
        }

        foreach (ActorDescriptor actor in document.ActorSet.Actors)
        {
            string label = string.IsNullOrWhiteSpace(actor.Label) ? "actor" : actor.Label;
            assumptions.Add(
                $"[actor:{actor.Origin}] {label}: {actor.Kind}/{actor.TrustOrigin}/{actor.Contract} (confidence {actor.Confidence})");
        }

        return assumptions;
    }

    private static TransparencyTrail CloneTransparencyTrail(TransparencyTrail trail)
    {
        ArgumentNullException.ThrowIfNull(trail);

        string json = System.Text.Json.JsonSerializer.Serialize(trail);
        TransparencyTrail? clone = System.Text.Json.JsonSerializer.Deserialize<TransparencyTrail>(json);

        return clone ?? new TransparencyTrail();
    }
}
