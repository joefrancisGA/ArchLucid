using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     In-memory storage mode: resolves the inspector from hydrated <see cref="RunDetailDto" /> (no relational SQL
///     tables).
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "In-memory composition path; SQL integration tests cover the Dapper implementation.")]
public sealed class InMemoryFindingInspectReadRepository(IAuthorityQueryService authorityQuery)
    : IFindingInspectReadRepository
{
    private static readonly Regex DemoFindingId =
        new(
            "^finding-demo-(?<run>[0-9a-fA-F]{32})-(?<slot>primary|secondary)$",
            RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    /// <inheritdoc />
    public async Task<FindingInspectResponse?> GetInspectAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct,
        FindingInspectReadOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        bool includeTypedPayload = FindingInspectReadRepositoryCore.ResolveIncludeTypedPayload(options);

        Match m = DemoFindingId.Match(FindingInspectReadRepositoryCore.NormalizeFindingId(findingId));

        if (!m.Success)
            return null;

        if (!Guid.TryParseExact(m.Groups["run"].Value, "N", out Guid runId))
            return null;

        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runId, ct);

        if (detail?.FindingsSnapshot?.Findings is not { Count: > 0 } findings)
            return null;

        Finding? match = findings.FirstOrDefault(f =>
            string.Equals(f.FindingId, findingId, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            return null;

        List<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore
            .BuildEvidenceFromRelatedNodes(match.RelatedNodeIds)
            .ToList();

        string? appliedRuleIdsJson = null;

        if (detail.AuthorityTrace is RuleAuditTraceDto ruleAudit
            && ruleAudit.RuleAudit.AppliedRuleIds is { Count: > 0 } appliedRuleIds)
        {
            appliedRuleIdsJson = JsonSerializer.Serialize(appliedRuleIds);
        }

        string? firstRuleText = match.Trace?.RulesApplied is { Count: > 0 } rules
            ? rules[0]
            : null;

        (string? ruleId, string? ruleName) =
            FindingInspectReadRepositoryCore.ResolveRuleFields(appliedRuleIdsJson, firstRuleText);

        JsonElement? typed = includeTypedPayload
            ? ResolveTypedPayloadForInMemoryInspect(match)
            : FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(match.Title, match.Rationale);

        List<string> recommendedActions = FindingInspectReadRepositoryCore
            .FilterRecommendedActions(match.RecommendedActions)
            .ToList();

        return new FindingInspectResponse
        {
            FindingId = FindingInspectReadRepositoryCore.NormalizeFindingId(match.FindingId),
            Severity = match.Severity,
            TypedPayload = typed,
            Classification = match.Classification
                ?? FindingInspectReadRepositoryCore.ResolveInspectClassification(null, typed),
            Treatment = match.Treatment
                ?? FindingInspectReadRepositoryCore.ResolveInspectTreatment(null, typed),
            SemanticSupportBand = match.SemanticSupportBand
                ?? FindingInspectReadRepositoryCore.ResolveInspectSemanticSupportBand(null, typed),
            DecisionRuleId = ruleId,
            DecisionRuleName = FindingInspectReadRepositoryCore.ResolveDecisionRuleName(ruleName, ruleId),
            Evidence = evidence,
            RecommendedActions = recommendedActions,
            AuditRowId = null,
            RunId = runId,
            ManifestVersion = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(
                detail.Run.CurrentManifestVersion),
            ModelDeploymentName =
                FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(match.ModelDeploymentName),
            ModelAlias = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(match.ModelAlias),
            PromptTemplateVersion =
                FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(match.PromptTemplateVersion),
            ConfidenceScore = match.ConfidenceScore,
            EvaluationConfidenceScore = match.EvaluationConfidenceScore,
            ConfidenceLevel = match.ConfidenceLevel,
            HumanReviewStatus = match.HumanReviewStatus,
            IsMuted = match.IsMuted,
            MuteReason = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(match.MuteReason),
            ReasoningTrace = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(
                ResolveInspectReasoningTrace(match)),
            ReasoningTraceDigestSha256 = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(
                match.Trace?.ReasoningTraceDigestSha256),
            AssignedToUserId = FindingInspectReadRepositoryCore.NormalizeInspectDisplayText(match.AssignedToUserId),
            RemediationDueUtc = match.RemediationDueUtc,
            RunStructuralExecutionMode = detail.Run.StructuralExecutionMode,
            RunRealModeFellBackToSimulator = detail.Run.RealModeFellBackToSimulator,
        };
    }

    private static string? ResolveInspectReasoningTrace(Finding finding)
    {
        return FindingCounterfactualNotes.ToPrefixedWireValue(finding.Trace?.Notes)
            ?? finding.Trace?.ReasoningTrace;
    }

    private static JsonElement? ResolveTypedPayloadForInMemoryInspect(Finding finding)
    {
        if (finding.Payload is null)
            return null;

        try
        {
            return JsonSerializer.SerializeToElement(finding.Payload);
        }
        catch (NotSupportedException)
        {
            // Parity with Dapper inspect corrupt non-empty PayloadJson metadata fallback (#1238).
            return FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(
                finding.Title,
                finding.Rationale,
                includeWhyThisMattersWhenTitleMissing: true);
        }
    }
}
