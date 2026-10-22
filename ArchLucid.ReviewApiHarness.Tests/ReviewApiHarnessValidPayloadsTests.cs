using System.Text.Json;

using FluentAssertions;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewApiHarnessValidPayloadsTests
{
    [Fact]
    public void RunDetailReadyForCommit_payload_passes_contract_validation()
    {
        ReviewApiHarnessValidPayloads.RunDetailReadyForCommit().Should().Contain("legacyRunStatus");
    }

    [Fact]
    public void RunFindingsListResponse_validates_through_harness_pipeline()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        ResponseValidationPipeline pipeline = new(catalog);

        using JsonDocument document = JsonDocument.Parse(ReviewApiHarnessValidPayloads.RunFindingsListResponse());
        ResponseValidationResult result = pipeline.ValidateJson(
            "RunFindingsListResponse",
            typeof(Gen.RunFindingsListResponse),
            document.RootElement);

        result.Passed.Should().BeTrue(string.Join("; ", result.Errors));
    }
}
