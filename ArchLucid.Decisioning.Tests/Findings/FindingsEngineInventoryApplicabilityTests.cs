using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsEngineInventoryApplicabilityTests
{
    [Fact]
    public async Task Design_only_without_pins_records_both_held_checks_and_no_engine_success()
    {
        HeldCheckLedger ledger = new();
        FindingAnalysisContext analysis = new() { HeldCheckLedger = ledger };
        Mock<IEffectfulFindingEngine> azure = Engine("azure-inventory-security-baseline", invoke: false);
        Mock<IEffectfulFindingEngine> aws = Engine("aws-inventory-security-baseline", invoke: false);

        FindingsStageContext context = CreateContext(analysis);
        await CreateStage(azure, aws).ExecuteAsync(context, CancellationToken.None);

        context.SuccessfulEngineInvocations.Should().Be(0);
        context.SuccessfulEngineTypes.Should().BeEmpty();
        context.EngineFailures.Should().BeEmpty();
        ledger.BuildRollup().Select(entry => entry.InputCode).Should()
            .BeEquivalentTo([HeldCheckInputCode.AzureInventoryZip, HeldCheckInputCode.AwsInventoryZip]);
        azure.Verify(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), It.IsAny<FindingAnalysisContext?>(),
            It.IsAny<CancellationToken>()), Times.Never);
        aws.Verify(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), It.IsAny<FindingAnalysisContext?>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Aws_pin_without_date_is_invoked_while_missing_azure_is_held()
    {
        HeldCheckLedger ledger = new();
        FindingAnalysisContext analysis = new()
        {
            HeldCheckLedger = ledger,
            HasCreateTimeEvidencePinCommitment = true,
            EvidencePins = [new EvidencePackagePin
            {
                Provider = "aws-extractor", PackageId = Guid.NewGuid(), CollectionUtc = null,
            }],
        };
        Mock<IEffectfulFindingEngine> azure = Engine("azure-inventory-security-baseline", invoke: false);
        Mock<IEffectfulFindingEngine> aws = Engine("aws-inventory-security-baseline", invoke: true);

        FindingsStageContext context = CreateContext(analysis);
        await CreateStage(azure, aws).ExecuteAsync(context, CancellationToken.None);

        context.SuccessfulEngineTypes.Should().ContainSingle().Which.Should().Be("aws-inventory-security-baseline");
        ledger.BuildRollup().Should().ContainSingle().Which.InputCode.Should().Be(HeldCheckInputCode.AzureInventoryZip);
        aws.Verify(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), analysis,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Required_inventory_without_pin_invokes_and_fails_closed()
    {
        FindingAnalysisContext analysis = new()
        {
            RequiredEngineTypes = ["azure-inventory-security-baseline"],
        };
        Mock<IEffectfulFindingEngine> azure = Engine("azure-inventory-security-baseline",
            invoke: true, fail: true);
        FindingsStageContext context = CreateContext(analysis);

        await Assert.ThrowsAsync<AggregateException>(() =>
            CreateStage(azure).ExecuteAsync(context, CancellationToken.None));

        context.EngineFailures.Should().ContainSingle();
        azure.Verify(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), analysis,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Broken_create_time_commitment_without_pin_still_fails_closed()
    {
        FindingAnalysisContext analysis = new() { HasCreateTimeEvidencePinCommitment = true };
        Mock<IEffectfulFindingEngine> aws = Engine("aws-inventory-security-baseline",
            invoke: true, fail: true);
        FindingsStageContext context = CreateContext(analysis);

        await Assert.ThrowsAsync<AggregateException>(() =>
            CreateStage(aws).ExecuteAsync(context, CancellationToken.None));
        context.EngineFailures.Should().ContainSingle();
    }

    private static FindingsEngineInvokeStage CreateStage(params Mock<IEffectfulFindingEngine>[] engines) =>
        new([], new Mock<IFindingPayloadValidator>(MockBehavior.Strict).Object,
            NullLogger<FindingsEngineInvokeStage>.Instance,
            effectfulEngines: engines.Select(engine => engine.Object));

    private static FindingsStageContext CreateContext(FindingAnalysisContext analysis) => new()
    {
        RunId = Guid.NewGuid(),
        ContextSnapshotId = Guid.NewGuid(),
        GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        AnalysisContext = analysis,
    };

    private static Mock<IEffectfulFindingEngine> Engine(string type, bool invoke, bool fail = false)
    {
        Mock<IEffectfulFindingEngine> engine = new(MockBehavior.Strict);
        engine.SetupGet(x => x.EngineType).Returns(type);
        engine.SetupGet(x => x.Category).Returns("Security");

        if (invoke)
        {
            if (fail)
                engine.Setup(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(),
                        It.IsAny<FindingAnalysisContext?>(), It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("Missing pinned evidence"));
            else
                engine.Setup(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(),
                        It.IsAny<FindingAnalysisContext?>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(Array.Empty<Finding>());
        }

        return engine;
    }
}
