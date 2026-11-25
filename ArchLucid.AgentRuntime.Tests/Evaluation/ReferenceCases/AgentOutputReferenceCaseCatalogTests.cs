using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation.ReferenceCases;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputReferenceCaseCatalogTests
{
    [Fact]
    public void Cases_preserves_valid_entries_when_catalog_contains_null_and_blank_entries()
    {
        string fileName = Path.GetTempFileName();
        try
        {
            File.WriteAllText(fileName, """
                [{"caseId":"first","agentType":"Topology"},null,{"caseId":" "},{"caseId":"last","agentType":"Cost"}]
                """);
            Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> options = new();
            options.SetupGet(m => m.CurrentValue).Returns(new AgentExecutionReferenceEvaluationOptions
            {
                Enabled = true,
                ReferenceCasesPath = fileName,
            });
            AgentOutputReferenceCaseCatalog catalog = new(
                options.Object, Path.GetTempPath(), NullLogger<AgentOutputReferenceCaseCatalog>.Instance);

            catalog.Cases.Select(c => c.CaseId).Should().Equal("first", "last");
        }
        finally
        {
            File.Delete(fileName);
        }
    }

    [Fact]
    public void Cases_reload_when_reference_evaluation_is_enabled_after_an_initial_disabled_read()
    {
        string directory = Path.Combine(Path.GetTempPath(), $"archlucid-reference-cases-{Guid.NewGuid():N}");
        Directory.CreateDirectory(directory);

        try
        {
            string fileName = Path.Combine(directory, "reference-cases.json");
            File.WriteAllText(
                fileName,
                """
                [{"caseId":"topology-basic","agentType":"Topology","requiredJsonKeys":["findings"]}]
                """);

            AgentExecutionReferenceEvaluationOptions options = new()
            {
                Enabled = false,
                ReferenceCasesPath = fileName
            };
            Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> optionsMonitor = new();
            optionsMonitor.SetupGet(monitor => monitor.CurrentValue).Returns(() => options);

            AgentOutputReferenceCaseCatalog catalog = new(
                optionsMonitor.Object,
                directory,
                NullLogger<AgentOutputReferenceCaseCatalog>.Instance);

            catalog.Cases.Should().BeEmpty();

            options.Enabled = true;

            catalog.Cases.Should().ContainSingle()
                .Which.CaseId.Should().Be("topology-basic");
        }
        finally
        {
            Directory.Delete(directory, recursive: true);
        }
    }
}
