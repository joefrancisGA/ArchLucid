using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;

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

        ArchitectureDraftStructuredBrief structuredBrief = document.StructuredBrief ?? new ArchitectureDraftStructuredBrief();

        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = description,
            SystemName = systemName,
            Environment = "prod",
            CloudProvider = ResolveCloudProvider(document),
            Constraints = CopyTrimmedList(structuredBrief.ConfirmedConstraints),
            RequiredCapabilities = CopyTrimmedList(structuredBrief.ConfirmedRequiredCapabilities),
            Assumptions = MergeAssumptions(assumptions, structuredBrief.ConfirmedAssumptions),
            DraftActors = [.. document.ActorSet.Actors],
            QualityAttributeSnapshot = ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(structuredBrief.QualityAttribute)
                ? structuredBrief.QualityAttribute!.Trim()
                : null,
            FailureModeNoteSnapshot = ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(structuredBrief.FailureModeNote)
                ? structuredBrief.FailureModeNote!.Trim()
                : null,
            RequestSource = "draft-intake",
            InlineRequirements = BuildInlineRequirements(document, structuredBrief),
            IntakeTransparencyTrail = CloneTransparencyTrail(document.TransparencyTrail),
            PolicyReferences = BuildPolicyReferences(document),
            WorkflowIntent = ResolveWorkflowIntent(document),
        };
    }

    private static string? ResolveWorkflowIntent(DraftRequestDocument document)
    {
        string? intent = document.WorkflowIntent?.Trim();

        if (string.IsNullOrWhiteSpace(intent))
            return null;

        if (string.Equals(intent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.CreateArchitecture;

        if (string.Equals(intent, ArchitectureWorkflowIntent.StartReview, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.StartReview;

        return null;
    }

    private static List<string> BuildPolicyReferences(DraftRequestDocument document)
    {
        if (document.FocusedPilotModeEnabled is false)
            return [];

        return [FocusedPilotModePolicyPacks.ReferenceToken];
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

    private static List<string> BuildInlineRequirements(
        DraftRequestDocument document,
        ArchitectureDraftStructuredBrief structuredBrief)
    {
        List<string> requirements = [];

        if (!string.IsNullOrWhiteSpace(document.BusinessOutcome))
            requirements.Add(document.BusinessOutcome.Trim());

        if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(structuredBrief.QualityAttribute))
            requirements.Add($"Quality attribute: {structuredBrief.QualityAttribute!.Trim()}");

        if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(structuredBrief.FailureModeNote))
            requirements.Add($"Failure mode and recovery: {structuredBrief.FailureModeNote!.Trim()}");

        if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(structuredBrief.OperationalOwner))
            requirements.Add($"Operational owner: {structuredBrief.OperationalOwner!.Trim()}");

        return requirements;
    }

    private static List<string> CopyTrimmedList(IReadOnlyList<string> items)
    {
        List<string> copied = [];

        foreach (string item in items)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(item))
                continue;

            copied.Add(item.Trim());
        }

        return copied;
    }

    private static List<string> MergeAssumptions(List<string> actorAssumptions, IReadOnlyList<string> confirmedAssumptions)
    {
        List<string> merged = [.. actorAssumptions];

        foreach (string assumption in confirmedAssumptions)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                continue;

            merged.Add(assumption.Trim());
        }

        return merged;
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

    /// <summary>
    ///     Maps the required target-cloud intake answer to <see cref="ArchitectureRequest.CloudProvider" />.
    ///     <see cref="CloudProvider.None" /> means either the user explicitly chose cloud-neutral or the question was
    ///     skipped — those cases are intentionally indistinguishable here; the transparency trail records skips.
    ///     Ledger seeding records whatever value lands on the request, not a reconstructed answer-vs-skip flag.
    /// </summary>
    private static CloudProvider ResolveCloudProvider(DraftRequestDocument document)
    {
        if (!document.QuestionAnswers.TryGetValue(DraftIntakeQuestionKeys.CloudTarget, out string? answer)
            || string.IsNullOrWhiteSpace(answer))
        {
            return CloudProvider.None;
        }

        if (Enum.TryParse(answer, ignoreCase: true, out CloudProvider provider))
            return provider;

        return CloudProvider.None;
    }

    private static TransparencyTrail CloneTransparencyTrail(TransparencyTrail trail)
    {
        ArgumentNullException.ThrowIfNull(trail);

        string json = System.Text.Json.JsonSerializer.Serialize(trail);
        TransparencyTrail? clone = System.Text.Json.JsonSerializer.Deserialize<TransparencyTrail>(json);

        return clone ?? new TransparencyTrail();
    }
}
