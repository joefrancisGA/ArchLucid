using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryFindingInspectReadRepositoryNormalizationTests
{
    [Fact]
    public async Task GetInspectAsync_normalizes_governance_text_fields_like_sql_inspect_mapper()
    {
        Guid runId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Warning,
            Title = "Title",
            Rationale = "Rationale",
            MuteReason = "\u200B",
            AssignedToUserId = " user\u200B ",
            Trace = new ExplainabilityTrace { ReasoningTrace = " trace\u200B " },
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.FindingId.Should().Be(findingId);
        response.MuteReason.Should().BeNull();
        response.AssignedToUserId.Should().BeNull();
        response.ReasoningTrace.Should().BeNull();
    }

    [Fact]
    public async Task GetInspectAsync_filters_recommended_actions_like_sql_inspect_join()
    {
        Guid runId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Title",
            Rationale = "Rationale",
            RecommendedActions = ["\u200B", "  Rotate keys  ", "patch\u200Bgap"],
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.RecommendedActions.Should().Equal("Rotate keys");
    }

    [Fact]
    public async Task GetInspectAsync_uses_first_substantive_trace_rule_when_applied_rule_ids_are_absent()
    {
        Guid runId = Guid.Parse("ffffffffffffffffffffffffffffffff");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Title",
            Rationale = "Rationale",
            Trace = new ExplainabilityTrace { RulesApplied = ["\u200B", "  trace-policy-7  "] },
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.DecisionRuleId.Should().Be("trace-policy-7");
        response.DecisionRuleName.Should().Be("trace-policy-7");
    }

    [Fact]
    public async Task GetInspectAsync_resolves_decision_rule_fields_like_sql_inspect_mapper()
    {
        Guid runId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Title",
            Rationale = "Rationale",
            Trace = new ExplainabilityTrace { RulesApplied = [" trace-fallback\u200B "] },
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
            AuthorityTrace = RuleAuditTraceDto.From(
                new RuleAuditTracePayload
                {
                    AppliedRuleIds = ["\u200B", "  policy-42  "],
                }),
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.DecisionRuleId.Should().Be("policy-42");
        response.DecisionRuleName.Should().Be("policy-42");
    }

    [Fact]
    public async Task GetInspectAsync_normalizes_manifest_version_like_sql_inspect_mapper()
    {
        Guid runId = Guid.Parse("dddddddddddddddddddddddddddddddd");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Title",
            Rationale = "Rationale",
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId, CurrentManifestVersion = "\u200B" },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.ManifestVersion.Should().BeNull();
    }

    [Fact]
    public async Task GetInspectAsync_falls_back_to_metadata_typed_payload_when_payload_is_not_json_serializable()
    {
        Guid runId = Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Inspect title",
            Rationale = "Inspect rationale",
            Payload = new IntPtr(42),
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.TypedPayload.Should().NotBeNull();
        response.TypedPayload!.Value.GetProperty("title").GetString().Should().Be("Inspect title");
        response.TypedPayload.Value.GetProperty("rationale").GetString().Should().Be("Inspect rationale");
    }

    [Fact]
    public async Task GetInspectAsync_falls_back_to_metadata_typed_payload_when_payload_has_circular_reference()
    {
        Guid runId = Guid.Parse("ffffffffffffffffffffffffffffffff");
        string findingId = $"finding-demo-{runId:N}-primary";
        ScopeContext scope = new();

        Dictionary<string, object?> cyclic = new();
        cyclic["self"] = cyclic;

        Finding finding = new()
        {
            FindingId = findingId,
            FindingType = "test",
            Category = "Security",
            EngineType = "test-engine",
            Severity = FindingSeverity.Info,
            Title = "Cycle title",
            Rationale = "Cycle rationale",
            Payload = cyclic,
        };

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            FindingsSnapshot = new FindingsSnapshot { Findings = [finding] },
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingInspectReadRepository repository = new(authority.Object);

        FindingInspectResponse? response = await repository.GetInspectAsync(scope, findingId, CancellationToken.None);

        response.Should().NotBeNull();
        response!.TypedPayload.Should().NotBeNull();
        response.TypedPayload!.Value.GetProperty("title").GetString().Should().Be("Cycle title");
    }
}
