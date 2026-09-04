using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocxArchitectureAnalysisExportServiceTests
{
    [Fact]
    public async Task GenerateDocxAsync_agent_result_diff_includes_evidence_refs_and_warnings()
    {
        DocxArchitectureAnalysisExportService sut = new(new NullDiagramImageRenderer());
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Compliance,
                        LeftExists = true,
                        RightExists = true,
                        AddedEvidenceRefs = ["policy-pack:encrypt-at-rest"],
                        RemovedEvidenceRefs = ["policy-pack:legacy-baseline"],
                        AddedWarnings = ["new warning"],
                        RemovedWarnings = ["old warning"],
                    }
                ]
            }
        };

        byte[] docx = await sut.GenerateDocxAsync(report);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("policy-pack:encrypt-at-rest");
        text.Should().Contain("policy-pack:legacy-baseline");
        text.Should().Contain("new warning");
        text.Should().Contain("old warning");
    }

    private static string ExtractDocxBodyText(byte[] docxBytes)
    {
        using MemoryStream memoryStream = new(docxBytes);
        using WordprocessingDocument document = WordprocessingDocument.Open(memoryStream, false);

        return document.MainDocumentPart!.Document.Body!.InnerText;
    }
}
