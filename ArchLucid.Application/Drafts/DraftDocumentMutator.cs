using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Drafts;

/// <summary>Pure document mutations for draft intake (patch, transparency trail, Q&amp;A trail).</summary>
public static class DraftDocumentMutator
{
    public static void ApplyPatch(DraftRequestDocument document, PatchDraftRequest patch)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(patch);

        if (patch.FreeTextIntent is not null)
        {
            string intent = patch.FreeTextIntent.Trim();

            if (intent.Length == 0)
            {
                document.FreeTextIntent = string.Empty;
            }
            else if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            {
                throw new InvalidOperationException(
                    $"FreeTextIntent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");
            }
            else if (intent.Length > DraftIntakeValidation.MaximumFreeTextIntentLength)
            {
                throw new InvalidOperationException(
                    $"FreeTextIntent must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters after trim.");
            }
            else
            {
                document.FreeTextIntent = intent;
            }
        }

        if (patch.SystemName is not null)
            document.SystemName = patch.SystemName.Trim();

        if (patch.BusinessOutcome is not null)
            document.BusinessOutcome = patch.BusinessOutcome.Trim();

        if (patch.ActorSet is not null)
            document.ActorSet = patch.ActorSet;

        if (patch.FocusedPilotModeEnabled.HasValue)
            document.FocusedPilotModeEnabled = patch.FocusedPilotModeEnabled.Value;

        if (patch.WorkflowIntent is not null)
            document.WorkflowIntent = NormalizeWorkflowIntent(patch.WorkflowIntent);

        if (patch.StructuredBrief is not null)
        {
            document.StructuredBrief ??= new ArchitectureDraftStructuredBrief();
            ApplyStructuredBriefPatch(document.StructuredBrief, patch.StructuredBrief);
        }
    }

    public static void SyncTransparencyFromDocument(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!string.IsNullOrWhiteSpace(document.BusinessOutcome))
        {
            UpsertAsserted(document.TransparencyTrail, "businessOutcome", document.BusinessOutcome.Trim());
        }

        foreach (ActorDescriptor actor in document.ActorSet.Actors)
        {
            string key = string.IsNullOrWhiteSpace(actor.Label)
                ? $"actor.{actor.Kind}.{actor.TrustOrigin}.{actor.Contract}"
                : $"actor.{actor.Label}";

            if (actor.Origin == ActorOrigin.Asserted)
            {
                UpsertAsserted(
                    document.TransparencyTrail,
                    key,
                    $"{actor.Kind}/{actor.TrustOrigin}/{actor.Contract}");
            }
            else
            {
                UpsertInferred(
                    document.TransparencyTrail,
                    key,
                    $"{actor.Kind}/{actor.TrustOrigin}/{actor.Contract}",
                    actor.Confidence);
            }
        }
    }

    public static void EnsureMustQuestionsAnswered(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        UniversalIntakeMustQuestionCompleteness.EnsureComplete(
            document.QuestionAnswers,
            document.TransparencyTrail,
            document.RequiredMustQuestionKeys);
    }

    public static void RemoveSkippedQuestion(DraftRequestDocument document, string questionKey)
    {
        ArgumentNullException.ThrowIfNull(document);

        document.TransparencyTrail.Skipped.RemoveAll(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));
    }

    public static void UpsertSkipped(DraftRequestDocument document, string questionKey, ElicitationQuestionTier tier)
    {
        ArgumentNullException.ThrowIfNull(document);

        SkippedQuestionTrailEntry? existing = document.TransparencyTrail.Skipped.Find(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            document.TransparencyTrail.Skipped.Add(
                new SkippedQuestionTrailEntry { QuestionKey = questionKey, Tier = tier });

            return;
        }

        existing.Tier = tier;
    }

    public static void RecordAssertedAnswer(DraftRequestDocument document, string questionKey, string answer)
    {
        ArgumentNullException.ThrowIfNull(document);

        UpsertAsserted(document.TransparencyTrail, $"answer.{questionKey}", answer);
    }

    public static string? NormalizeWorkflowIntent(string? workflowIntent)
    {
        string? intent = workflowIntent?.Trim();

        if (string.IsNullOrWhiteSpace(intent))
            return null;

        if (string.Equals(intent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.CreateArchitecture;

        if (string.Equals(intent, ArchitectureWorkflowIntent.StartReview, StringComparison.OrdinalIgnoreCase))
            return ArchitectureWorkflowIntent.StartReview;

        return null;
    }

    private static void ApplyStructuredBriefPatch(
        ArchitectureDraftStructuredBrief target,
        ArchitectureDraftStructuredBrief patch)
    {
        ArgumentNullException.ThrowIfNull(target);
        ArgumentNullException.ThrowIfNull(patch);

        target.ConfirmedConstraints = CopyTrimmedList(patch.ConfirmedConstraints);
        target.ConfirmedAssumptions = CopyTrimmedList(patch.ConfirmedAssumptions);
        target.ConfirmedRequiredCapabilities = CopyTrimmedList(patch.ConfirmedRequiredCapabilities);
        target.SuggestedConstraints = CopyTrimmedList(patch.SuggestedConstraints);
        target.SuggestedAssumptions = CopyTrimmedList(patch.SuggestedAssumptions);
        target.SuggestedRequiredCapabilities = CopyTrimmedList(patch.SuggestedRequiredCapabilities);
        target.DeniedConstraints = CopyTrimmedList(patch.DeniedConstraints);
        target.DeniedAssumptions = CopyTrimmedList(patch.DeniedAssumptions);
        target.DeniedRequiredCapabilities = CopyTrimmedList(patch.DeniedRequiredCapabilities);
        target.QualityAttribute = patch.QualityAttribute?.Trim();
        target.FailureModeNote = patch.FailureModeNote?.Trim();
        target.OperationalOwner = patch.OperationalOwner?.Trim();
    }

    private static List<string> CopyTrimmedList(IReadOnlyList<string>? items)
    {
        if (items is null)
            return [];

        List<string> copied = [];

        foreach (string item in items)
        {
            string trimmed = item.Trim();

            if (trimmed.Length == 0)
                continue;

            copied.Add(trimmed);
        }

        return copied;
    }

    private static void UpsertAsserted(TransparencyTrail trail, string key, string value)
    {
        AssertedTrailEntry? existing = trail.Asserted.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            trail.Asserted.Add(new AssertedTrailEntry { Key = key, Value = value });

            return;
        }

        existing.Value = value;
    }

    private static void UpsertInferred(TransparencyTrail trail, string key, string value, int confidence)
    {
        InferredTrailEntry? existing = trail.Inferred.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            trail.Inferred.Add(new InferredTrailEntry { Key = key, Value = value, Confidence = confidence });

            return;
        }

        existing.Value = value;
        existing.Confidence = confidence;
    }
}
