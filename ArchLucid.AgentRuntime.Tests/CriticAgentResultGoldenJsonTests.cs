using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Golden Critic agent JSON strings exercised through <see cref="AgentResultParser" /> (web defaults + string enums),
///     JSON Schema (<c>schemas/agentresult.schema.json</c>), and <see cref="RealLlmOutputStructuralValidator" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CriticAgentResultGoldenJsonTests
{
    private const string RunId = "regression-critic-json-001";
    private const string TaskId = "t-critic-json";
    private const string ResultId = "res-critic-json";

    [SkippableFact]
    public void Critic_minimal_valid_wire_passes_strict_parser_schema_and_structural_validator()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);
        AgentResultParser sut = CreateStrictSchemaParser();

        AgentResult parsed = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        parsed.AgentType.Should().Be(AgentType.Critic);
        parsed.Claims.Should().ContainSingle();

        AssertStructuralValidationPassesAfterHydration(json);
    }

    [SkippableFact]
    public void Critic_json_with_unknown_top_level_properties_passes_strict_parser_and_structural_validator()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: true, usePascalRunId: false, numericAgentType: false);
        AgentResultParser sut = CreateStrictSchemaParser();

        AgentResult parsed = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        parsed.ResultId.Should().Be(ResultId);

        AssertStructuralValidationPassesAfterHydration(json);
    }

    [SkippableFact]
    public void Critic_json_unicode_and_whitespace_in_strings_round_trips_and_passes_validation()
    {
        // Exercise non-ASCII in claim and finding message; severity uses PascalCase enum string (FindingSeverity).
        const string inner = $$"""
                               {
                                 "resultId": "{{ResultId}}",
                                 "taskId": "{{TaskId}}",
                                 "runId": "{{RunId}}",
                                 "agentType": "Critic",
                                 "claims": [ "peer-review\u200F 日本語 🔍" ],
                                 "evidenceRefs": [ "e1" ],
                                 "confidence": 0.91,
                                 "createdUtc": "2026-05-08T12:34:56Z",
                                 
                                 "findings": [
                                   {
                                     "findingId": "f-u",
                                     "severity": "Info",
                                     "message": "Mixed scripts: \u03B1\u00DF \u042F.",
                                     "trace": {
                                       "sourceAgentExecutionTraceId": null,
                                       "graphNodeIdsExamined": [],
                                       "rulesApplied": [],
                                       "decisionsTaken": [],
                                       "alternativePathsConsidered": [],
                                       "notes": []
                                     }
                                   }
                                 ]
                               }
                               """;

        string json = inner.ReplaceLineEndings("\n").Trim();
        AgentResultParser sut = CreateStrictSchemaParser();

        AgentResult parsed = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        parsed.Claims[0].Should().Contain("日本語");

        AssertStructuralValidationPassesAfterHydration(json);
    }

    [SkippableFact]
    public void Critic_json_outer_ascii_whitespace_passes_strict_parser()
    {
        string core = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);
        string json = $"  \n\t{core}\n  ";

        AgentResultParser sut = CreateStrictSchemaParser();

        AgentResult parsed = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        parsed.ResultId.Should().Be(ResultId);
    }

    [SkippableFact]
    public void Critic_json_with_utf8_bom_is_rejected_by_JsonSerializer_like_production_path()
    {
        string core = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);
        string json = "\uFEFF" + core;

        AgentResultParser sut = CreateStrictSchemaParser();

        Action act = () => sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        act.Should().Throw<InvalidOperationException>().WithMessage("*deserialize*");
    }

    [SkippableFact]
    public void Critic_json_pascal_runId_passes_deserialization_when_schema_not_enforced_and_fails_when_enforced()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: true, numericAgentType: false);

        AgentResult lax = new AgentResultParser().ParseAndValidate(json, RunId, TaskId, AgentType.Critic);
        lax.RunId.Should().Be(RunId);

        AgentResultParser strict = CreateStrictSchemaParser();

        Action act = () => strict.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        act.Should().Throw<AgentResultSchemaViolationException>().Which.SchemaErrors.Should().NotBeEmpty();
    }

    [SkippableFact]
    public void Critic_json_numeric_agentType_deserializes_when_schema_not_enforced_and_fails_schema_when_enforced()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: true);

        AgentResult lax = new AgentResultParser().ParseAndValidate(json, RunId, TaskId, AgentType.Critic);
        lax.AgentType.Should().Be(AgentType.Critic);

        AgentResultParser strict = CreateStrictSchemaParser();

        Action act = () => strict.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        act.Should().Throw<AgentResultSchemaViolationException>().Which.SchemaErrors.Should().NotBeEmpty();

        AssertStructuralValidationPassesAfterHydration(MinimalCriticWireJson(false, false, false));
    }

    [SkippableFact]
    public void Critic_severity_invalid_enum_string_fails_deserialization()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);
        json = json.Replace("\"severity\": \"Warning\"", "\"severity\": \"medium\"", StringComparison.Ordinal);

        AgentResultParser sut = CreateStrictSchemaParser();

        Action act = () => sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        act.Should().Throw<InvalidOperationException>().WithMessage("*deserialize*");
    }

    [SkippableFact]
    public void Critic_invalid_proposedChanges_enforced_throws_schema_violation()
    {
        const string json =
            $$"""
            {
              "resultId": "{{ResultId}}",
              "taskId": "{{TaskId}}",
              "runId": "{{RunId}}",
              "agentType": "Critic",
              "claims": [],
              "evidenceRefs": [],
              "confidence": 0.5,
              "createdUtc": "2026-05-08T00:00:00Z",
              "findings": [],
              "proposedChanges": {
                "proposalId": "only-id",
                "sourceAgent": "Critic"
              }
            }
            """;

        AgentResultParser sut = CreateStrictSchemaParser();

        Action act = () => sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        act.Should().Throw<AgentResultSchemaViolationException>().Which.SchemaErrors.Should().NotBeEmpty();
    }

    [SkippableFact]
    public void Critic_round_trip_parser_options_match_production_AgentResultParser_shape()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);

        AgentResult? viaOptions = JsonSerializer.Deserialize<AgentResult>(json, AgentResultJsonRegressionHelpers.ParserMatchingOptions);
        viaOptions.Should().NotBeNull();

        AgentResultParser sut = CreateStrictSchemaParser();
        AgentResult viaParser = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        viaParser.ResultId.Should().Be(viaOptions.ResultId);
        viaParser.AgentType.Should().Be(viaOptions.AgentType);
        viaParser.Confidence.Should().Be(viaOptions.Confidence);
    }

    [SkippableFact]
    public void Critic_finding_severity_accepts_lowercase_string_under_JsonStringEnumConverter()
    {
        string json = MinimalCriticWireJson(includeUnknownProperties: false, usePascalRunId: false, numericAgentType: false);
        json = json.Replace("\"severity\": \"Warning\"", "\"severity\": \"warning\"", StringComparison.Ordinal);

        AgentResultParser sut = CreateStrictSchemaParser();

        AgentResult parsed = sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        parsed.Findings[0].Severity.Should().Be(FindingSeverity.Warning);

        AssertStructuralValidationPassesAfterHydration(json);
    }

    [SkippableFact]
    public void Critic_parsed_then_structural_validator_rejects_hollow_finding_without_weakening_schema()
    {
        string json =
            $$"""
            {
              "resultId": "{{ResultId}}",
              "taskId": "{{TaskId}}",
              "runId": "{{RunId}}",
              "agentType": "Critic",
              "claims": ["c"],
              "evidenceRefs": ["e"],
              "confidence": 0.5,
              "createdUtc": "2026-05-08T00:00:00Z",
              "findings": [
                {
                  "findingId": "hollow",
                  "severity": "Info",
                  "description": "   ",
                  "message": "",
                  "title": "\t",
                  "detail": null,
                  "trace": {
                    "sourceAgentExecutionTraceId": null,
                    "graphNodeIdsExamined": [],
                    "rulesApplied": [],
                    "decisionsTaken": [],
                    "alternativePathsConsidered": [],
                    "notes": []
                  }
                }
              ]
            }
            """;

        AgentResultParser sut = CreateStrictSchemaParser();
        sut.ParseAndValidate(json, RunId, TaskId, AgentType.Critic);

        RealLlmStructuralValidationResult structural =
            RealLlmOutputStructuralValidator.ValidateAgentResultStructure(nameof(AgentType.Critic), json);

        structural.IsValid.Should().BeFalse();
        structural.Checks.Should().Contain(c => c.Name == "findingContent" && c.Passed == false);
    }

    [SkippableFact]
    public void Critic_structural_validator_rejects_non_string_severity()
    {
        string json =
            """
            {
              "resultId": "r",
              "taskId": "t",
              "runId": "run",
              "agentType": "Critic",
              "claims": [""],
              "evidenceRefs": [""],
              "confidence": 0.5,
              "createdUtc": "2026-05-08T00:00:00Z",
              "findings": [
                {
                  "findingId": "f1",
                  "severity": 1,
                  "message": "ok",
                  "trace": {
                    "sourceAgentExecutionTraceId": null,
                    "graphNodeIdsExamined": [],
                    "rulesApplied": [],
                    "decisionsTaken": [],
                    "alternativePathsConsidered": [],
                    "notes": []
                  }
                }
              ]
            }
            """;

        RealLlmStructuralValidationResult structural =
            RealLlmOutputStructuralValidator.ValidateAgentResultStructure(nameof(AgentType.Critic), json);

        structural.IsValid.Should().BeFalse();
        structural.Checks.Should().Contain(c => c.Name == "findingSeverity" && c.Passed == false);
    }

    private static string MinimalCriticWireJson(
        bool includeUnknownProperties,
        bool usePascalRunId,
        bool numericAgentType)
    {
        string runKey = usePascalRunId ? "RunId" : "runId";
        string agentTypeJson = numericAgentType ? "4" : "\"Critic\"";
        string unknown = includeUnknownProperties
            ? """
              ,"_modelVendor": "golden-test"
              ,"nestedNoise": { "x": [1, 2] }
              """
            : "";

        return
            $$"""
            {
              "resultId": "{{ResultId}}",
              "taskId": "{{TaskId}}",
              "{{runKey}}": "{{RunId}}",
              "agentType": {{agentTypeJson}},
              "claims": ["Cross-check topology assumptions."],
              "evidenceRefs": ["evidence:critic:golden"],
              "confidence": 0.88,
              "createdUtc": "2026-05-08T00:00:00Z",
              "findings": [
                {
                  "findingId": "f-c-1",
                  "sourceAgent": "Critic",
                  "severity": "Warning",
                  "title": "Golden critic surface finding.",
                  "trace": {
                    "sourceAgentExecutionTraceId": null,
                    "graphNodeIdsExamined": [],
                    "rulesApplied": [],
                    "decisionsTaken": [],
                    "alternativePathsConsidered": [],
                    "notes": []
                  }
                }
              ]{{unknown}}
            }
            """;
    }

    private static void AssertStructuralValidationPassesAfterHydration(string criticResultJson)
    {
        string forValidator =
            AgentResultJsonRegressionHelpers.WithExplainabilityTracesHydratedForContract(criticResultJson);
        RealLlmStructuralValidationResult structural =
            RealLlmOutputStructuralValidator.ValidateAgentResultStructure(nameof(AgentType.Critic), forValidator);

        structural.IsValid.Should()
            .BeTrue(
                "golden Critic wire JSON should satisfy structural validator after trace hydration. Checks: {0}",
                string.Join("; ", structural.Checks.Select(static c => $"{c.Name}={(c.Passed ? "ok" : c.Message)}")));
    }

    private static AgentResultParser CreateStrictSchemaParser()
    {
        Mock<ILogger<SchemaValidationService>> log = new();
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = "schemas/agentresult.schema.json",
            GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "schemas/explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "schemas/comparison-explanation.schema.json",
        };

        SchemaValidationService schema = new(log.Object, Options.Create(options));

        return new AgentResultParser(
            schema,
            Options.Create(new AgentResultSchemaValidationOptions { EnforceOnParse = true }),
            Mock.Of<ILogger<AgentResultParser>>());
    }
}
