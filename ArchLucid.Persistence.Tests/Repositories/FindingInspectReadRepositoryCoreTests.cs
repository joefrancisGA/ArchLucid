using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInspectReadRepositoryCoreTests
{
    [Fact]
    public void ResolveRuleFields_prefers_applied_rule_ids_json()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[\"rule-1\"]",
            "trace-text");

        ruleId.Should().Be("rule-1");
        ruleName.Should().Be("rule-1");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_present_keeps_decision_rule_name_aligned_with_first_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail"]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_missing_uses_first_trace_rule_text_for_both_fields()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            appliedRuleIdsJson: null,
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_null_element_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[null]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_first_applied_rule_id_is_null_uses_next_non_blank_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """[null, "cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_object_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """{"ruleIds":["cost-guardrail"]}""",
            firstRuleText: "Encrypt data at rest");

        // DecisionTraceRepositoryCore serializes AppliedRuleIds as a JSON array only; object roots fail deserialize and fall back.
        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_scalar_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """"cost-guardrail"""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_empty_array_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_empty_array_and_trace_missing_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields("[]", firstRuleText: null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void ResolveRuleFields_when_first_applied_rule_id_is_whitespace_uses_next_non_blank_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["   ", "cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_malformed_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[not-json",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_blank_uses_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "   ",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_trims_whitespace_from_applied_rule_ids()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["  cost-guardrail  "]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_trims_trace_text_when_applied_rule_ids_json_missing()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            appliedRuleIdsJson: null,
            firstRuleText: "  Encrypt data at rest  ");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_array_when_payload_is_json_array()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            """["artifact-1"]""",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Array);
        typed!.Value[0].GetString().Should().Be("artifact-1");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_only_whitespace_fields_are_present()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("   ", "   ").Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_number_when_payload_is_json_number()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "42",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Number);
        typed!.Value.GetInt32().Should().Be(42);
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_slim_payload_when_only_title_is_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", null);

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_slim_payload_when_only_rationale_is_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void BuildMetadataTypedPayload_trims_whitespace_from_title_and_rationale()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("  Encrypt at rest  ", "  Missing TLS  ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_object_when_payload_is_empty_json_object()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{}",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Object);
        typed!.Value.EnumerateObject().Should().BeEmpty();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_when_payload_json_missing()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(null, "title", "rationale").Should().BeNull();
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect("  ", "title", "rationale").Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_json_when_valid()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            """{"resourceId":"vm-1"}""",
            "title",
            "rationale");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_metadata_when_payload_json_is_corrupt()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void TryParsePayloadJson_returns_null_for_corrupt_json_without_metadata_fallback()
    {
        FindingInspectReadRepositoryCore.TryParsePayloadJson("{ not json").Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_json_null_element_when_payload_is_null_literal()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "null",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_boolean_when_payload_is_json_true()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "true",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.True);
        typed!.Value.GetBoolean().Should().BeTrue();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_string_when_payload_is_json_string()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "\"finding-payload\"",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.String);
        typed!.Value.GetString().Should().Be("finding-payload");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_only_whitespace_entries_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["   ", "  "]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void BuildInspectResponse_uses_rule_id_when_rule_name_is_null()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Critical,
            typedPayload: null,
            ruleId: "cost-guardrail",
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: "1.0",
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.DecisionRuleId.Should().Be("cost-guardrail");
        response.DecisionRuleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_drops_whitespace_entries_and_trims_survivors()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(
            ["  node-a  ", "   ", "", "node-b"]);

        filtered.Should().Equal("node-a", "node-b");
    }

    [Fact]
    public void HasActiveWaiver_returns_true_only_when_count_is_positive()
    {
        FindingInspectReadRepositoryCore.HasActiveWaiver(0).Should().BeFalse();
        FindingInspectReadRepositoryCore.HasActiveWaiver(1).Should().BeTrue();
    }

    [Fact]
    public void EncodeRowVersionStampBase64_returns_null_for_missing_stamp()
    {
        FindingInspectReadRepositoryCore.EncodeRowVersionStampBase64(null).Should().BeNull();
    }

    [Fact]
    public void EncodeRowVersionStampBase64_encodes_stamp_bytes()
    {
        byte[] stamp = [0x01, 0x02, 0x03];

        FindingInspectReadRepositoryCore.EncodeRowVersionStampBase64(stamp).Should().Be(Convert.ToBase64String(stamp));
    }

    [Fact]
    public void ToUtcDateTimeOffset_specifies_utc_kind_for_unspecified_database_timestamps()
    {
        DateTime unspecified = new(2026, 10, 1, 12, 0, 0, DateTimeKind.Unspecified);

        DateTimeOffset? actual = FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(unspecified);

        actual.Should().NotBeNull();
        actual!.Value.Offset.Should().Be(TimeSpan.Zero);
        actual!.Value.UtcDateTime.Should().Be(unspecified);
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_boolean_false_when_payload_is_json_false()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "false",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.False);
        typed!.Value.GetBoolean().Should().BeFalse();
    }

    [Fact]
    public void TryParsePayloadJson_returns_null_for_whitespace_only_payload()
    {
        FindingInspectReadRepositoryCore.TryParsePayloadJson("   ").Should().BeNull();
    }

    [Fact]
    public void ResolveRuleFields_when_trace_text_is_whitespace_only_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(null, "   ");

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_metadata_only_ignores_payload_json()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ToUtcDateTimeOffset_returns_null_for_null_input()
    {
        FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(null).Should().BeNull();
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_returns_empty_when_all_values_are_blank()
    {
        FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(["", "   "]).Should().BeEmpty();
    }

    [Fact]
    public void EncodeRowVersionStampBase64_returns_empty_string_for_empty_stamp()
    {
        FindingInspectReadRepositoryCore.EncodeRowVersionStampBase64([]).Should().BeEmpty();
    }

    [Fact]
    public void MapLatestDisposition_returns_null_when_disposition_row_is_absent()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("Accepted", hasDispositionRow: false).Should().BeNull();
    }

    [Fact]
    public void MapLatestDisposition_parses_disposition_when_row_is_present()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("Accepted", hasDispositionRow: true)
            .Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_metadata_when_corrupt_payload_and_blank_title_rationale()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect("{ not json", "   ", "   ").Should().BeNull();
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_payload_when_both_title_and_rationale_are_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveRuleFields_when_both_sources_are_missing_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(null, null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void ToUtcDateTimeOffset_preserves_utc_timestamps()
    {
        DateTime utc = new(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);

        DateTimeOffset? actual = FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(utc);

        actual.Should().Be(new DateTimeOffset(utc));
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_include_typed_payload_true_deserializes_payload_json()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
    }

    [Fact]
    public void TryParsePayloadJson_returns_null_for_null_input()
    {
        FindingInspectReadRepositoryCore.TryParsePayloadJson(null).Should().BeNull();
    }

    [Fact]
    public void MapLatestDisposition_returns_null_for_invalid_disposition_when_row_is_present()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("bogus", hasDispositionRow: true).Should().BeNull();
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_preserves_input_order()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(
            ["node-b", "node-a"]);

        filtered.Should().Equal("node-b", "node-a");
    }

    [Fact]
    public void BuildInspectResponse_preserves_evidence_and_recommended_actions()
    {
        List<FindingInspectEvidenceItem> evidence =
        [
            new FindingInspectEvidenceItem { ArtifactId = null, LineRange = null, Excerpt = "node-a" },
        ];

        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Warning,
            typedPayload: null,
            ruleId: "rule-1",
            ruleName: "rule-1",
            evidence: evidence,
            recommendedActions: ["Rotate keys"],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: "1.0",
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.Evidence.Should().Equal(evidence);
        response.RecommendedActions.Should().Equal("Rotate keys");
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_returns_null_when_payload_and_metadata_are_absent()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: null,
            title: null,
            rationale: null).Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_null_for_empty_string()
    {
        FindingInspectReadRepositoryCore.TryParsePayloadJson(string.Empty).Should().BeNull();
    }

    [Fact]
    public void BuildInspectResponse_preserves_run_structural_execution_mode_fields()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Warning,
            typedPayload: null,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: "1.0",
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Real,
            runRealModeFellBackToSimulator: true);

        response.RunStructuralExecutionMode.Should().Be(StructuralExecutionMode.Real);
        response.RunRealModeFellBackToSimulator.Should().BeTrue();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_metadata_only_returns_null_when_metadata_is_blank()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "   ",
            rationale: "   ").Should().BeNull();
    }

    [Fact]
    public void MapLatestDisposition_returns_null_when_disposition_raw_is_whitespace_with_row_present()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("   ", hasDispositionRow: true).Should().BeNull();
    }

    [Fact]
    public void HasActiveWaiver_returns_false_for_non_positive_counts()
    {
        FindingInspectReadRepositoryCore.HasActiveWaiver(0).Should().BeFalse();
        FindingInspectReadRepositoryCore.HasActiveWaiver(-1).Should().BeFalse();
    }

    [Fact]
    public void ResolveIncludeTypedPayload_defaults_true_when_options_are_null()
    {
        FindingInspectReadRepositoryCore.ResolveIncludeTypedPayload(null).Should().BeTrue();
    }

    [Fact]
    public void ResolveIncludeTypedPayload_honors_metadata_only_options()
    {
        FindingInspectReadRepositoryCore.ResolveIncludeTypedPayload(FindingInspectReadOptions.MetadataOnly).Should().BeFalse();
        FindingInspectReadRepositoryCore.ResolveIncludeTypedPayload(FindingInspectReadOptions.Full).Should().BeTrue();
    }

    [Fact]
    public void NormalizeFindingId_trims_surrounding_whitespace()
    {
        FindingInspectReadRepositoryCore.NormalizeFindingId("  finding-1  ").Should().Be("finding-1");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_title_only_metadata_when_payload_is_corrupt()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "Encrypt at rest",
            null);

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_returns_empty_when_all_nodes_are_blank()
    {
        FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(["", "   "]).Should().BeEmpty();
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_sets_null_artifact_and_line_range_with_trimmed_excerpt()
    {
        IReadOnlyList<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(
            ["  node-a  "]);

        evidence.Should().ContainSingle();
        evidence[0].ArtifactId.Should().BeNull();
        evidence[0].LineRange.Should().BeNull();
        evidence[0].Excerpt.Should().Be("node-a");
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_drops_whitespace_related_nodes()
    {
        IReadOnlyList<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(
            ["node-a", "   ", "", "node-b"]);

        evidence.Should().HaveCount(2);
        evidence.Select(static item => item.Excerpt).Should().Equal("node-a", "node-b");
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_preserves_related_node_order()
    {
        IReadOnlyList<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(
            ["node-b", "node-a"]);

        evidence.Select(static item => item.Excerpt).Should().Equal("node-b", "node-a");
    }

    [Fact]
    public void ResolveMainInspectSql_routes_to_payload_and_metadata_only_queries()
    {
        FindingInspectReadRepositoryCore.ResolveMainInspectSql(includeTypedPayload: true)
            .Should().Be(FindingInspectReadSql.MainInspectWithTypedPayload);
        FindingInspectReadRepositoryCore.ResolveMainInspectSql(includeTypedPayload: false)
            .Should().Be(FindingInspectReadSql.MainInspectWithoutTypedPayload);
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_defaults_when_pointer_row_is_absent()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: false,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: DateTime.UtcNow,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionOccurredAtUtc.Should().BeNull();
        projection.LatestDispositionEventId.Should().BeNull();
        projection.LatestDispositionRowVersionBase64.Should().BeNull();
        projection.LatestDispositionReviewerUserId.Should().BeNull();
        projection.RevisitDueUtc.Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_pointer_metadata_when_row_is_present()
    {
        Guid eventId = Guid.NewGuid();
        DateTimeOffset occurredAtUtc = new(2026, 10, 2, 8, 0, 0, TimeSpan.Zero);
        DateTime revisitDueUtc = new(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc);
        byte[] rowVersionStamp = [0x0A, 0x0B];

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Deferred",
            hasDispositionRow: true,
            occurredAtUtc: occurredAtUtc,
            revisitDueUtc: revisitDueUtc,
            eventId: eventId,
            reviewerUserId: "reviewer-1",
            rowVersionStamp: rowVersionStamp);

        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
        projection.LatestDispositionOccurredAtUtc.Should().Be(occurredAtUtc);
        projection.LatestDispositionEventId.Should().Be(eventId);
        projection.LatestDispositionRowVersionBase64.Should().Be(Convert.ToBase64String(rowVersionStamp));
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer-1");
        projection.RevisitDueUtc.Should().Be(new DateTimeOffset(revisitDueUtc));
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_rationale_only_metadata_when_payload_is_corrupt()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            null,
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void BuildInspectResponse_preserves_governance_and_disposition_fields()
    {
        DateTimeOffset dispositionOccurredAt = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset remediationDueUtc = new(2026, 10, 15, 0, 0, 0, TimeSpan.Zero);
        Guid runId = Guid.NewGuid();

        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Warning,
            typedPayload: null,
            ruleId: "rule-1",
            ruleName: "rule-1",
            evidence: [],
            recommendedActions: [],
            auditRowId: Guid.NewGuid(),
            runId: runId,
            manifestVersion: "1.0",
            modelDeploymentName: "gpt-4",
            modelAlias: "primary",
            promptTemplateVersion: "v2",
            confidenceScore: 0.91,
            evaluationConfidenceScore: 4,
            confidenceLevel: FindingConfidenceLevel.High,
            humanReviewStatus: FindingHumanReviewStatus.Pending,
            isMuted: true,
            muteReason: "noise",
            reasoningTrace: "trace",
            reasoningTraceDigestSha256: "digest",
            latestDisposition: FindingDisposition.Accepted,
            latestDispositionOccurredAtUtc: dispositionOccurredAt,
            hasActiveWaiver: true,
            assignedToUserId: "user-1",
            remediationDueUtc: remediationDueUtc,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.AuditRowId.Should().NotBeNull();
        response.HasActiveWaiver.Should().BeTrue();
        response.LatestDisposition.Should().Be(FindingDisposition.Accepted);
        response.LatestDispositionOccurredAtUtc.Should().Be(dispositionOccurredAt);
        response.AssignedToUserId.Should().Be("user-1");
        response.RemediationDueUtc.Should().Be(remediationDueUtc);
        response.IsMuted.Should().BeTrue();
        response.MuteReason.Should().Be("noise");
        response.RunId.Should().Be(runId);
        response.ManifestVersion.Should().Be("1.0");
        response.ModelDeploymentName.Should().Be("gpt-4");
        response.ModelAlias.Should().Be("primary");
        response.PromptTemplateVersion.Should().Be("v2");
        response.ConfidenceScore.Should().Be(0.91);
        response.EvaluationConfidenceScore.Should().Be(4);
        response.ConfidenceLevel.Should().Be(FindingConfidenceLevel.High);
        response.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Pending);
        response.ReasoningTrace.Should().Be("trace");
        response.ReasoningTraceDigestSha256.Should().Be("digest");
    }

    [Fact]
    public void FilterRecommendedActions_drops_whitespace_entries_and_trims_survivors()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterRecommendedActions(
            ["  Rotate keys  ", "   ", "Enable MFA"]);

        filtered.Should().Equal("Rotate keys", "Enable MFA");
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_object_for_valid_json()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("""{"resourceId":"vm-1"}""");

        parsed.Should().NotBeNull();
        parsed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_metadata_only_ignores_corrupt_payload_json()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: "{ not json",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_null_disposition_for_invalid_raw_when_row_present()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "bogus",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionEventId.Should().NotBeNull();
    }

    [Fact]
    public void ResolveDecisionRuleName_falls_back_to_rule_id_when_name_is_null()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName(null, "cost-guardrail").Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveDecisionRuleName_returns_null_when_both_rule_fields_are_null()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName(null, null).Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_array_for_valid_json_array()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("""["artifact-1"]""");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Array);
        parsed!.Value[0].GetString().Should().Be("artifact-1");
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_null_row_version_when_stamp_missing()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: null);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
        projection.LatestDispositionRowVersionBase64.Should().BeNull();
    }

    [Fact]
    public void FilterRecommendedActions_returns_empty_when_all_actions_are_blank()
    {
        FindingInspectReadRepositoryCore.FilterRecommendedActions(["", "   "]).Should().BeEmpty();
    }

    [Fact]
    public void ToUtcDateTimeOffset_converts_local_kind_timestamps_to_utc_offset()
    {
        DateTime local = new(2026, 10, 3, 9, 30, 0, DateTimeKind.Local);

        DateTimeOffset? actual = FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(local);

        actual.Should().NotBeNull();
        actual!.Value.Offset.Should().Be(TimeSpan.Zero);
        actual!.Value.UtcDateTime.Should().Be(local);
    }

    [Fact]
    public void BuildInspectResponse_sets_null_decision_rule_fields_when_both_sources_missing()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Info,
            typedPayload: null,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.DecisionRuleId.Should().BeNull();
        response.DecisionRuleName.Should().BeNull();
    }

    [Fact]
    public void ResolveDecisionRuleName_prefers_rule_name_when_both_fields_are_present()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName("Encrypt data at rest", "cost-guardrail")
            .Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveTraceRuleFields_trims_trace_text_and_aligns_rule_id_and_name()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveTraceRuleFields("  Encrypt data at rest  ");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveTraceRuleFields_returns_nulls_for_whitespace_only_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveTraceRuleFields("   ");

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_boolean_for_valid_json_true()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("true");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.True);
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_string_for_valid_json_string()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("\"finding-payload\"");

        parsed.Should().NotBeNull();
        parsed!.Value.GetString().Should().Be("finding-payload");
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_number_for_valid_json_number()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("42");

        parsed.Should().NotBeNull();
        parsed!.Value.GetInt32().Should().Be(42);
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_null_reviewer_user_id_when_pointer_row_exists()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: null,
            rowVersionStamp: [0x01]);

        projection.LatestDispositionReviewerUserId.Should().BeNull();
        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void BuildInspectResponse_preserves_finding_id_severity_and_typed_payload()
    {
        using JsonDocument document = JsonDocument.Parse("""{"resourceId":"vm-1"}""");
        JsonElement typedPayload = document.RootElement.Clone();

        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-42",
            severity: FindingSeverity.Critical,
            typedPayload: typedPayload,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.FindingId.Should().Be("finding-42");
        response.Severity.Should().Be(FindingSeverity.Critical);
        response.TypedPayload.Should().NotBeNull();
        response.TypedPayload!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_builds_full_metadata_when_corrupt_payload_and_both_fields_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_nested_array_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """[["cost-guardrail"]]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_numeric_element_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[42]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_only_numeric_elements_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[42]",
            firstRuleText: null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_null_disposition_when_disposition_raw_is_null_with_row_present()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: null,
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer");
    }

    [Fact]
    public void FilterRecommendedActions_preserves_input_order()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterRecommendedActions(
            ["Enable MFA", "Rotate keys"]);

        filtered.Should().Equal("Enable MFA", "Rotate keys");
    }

    [Fact]
    public void BuildMetadataTypedPayload_sets_why_this_matters_null_when_only_title_is_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", null);

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("whyThisMatters").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_null_occurred_at_when_pointer_row_exists()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: true,
            occurredAtUtc: null,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
        projection.LatestDispositionOccurredAtUtc.Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_null_revisit_due_when_revisit_due_utc_missing()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Deferred",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
        projection.RevisitDueUtc.Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_empty_string_for_json_empty_string_literal()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("\"\"");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.String);
        parsed!.Value.GetString().Should().BeEmpty();
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_boolean_element_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[true]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_only_boolean_elements_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[true]",
            firstRuleText: null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void ResolveRuleFields_uses_first_valid_id_when_multiple_rule_ids_are_present()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail", "encrypt-at-rest"]""",
            firstRuleText: "trace fallback");

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void HasActiveWaiver_returns_true_for_large_positive_counts()
    {
        FindingInspectReadRepositoryCore.HasActiveWaiver(long.MaxValue).Should().BeTrue();
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_null_event_id_when_pointer_row_exists()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: null,
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
        projection.LatestDispositionEventId.Should().BeNull();
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_ignores_null_entries_without_throwing()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(
            [null!, "  node-a  ", null!, ""]);

        filtered.Should().Equal("node-a");
    }

    [Fact]
    public void BuildMetadataTypedPayload_emits_lowercase_metadata_property_names()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.EnumerateObject().Select(static property => property.Name)
            .Should().Equal("title", "rationale", "whyThisMatters");
    }

    [Fact]
    public void ResolveDecisionRuleName_returns_empty_string_when_rule_name_is_empty_without_falling_back_to_rule_id()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName(string.Empty, "cost-guardrail")
            .Should().BeEmpty();
    }

    [Fact]
    public void ResolveDecisionRuleName_preserves_whitespace_only_rule_name_without_falling_back_to_rule_id()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName("   ", "cost-guardrail")
            .Should().Be("   ");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_prefers_deserialized_payload_over_metadata_when_both_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            """{"resourceId":"vm-1"}""",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
        typed!.Value.TryGetProperty("title", out _).Should().BeFalse();
    }

    [Fact]
    public void ResolveTraceRuleFields_returns_nulls_when_trace_text_is_null()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveTraceRuleFields(null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void FilterRecommendedActions_matches_filter_non_blank_trimmed_strings_output()
    {
        string[] values = ["  Rotate keys  ", "   ", "Enable MFA"];

        FindingInspectReadRepositoryCore.FilterRecommendedActions(values)
            .Should()
            .Equal(FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(values));
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_object_elements_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """[{"ruleId":"cost-guardrail"}]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_null_literal_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "null",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void MapLatestDisposition_returns_null_when_disposition_raw_is_empty_with_row_present()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition(string.Empty, hasDispositionRow: true).Should().BeNull();
    }

    [Fact]
    public void EncodeRowVersionStampBase64_encodes_single_zero_byte_stamp()
    {
        FindingInspectReadRepositoryCore.EncodeRowVersionStampBase64([0x00]).Should().Be(Convert.ToBase64String([0x00]));
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_zero_for_json_number_zero()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("0");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Number);
        parsed!.Value.GetInt32().Should().Be(0);
    }

    [Fact]
    public void FilterRecommendedActions_ignores_null_entries_without_throwing()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterRecommendedActions(
            [null!, "  Rotate keys  ", null!]);

        filtered.Should().Equal("Rotate keys");
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_ignores_null_entries_without_throwing()
    {
        IReadOnlyList<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(
            [null!, "  node-a  ", null!]);

        evidence.Should().ContainSingle();
        evidence[0].Excerpt.Should().Be("node-a");
    }

    [Fact]
    public void NormalizeFindingId_returns_empty_string_when_input_is_whitespace_only()
    {
        FindingInspectReadRepositoryCore.NormalizeFindingId("   ").Should().BeEmpty();
    }

    [Fact]
    public void ResolveRuleFields_prefers_applied_rule_ids_json_over_trace_text_when_both_present()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail"]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void BuildMetadataTypedPayload_builds_rationale_only_payload_when_title_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("   ", "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void BuildMetadataTypedPayload_builds_title_only_payload_when_rationale_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", "   ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("whyThisMatters").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_null_for_json_null_literal()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("null");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_preserves_duplicate_entries()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(
            ["node-a", "node-a"]);

        filtered.Should().Equal("node-a", "node-a");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_only_without_trace_returns_rule_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void MapDispositionPointerProjection_converts_unspecified_revisit_due_to_utc_offset()
    {
        DateTime unspecified = new(2026, 11, 1, 0, 0, 0, DateTimeKind.Unspecified);

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Deferred",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: unspecified,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.RevisitDueUtc.Should().Be(new DateTimeOffset(DateTime.SpecifyKind(unspecified, DateTimeKind.Utc)));
    }

    [Fact]
    public void EncodeRowVersionStampBase64_encodes_multi_byte_stamp()
    {
        byte[] stamp = [0x01, 0x02, 0x03];

        FindingInspectReadRepositoryCore.EncodeRowVersionStampBase64(stamp).Should().Be(Convert.ToBase64String(stamp));
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_metadata_when_corrupt_payload_and_whitespace_only_fields()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "   ",
            "   ").Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_converts_local_revisit_due_to_utc_offset()
    {
        DateTime local = new(2026, 11, 1, 0, 0, 0, DateTimeKind.Local);

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Deferred",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: local,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.RevisitDueUtc.Should().Be(new DateTimeOffset(DateTime.SpecifyKind(local, DateTimeKind.Utc)));
    }

    [Fact]
    public void BuildInspectResponse_preserves_decision_rule_id_when_rule_name_is_empty_string()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Info,
            typedPayload: null,
            ruleId: "cost-guardrail",
            ruleName: string.Empty,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.DecisionRuleId.Should().Be("cost-guardrail");
        response.DecisionRuleName.Should().BeEmpty();
    }

    [Fact]
    public async Task DapperFindingInspectReadRepository_GetInspectAsync_throws_when_scope_is_null()
    {
        DapperFindingInspectReadRepository repository = new(new Mock<ISqlConnectionFactory>().Object);

        Func<Task> act = async () => await repository.GetInspectAsync(
            scope: null!,
            findingId: "finding-demo-00000000000000000000000000000001-primary",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task DapperFindingInspectReadRepository_GetInspectAsync_throws_when_finding_id_is_null()
    {
        DapperFindingInspectReadRepository repository = new(new Mock<ISqlConnectionFactory>().Object);
        ScopeContext scope = new();

        Func<Task> act = async () => await repository.GetInspectAsync(scope, null!, CancellationToken.None);

        ArgumentException exception = (await act.Should().ThrowAsync<ArgumentException>()).Which;
        exception.ParamName.Should().Be("findingId");
        exception.Message.Should().Contain("Finding id is required.");
    }

    [Fact]
    public async Task DapperFindingInspectReadRepository_GetInspectAsync_throws_when_finding_id_is_whitespace()
    {
        DapperFindingInspectReadRepository repository = new(new Mock<ISqlConnectionFactory>().Object);
        ScopeContext scope = new();

        Func<Task> act = async () => await repository.GetInspectAsync(scope, "   ", CancellationToken.None);

        ArgumentException exception = (await act.Should().ThrowAsync<ArgumentException>()).Which;
        exception.ParamName.Should().Be("findingId");
        exception.Message.Should().Contain("Finding id is required.");
    }

    [Fact]
    public async Task DapperFindingInspectReadRepository_GetInspectAsync_throws_when_finding_id_is_empty()
    {
        DapperFindingInspectReadRepository repository = new(new Mock<ISqlConnectionFactory>().Object);
        ScopeContext scope = new();

        Func<Task> act = async () => await repository.GetInspectAsync(scope, string.Empty, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public void ToUtcDateTimeOffset_converts_local_remediation_timestamp_to_utc_offset()
    {
        DateTime local = new(2026, 10, 15, 9, 30, 0, DateTimeKind.Local);

        DateTimeOffset? actual = FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(local);

        actual.Should().NotBeNull();
        actual!.Value.Offset.Should().Be(TimeSpan.Zero);
        actual!.Value.UtcDateTime.Should().Be(local);
    }

    [Fact]
    public void MapLatestDisposition_maps_defined_numeric_disposition_when_row_is_present()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("2", hasDispositionRow: true)
            .Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void ResolveDecisionRuleName_returns_whitespace_rule_id_when_rule_name_is_null()
    {
        FindingInspectReadRepositoryCore.ResolveDecisionRuleName(null, "   ")
            .Should().Be("   ");
    }

    [Fact]
    public void MapDispositionPointerProjection_encodes_empty_row_version_stamp_as_empty_base64_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "Accepted",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: []);

        projection.LatestDispositionRowVersionBase64.Should().BeEmpty();
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_returns_empty_for_empty_input_sequence()
    {
        FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(Array.Empty<string>()).Should().BeEmpty();
    }

    [Fact]
    public void ResolveRuleFields_returns_first_entry_when_applied_rule_ids_json_contains_duplicates()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail", "cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_rationale_only_metadata_when_payload_is_corrupt_and_title_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "   ",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ToUtcDateTimeOffset_labels_unspecified_remediation_timestamp_as_utc_offset()
    {
        DateTime unspecified = new(2026, 10, 20, 8, 0, 0, DateTimeKind.Unspecified);

        DateTimeOffset? actual = FindingInspectReadRepositoryCore.ToUtcDateTimeOffset(unspecified);

        actual.Should().NotBeNull();
        actual!.Value.Offset.Should().Be(TimeSpan.Zero);
        actual!.Value.UtcDateTime.Should().Be(unspecified);
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_only_duplicate_whitespace_entries_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["   ", "   "]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_title_only_metadata_when_payload_is_corrupt_and_rationale_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "Encrypt at rest",
            "   ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("whyThisMatters").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_when_payload_is_empty_string_even_with_valid_title()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            string.Empty,
            "Encrypt at rest",
            "Missing TLS").Should().BeNull();
    }

    [Fact]
    public void FilterRecommendedActions_returns_empty_for_empty_input_sequence()
    {
        FindingInspectReadRepositoryCore.FilterRecommendedActions(Array.Empty<string>()).Should().BeEmpty();
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_returns_empty_for_empty_input_sequence()
    {
        FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(Array.Empty<string>()).Should().BeEmpty();
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_pointer_metadata_when_disposition_raw_is_invalid()
    {
        DateTimeOffset occurredAt = new(2026, 10, 5, 14, 30, 0, TimeSpan.Zero);
        Guid eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "bogus",
            hasDispositionRow: true,
            occurredAtUtc: occurredAt,
            revisitDueUtc: new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Unspecified),
            eventId: eventId,
            reviewerUserId: "reviewer-1",
            rowVersionStamp: [0x02]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionOccurredAtUtc.Should().Be(occurredAt);
        projection.LatestDispositionEventId.Should().Be(eventId);
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer-1");
        projection.RevisitDueUtc.Should().NotBeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_metadata_only_builds_title_only_payload_when_rationale_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "Encrypt at rest",
            rationale: "   ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("whyThisMatters").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_metadata_only_builds_rationale_only_payload_when_title_is_whitespace()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "   ",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveTraceRuleFields_returns_nulls_for_empty_string_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveTraceRuleFields(string.Empty);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_null_row_version_when_disposition_raw_is_invalid()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "bogus",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: null);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionRowVersionBase64.Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_negative_number_for_json_minus_one()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("-1");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Number);
        parsed!.Value.GetInt32().Should().Be(-1);
    }

    [Fact]
    public void FilterNonBlankTrimmedStrings_preserves_internal_whitespace_when_trimming_survivors()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterNonBlankTrimmedStrings(
            ["  node  a  "]);

        filtered.Should().Equal("node  a");
    }

    [Fact]
    public void BuildEvidenceFromRelatedNodes_preserves_internal_whitespace_in_excerpt()
    {
        IReadOnlyList<FindingInspectEvidenceItem> evidence = FindingInspectReadRepositoryCore.BuildEvidenceFromRelatedNodes(
            ["  subnet  east  "]);

        evidence.Should().ContainSingle();
        evidence[0].Excerpt.Should().Be("subnet  east");
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_defined_numeric_disposition_string_zero_to_accepted()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "0",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_empty_array_for_json_empty_array()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("[]");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Array);
        parsed!.Value.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_when_payload_is_whitespace_only_even_with_valid_metadata()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "   ",
            "Encrypt at rest",
            "Missing TLS").Should().BeNull();
    }

    [Fact]
    public void ResolveTraceRuleFields_preserves_internal_whitespace_after_trim()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveTraceRuleFields("  cost  guardrail  ");

        ruleId.Should().Be("cost  guardrail");
        ruleName.Should().Be("cost  guardrail");
    }

    [Fact]
    public void BuildInspectResponse_passes_through_has_active_waiver_false()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Info,
            typedPayload: null,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.HasActiveWaiver.Should().BeFalse();
    }

    [Fact]
    public void BuildInspectResponse_passes_through_has_active_waiver_true()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Info,
            typedPayload: null,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: true,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.HasActiveWaiver.Should().BeTrue();
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_defined_numeric_disposition_string_one_to_deferred()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "1",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_whitespace_padded_disposition_raw_to_accepted()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "  Accepted  ",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void ResolveRuleFields_preserves_internal_whitespace_in_applied_rule_ids_json_elements()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["  cost  guardrail  "]""",
            firstRuleText: null);

        ruleId.Should().Be("cost  guardrail");
        ruleName.Should().Be("cost  guardrail");
    }

    [Fact]
    public void FilterRecommendedActions_preserves_internal_whitespace_when_trimming_survivors()
    {
        IReadOnlyList<string> filtered = FindingInspectReadRepositoryCore.FilterRecommendedActions(
            ["  Rotate  keys  "]);

        filtered.Should().Equal("Rotate  keys");
    }

    [Fact]
    public void BuildMetadataTypedPayload_preserves_internal_whitespace_in_title_and_rationale()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(
            "  Encrypt  at  rest  ",
            "  Missing  TLS  ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt  at  rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing  TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing  TLS");
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_empty_object_for_json_empty_object()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("{}");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Object);
        parsed!.Value.EnumerateObject().Should().BeEmpty();
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_defined_numeric_disposition_string_two_to_needs_evidence()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "2",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_defined_numeric_disposition_string_three_to_remediated()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "3",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_defined_numeric_disposition_string_four_to_rejected_as_not_applicable()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "4",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.RejectedAsNotApplicable);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_case_insensitive_needs_evidence_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "needsevidence",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void BuildInspectResponse_passes_through_run_real_mode_fell_back_to_simulator_false()
    {
        FindingInspectResponse response = FindingInspectReadRepositoryCore.BuildInspectResponse(
            findingId: "finding-1",
            severity: FindingSeverity.Info,
            typedPayload: null,
            ruleId: null,
            ruleName: null,
            evidence: [],
            recommendedActions: [],
            auditRowId: null,
            runId: Guid.NewGuid(),
            manifestVersion: null,
            modelDeploymentName: null,
            modelAlias: null,
            promptTemplateVersion: null,
            confidenceScore: null,
            evaluationConfidenceScore: null,
            confidenceLevel: null,
            humanReviewStatus: FindingHumanReviewStatus.NotRequired,
            isMuted: false,
            muteReason: null,
            reasoningTrace: null,
            reasoningTraceDigestSha256: null,
            latestDisposition: null,
            latestDispositionOccurredAtUtc: null,
            hasActiveWaiver: false,
            assignedToUserId: null,
            remediationDueUtc: null,
            runStructuralExecutionMode: StructuralExecutionMode.Simulator,
            runRealModeFellBackToSimulator: false);

        response.RunRealModeFellBackToSimulator.Should().BeFalse();
    }

    [Fact]
    public void NormalizeFindingId_preserves_internal_whitespace()
    {
        FindingInspectReadRepositoryCore.NormalizeFindingId("  finding  42  ").Should().Be("finding  42");
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_case_insensitive_accepted_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "accepted",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_case_insensitive_deferred_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "deferred",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_case_insensitive_remediated_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "remediated",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_case_insensitive_rejected_as_not_applicable_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "rejectedasnotapplicable",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.RejectedAsNotApplicable);
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_null_disposition_for_undefined_numeric_string_five()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "5",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().BeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_returns_null_disposition_for_negative_numeric_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "-1",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_metadata_only_builds_full_metadata_when_both_title_and_rationale_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: false,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_include_typed_payload_true_falls_back_to_metadata_for_corrupt_payload()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: "{ not json",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_include_typed_payload_true_returns_null_for_corrupt_payload_and_blank_metadata()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: "{ not json",
            title: "   ",
            rationale: "   ").Should().BeNull();
    }

    [Fact]
    public void MapLatestDisposition_returns_null_for_undefined_numeric_string_five()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("5", hasDispositionRow: true).Should().BeNull();
    }

    [Fact]
    public void MapLatestDisposition_returns_null_for_negative_numeric_string()
    {
        FindingInspectReadRepositoryCore.MapLatestDisposition("-1", hasDispositionRow: true).Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_decimal_for_json_number_with_fraction()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("1.5");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Number);
        parsed!.Value.GetDouble().Should().Be(1.5);
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_pointer_metadata_when_disposition_is_undefined_numeric_five()
    {
        DateTimeOffset occurredAt = new(2026, 10, 6, 9, 15, 0, TimeSpan.Zero);
        Guid eventId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "5",
            hasDispositionRow: true,
            occurredAtUtc: occurredAt,
            revisitDueUtc: new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Unspecified),
            eventId: eventId,
            reviewerUserId: "reviewer-2",
            rowVersionStamp: [0x03]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionOccurredAtUtc.Should().Be(occurredAt);
        projection.LatestDispositionEventId.Should().Be(eventId);
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer-2");
        projection.RevisitDueUtc.Should().NotBeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_include_typed_payload_true_prefers_deserialized_payload_over_metadata()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: """{"resourceId":"vm-1"}""",
            title: "Encrypt at rest",
            rationale: "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
        typed!.Value.TryGetProperty("title", out _).Should().BeFalse();
    }

    [Fact]
    public void ResolveTypedPayloadForInspectRead_when_include_typed_payload_true_returns_null_for_whitespace_only_payload_even_with_metadata()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspectRead(
            includeTypedPayload: true,
            payloadJson: "   ",
            title: "Encrypt at rest",
            rationale: "Missing TLS").Should().BeNull();
    }

    [Fact]
    public void TryParsePayloadJson_returns_deserialized_number_for_scientific_notation()
    {
        JsonElement? parsed = FindingInspectReadRepositoryCore.TryParsePayloadJson("1e3");

        parsed.Should().NotBeNull();
        parsed!.Value.ValueKind.Should().Be(JsonValueKind.Number);
        parsed!.Value.GetDouble().Should().Be(1000);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_whitespace_padded_deferred_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "  Deferred  ",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_whitespace_padded_remediated_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "  Remediated  ",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_pointer_metadata_when_disposition_is_negative_numeric()
    {
        DateTimeOffset occurredAt = new(2026, 10, 7, 11, 0, 0, TimeSpan.Zero);
        Guid eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "-1",
            hasDispositionRow: true,
            occurredAtUtc: occurredAt,
            revisitDueUtc: new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Unspecified),
            eventId: eventId,
            reviewerUserId: "reviewer-3",
            rowVersionStamp: [0x04]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionOccurredAtUtc.Should().Be(occurredAt);
        projection.LatestDispositionEventId.Should().Be(eventId);
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer-3");
        projection.RevisitDueUtc.Should().NotBeNull();
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_whitespace_padded_needs_evidence_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "  NeedsEvidence  ",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void MapDispositionPointerProjection_maps_whitespace_padded_rejected_as_not_applicable_string()
    {
        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "  RejectedAsNotApplicable  ",
            hasDispositionRow: true,
            occurredAtUtc: DateTimeOffset.UtcNow,
            revisitDueUtc: null,
            eventId: Guid.NewGuid(),
            reviewerUserId: "reviewer",
            rowVersionStamp: [0x01]);

        projection.LatestDisposition.Should().Be(FindingDisposition.RejectedAsNotApplicable);
    }

    [Fact]
    public void MapDispositionPointerProjection_preserves_pointer_metadata_when_disposition_raw_is_whitespace_only()
    {
        DateTimeOffset occurredAt = new(2026, 10, 8, 14, 30, 0, TimeSpan.Zero);
        Guid eventId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        DispositionPointerProjection projection = FindingInspectReadRepositoryCore.MapDispositionPointerProjection(
            dispositionRaw: "   ",
            hasDispositionRow: true,
            occurredAtUtc: occurredAt,
            revisitDueUtc: new DateTime(2026, 11, 4, 0, 0, 0, DateTimeKind.Unspecified),
            eventId: eventId,
            reviewerUserId: "reviewer-4",
            rowVersionStamp: [0x05]);

        projection.LatestDisposition.Should().BeNull();
        projection.LatestDispositionOccurredAtUtc.Should().Be(occurredAt);
        projection.LatestDispositionEventId.Should().Be(eventId);
        projection.LatestDispositionReviewerUserId.Should().Be("reviewer-4");
        projection.RevisitDueUtc.Should().NotBeNull();
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_only_empty_string_entries_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["", "   "]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }
}
