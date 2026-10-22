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
