using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

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
    }
}
