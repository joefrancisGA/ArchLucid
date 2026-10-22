using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditEvidencePackageProjectionBuilder
{
    private const string HonestyDisclaimer =
        "This package is a technical evidence projection from the ArchLucid store. "
        + "It is not CMS conformity, auditor sign-off, or a compliance score.";

    public static IReadOnlyList<AuditEvidencePackageEntry> BuildEntries(AuditEvidencePackageProjectionContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        string root = $"ARC-AMPE-{context.Assessment.AssessmentId:N}";
        List<AuditEvidencePackageEntry> entries = [];

        entries.Add(TextEntry(root, "Executive-Summary.md", BuildExecutiveSummary(context)));
        entries.Add(TextEntry(root, "Scope.md", BuildScope(context)));
        entries.Add(TextEntry(root, "Collection-Methodology.md", BuildCollectionMethodology(context)));
        entries.Add(TextEntry(root, "Evidence-Completeness.md", BuildEvidenceCompleteness(context)));
        entries.Add(TextEntry(root, "Exceptions.md", BuildExceptions(context)));

        foreach (AuditControlRecord control in context.Controls.OrderBy(c => c.ControlNumber, StringComparer.Ordinal))
        {
            string controlFolder = BuildControlFolderName(control);
            string controlRoot = $"{root}/Controls/{controlFolder}";

            AuditControlReadinessRecord? readiness = context.ReadinessSummary.Controls
                .FirstOrDefault(candidate => candidate.ControlId == control.ControlId);

            context.EvaluationsByControlId.TryGetValue(control.ControlId, out AuditControlEvaluationRecord? evaluation);
            context.HybridByControlId.TryGetValue(control.ControlId, out AuditHybridControlEvidenceRecord? hybrid);

            entries.Add(TextEntry(controlRoot, "Control-Summary.md", BuildControlSummary(control, readiness)));
            entries.Add(TextEntry(controlRoot, "Evidence-Index.md", BuildEvidenceIndex(context, control, hybrid)));
            entries.Add(TextEntry(controlRoot, "Exceptions.md", BuildControlExceptions(readiness, evaluation)));
            entries.Add(TextEntry(controlRoot, "Evaluation.md", BuildEvaluation(control, evaluation)));

            AddAutomatedEvidenceEntries(entries, context, control, controlRoot);
            AddManualEvidenceEntries(entries, context, control, controlRoot);
        }

        AddRawAndNormalizedEvidence(entries, context, root);

        return entries;
    }

    private static void AddAutomatedEvidenceEntries(
        List<AuditEvidencePackageEntry> entries,
        AuditEvidencePackageProjectionContext context,
        AuditControlRecord control,
        string controlRoot)
    {
        HashSet<Guid> requirementIds = context.Requirements
            .Where(requirement => requirement.ControlId == control.ControlId)
            .Select(requirement => requirement.RequirementId)
            .ToHashSet();

        List<AuditEvidenceSnapshotItemRecord> items = context.SnapshotItems
            .Where(item => requirementIds.Contains(item.RequirementId))
            .OrderBy(item => item.RequirementId)
            .ToList();

        if (items.Count == 0)
        {
            entries.Add(TextEntry(
                controlRoot,
                "Automated-Evidence.md",
                "_No automated evidence rows were collected for this control._"));

            return;
        }

        StringBuilder builder = new();
        builder.AppendLine("# Automated evidence");
        builder.AppendLine();
        builder.AppendLine(HonestyDisclaimer);
        builder.AppendLine();

        foreach (AuditEvidenceSnapshotItemRecord item in items)
        {
            builder.AppendLine($"## Requirement {item.RequirementId:N}");
            builder.AppendLine($"- Status: {item.CollectionStatus}");
            builder.AppendLine($"- Freshness: {item.FreshnessStatus}");
            builder.AppendLine($"- Summary: {item.Summary}");
            builder.AppendLine($"- Provenance: {item.ProvenanceKind}");
            builder.AppendLine($"- Hash: `{Convert.ToHexString(item.EvidenceHashSha256)}`");

            if (item.CollectionStatus != AuditEvidenceCollectionStatus.Collected)
                builder.AppendLine("- **Gap:** evidence not collected — listed, not fabricated.");

            builder.AppendLine();
        }

        entries.Add(TextEntry(controlRoot, "Automated-Evidence.md", builder.ToString()));
    }

    private static void AddManualEvidenceEntries(
        List<AuditEvidencePackageEntry> entries,
        AuditEvidencePackageProjectionContext context,
        AuditControlRecord control,
        string controlRoot)
    {
        List<AuditManualEvidenceSubmissionRecord> submissions = context.ManualSubmissions
            .Where(submission => submission.ControlId == control.ControlId)
            .OrderBy(submission => submission.SubmittedUtc)
            .ToList();

        if (submissions.Count == 0)
        {
            entries.Add(TextEntry(
                controlRoot,
                "Manual-Evidence.md",
                "_No human-submitted evidence is linked for this control._"));

            return;
        }

        StringBuilder index = new();
        index.AppendLine("# Manual evidence");
        index.AppendLine();
        index.AppendLine(HonestyDisclaimer);
        index.AppendLine();

        foreach (AuditManualEvidenceSubmissionRecord submission in submissions)
        {
            string safeName = FileNameSanitizer.Sanitize($"{submission.DocumentKind}-{submission.SubmissionId:N}.txt");
            string relativePath = $"Manual-Evidence/{safeName}";

            index.AppendLine($"## {submission.DocumentKind} ({submission.SubmissionId:N})");
            index.AppendLine($"- Owner: {submission.Owner}");
            index.AppendLine($"- Submitted by: {submission.SubmittedBy}");
            index.AppendLine($"- Review status: {submission.ReviewStatus}");
            index.AppendLine($"- Hash: `{Convert.ToHexString(submission.EvidenceHashSha256)}`");

            if (context.ManualBlobContentByPointer.TryGetValue(submission.BlobPointer, out string? content)
                && !string.IsNullOrWhiteSpace(content))
            {
                entries.Add(TextEntry(controlRoot, relativePath, content));
                index.AppendLine($"- Artifact: `{relativePath}`");
            }
            else
            {
                index.AppendLine("- **Gap:** blob content unavailable — metadata listed only.");
            }

            if (!string.IsNullOrWhiteSpace(submission.ItsmProvider) && !string.IsNullOrWhiteSpace(submission.ItsmExternalKey))
            {
                index.AppendLine($"- ITSM: {submission.ItsmProvider}/{submission.ItsmExternalKey}");
            }

            index.AppendLine();
        }

        entries.Add(TextEntry(controlRoot, "Manual-Evidence.md", index.ToString()));
    }

    private static void AddRawAndNormalizedEvidence(
        List<AuditEvidencePackageEntry> entries,
        AuditEvidencePackageProjectionContext context,
        string root)
    {
        StringBuilder rawIndex = new();
        rawIndex.AppendLine("# Raw evidence pointers");
        rawIndex.AppendLine();

        StringBuilder normalizedIndex = new();
        normalizedIndex.AppendLine("# Normalized evidence pointers");
        normalizedIndex.AppendLine();

        foreach (AuditEvidenceSnapshotItemRecord item in context.SnapshotItems.OrderBy(i => i.EvidenceRowId))
        {
            if (!string.IsNullOrWhiteSpace(item.RawPointer))
                rawIndex.AppendLine($"- `{item.RawPointer}` (row {item.EvidenceRowId:N})");

            if (!string.IsNullOrWhiteSpace(item.NormalizedPointer))
                normalizedIndex.AppendLine($"- `{item.NormalizedPointer}` (row {item.EvidenceRowId:N})");
        }

        entries.Add(TextEntry(root, "Raw-Evidence/INDEX.md", rawIndex.ToString()));
        entries.Add(TextEntry(root, "Normalized-Evidence/INDEX.md", normalizedIndex.ToString()));
    }

    private static string BuildExecutiveSummary(AuditEvidencePackageProjectionContext context)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Executive summary");
        builder.AppendLine();

        if (!string.IsNullOrWhiteSpace(context.BrandingDisplayName))
            builder.AppendLine($"Prepared for: **{context.BrandingDisplayName}**");

        builder.AppendLine();
        builder.AppendLine($"**{AuditReadinessLabels.ReadinessHeading}:** {context.ReadinessSummary.AggregateLabel}");
        builder.AppendLine($"- Applicable controls: {context.ReadinessSummary.ApplicableControlCount}");
        builder.AppendLine($"- Ready for auditor review: {context.ReadinessSummary.ReadyForAuditorReviewCount}");
        builder.AppendLine($"- Stale evidence controls: {context.ReadinessSummary.StaleEvidenceCount}");
        builder.AppendLine();
        builder.AppendLine($"**{AuditReadinessLabels.TechnicalEvaluationHeading}** is reported per control in `Evaluation.md` files.");
        builder.AppendLine();
        builder.AppendLine(HonestyDisclaimer);

        return builder.ToString();
    }

    private static string BuildScope(AuditEvidencePackageProjectionContext context)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Assessment scope");
        builder.AppendLine();
        builder.AppendLine($"Assessment ID: `{context.Assessment.AssessmentId}`");
        builder.AppendLine($"Framework: {context.Framework.Name} {context.Framework.Version}");
        builder.AppendLine($"Snapshot ID: `{context.SnapshotHeader.AuditEvidenceSnapshotId}`");
        builder.AppendLine($"Period: {context.Assessment.PeriodStartUtc:O} — {context.Assessment.PeriodEndUtc:O}");
        builder.AppendLine();
        builder.AppendLine("## Scope JSON");
        builder.AppendLine("```json");
        builder.AppendLine(context.Assessment.ScopeJson);
        builder.AppendLine("```");

        return builder.ToString();
    }

    private static string BuildCollectionMethodology(AuditEvidencePackageProjectionContext context)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Collection methodology");
        builder.AppendLine();
        builder.AppendLine($"Framework version: `{context.SnapshotHeader.FrameworkVersion}`");
        builder.AppendLine($"Control catalog version: `{context.SnapshotHeader.ControlCatalogVersion}`");
        builder.AppendLine($"Collection window: {context.SnapshotHeader.CollectionStartedUtc:O} — {context.SnapshotHeader.CollectionCompletedUtc:O}");
        builder.AppendLine();
        builder.AppendLine("## Selector versions (pinned)");
        builder.AppendLine("```json");
        builder.AppendLine(context.SnapshotHeader.SelectorVersionsJson);
        builder.AppendLine("```");
        builder.AppendLine();
        builder.AppendLine("## Collectors");

        foreach (AuditEvidenceSelectorDescriptorRecord descriptor in context.SelectorDescriptors
                     .OrderBy(descriptor => descriptor.CollectorId, StringComparer.Ordinal))
        {
            string methodLabel = FormatCollectionMethodLabel(descriptor.CollectionMethod);
            builder.AppendLine($"- **{descriptor.CollectorId}** v{descriptor.Version}: `{methodLabel}`");
        }

        return builder.ToString();
    }

    internal static string FormatCollectionMethodLabel(string collectionMethod)
    {
        if (string.IsNullOrWhiteSpace(collectionMethod))
            return "unknown";

        if (collectionMethod.Contains("simulator", StringComparison.OrdinalIgnoreCase))
            return $"{collectionMethod} ({AzureInventoryDiffNarrativeBuilder.SimulatorLabel})";

        return collectionMethod;
    }

    private static string BuildEvidenceCompleteness(AuditEvidencePackageProjectionContext context)
    {
        AuditAssessmentReadinessSummaryRecord summary = context.ReadinessSummary;
        StringBuilder builder = new();
        builder.AppendLine("# Evidence completeness");
        builder.AppendLine();
        builder.AppendLine($"- Fully evident: {summary.FullyEvidentCount}");
        builder.AppendLine($"- Partially evident: {summary.PartiallyEvidentCount}");
        builder.AppendLine($"- Lacking evidence: {summary.LackingEvidenceCount}");
        builder.AppendLine($"- Requires human evidence: {summary.RequiresHumanEvidenceCount}");
        builder.AppendLine($"- Technically failing: {summary.TechnicallyFailingCount}");
        builder.AppendLine();
        builder.AppendLine("Missing or partial evidence is listed in control indexes — never fabricated.");

        return builder.ToString();
    }

    private static string BuildExceptions(AuditEvidencePackageProjectionContext context)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Approved exceptions");
        builder.AppendLine();

        foreach (AuditControlReadinessRecord control in context.ReadinessSummary.Controls
                     .Where(control => control.ApprovedExceptionIds.Count > 0)
                     .OrderBy(control => control.ControlNumber, StringComparer.Ordinal))
        {
            builder.AppendLine($"## {control.ControlNumber} {control.Title}");
            foreach (string exceptionId in control.ApprovedExceptionIds)
                builder.AppendLine($"- {exceptionId}");

            builder.AppendLine();
        }

        if (builder.Length <= 50)
            builder.AppendLine("_No approved exceptions recorded._");

        return builder.ToString();
    }

    private static string BuildControlSummary(AuditControlRecord control, AuditControlReadinessRecord? readiness)
    {
        StringBuilder builder = new();
        builder.AppendLine($"# {control.ControlNumber} — {control.Title}");
        builder.AppendLine();

        if (readiness is not null)
        {
            builder.AppendLine($"- Completeness: {readiness.Completeness}");
            builder.AppendLine($"- Ready for auditor review: {readiness.ReadyForAuditorReview}");
            builder.AppendLine($"- Worst freshness: {readiness.WorstFreshnessStatus}");
        }

        return builder.ToString();
    }

    private static string BuildEvidenceIndex(
        AuditEvidencePackageProjectionContext context,
        AuditControlRecord control,
        AuditHybridControlEvidenceRecord? hybrid)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Evidence index");
        builder.AppendLine();

        if (hybrid is not null && hybrid.SourceKinds.Count > 0)
        {
            builder.AppendLine("## Source kinds");
            foreach (AuditEvidenceSourceKind sourceKind in hybrid.SourceKinds.OrderBy(kind => kind))
                builder.AppendLine($"- {sourceKind}");

            builder.AppendLine();
        }

        List<AuditEvidenceRequirementRecord> requirements = context.Requirements
            .Where(requirement => requirement.ControlId == control.ControlId)
            .OrderBy(requirement => requirement.Name, StringComparer.Ordinal)
            .ToList();

        foreach (AuditEvidenceRequirementRecord requirement in requirements)
        {
            bool hasItem = context.SnapshotItems.Any(item =>
                item.RequirementId == requirement.RequirementId
                && item.CollectionStatus == AuditEvidenceCollectionStatus.Collected);

            bool hasManual = context.ManualSubmissions.Any(submission =>
                submission.RequirementId == requirement.RequirementId);

            bool hasArchitecture = context.ArchitectureLinks.Any(link =>
                link.RequirementId == requirement.RequirementId);

            builder.AppendLine($"## {requirement.Name} ({requirement.EvidenceType})");

            if (!hasItem && !hasManual && !hasArchitecture)
                builder.AppendLine("- **MISSING** — no evidence linked (not fabricated).");
            else
            {
                if (hasItem)
                    builder.AppendLine("- Automated snapshot evidence");

                if (hasManual)
                    builder.AppendLine("- Manual / human evidence");

                if (hasArchitecture)
                    builder.AppendLine("- Architecture evidence (sealed manifest link)");
            }

            builder.AppendLine();
        }

        return builder.ToString();
    }

    private static string BuildControlExceptions(
        AuditControlReadinessRecord? readiness,
        AuditControlEvaluationRecord? evaluation)
    {
        StringBuilder builder = new();
        builder.AppendLine("# Control exceptions");
        builder.AppendLine();

        if (evaluation?.ExceptionIds is { Count: > 0 } exceptionIds)
        {
            foreach (string exceptionId in exceptionIds)
                builder.AppendLine($"- {exceptionId}");
        }
        else
        {
            builder.AppendLine("_No approved exceptions for this control._");
        }

        if (readiness?.OutstandingActions is { Count: > 0 } actions)
        {
            builder.AppendLine();
            builder.AppendLine("## Outstanding actions");
            foreach (string action in actions)
                builder.AppendLine($"- {action}");
        }

        return builder.ToString();
    }

    private static string BuildEvaluation(AuditControlRecord control, AuditControlEvaluationRecord? evaluation)
    {
        StringBuilder builder = new();
        builder.AppendLine($"# Technical evaluation — {control.ControlNumber}");
        builder.AppendLine();
        builder.AppendLine("_Automated evaluation and gaps only — not auditor sign-off._");
        builder.AppendLine();

        if (evaluation is null)
        {
            builder.AppendLine("No automated evaluation is stored for this control.");

            return builder.ToString();
        }

        builder.AppendLine($"Outcome: **{evaluation.Outcome}**");
        builder.AppendLine($"Confidence: {evaluation.Confidence:P0}");
        builder.AppendLine();
        builder.AppendLine(evaluation.EvaluationText);

        return builder.ToString();
    }

    private static string BuildControlFolderName(AuditControlRecord control)
    {
        string sanitized = FileNameSanitizer.Sanitize(control.ControlNumber);

        return $"CONTROL-{sanitized}";
    }

    private static AuditEvidencePackageEntry TextEntry(string root, string relativePath, string content) =>
        new()
        {
            RelativePath = $"{root}/{relativePath}".Replace('\\', '/'),
            Content = Encoding.UTF8.GetBytes(content),
        };
}
