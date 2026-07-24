using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class InfrastructureCostSummaryNotesTests
{
    [Fact]
    public void ComposeRetailBlendNote_aws_only_does_not_claim_azure_retail()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "web",
                    RuntimePlatform.Ec2,
                    "Amazon EC2",
                    85m,
                    InfrastructureCostPriceSource.Estimated),
            ],
            85m,
            AnyRetailPricing: false,
            AllRetailPricing: false);

        string note = InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals);

        note.Should().Contain("AWS");
        note.Should().NotContain("Azure Retail");
    }

    [Fact]
    public void ComposeIllustrativeOnlyNote_gcp_only_does_not_claim_azure_retail()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "app",
                    RuntimePlatform.Gke,
                    "Google Kubernetes Engine",
                    120m,
                    InfrastructureCostPriceSource.Estimated),
            ],
            120m,
            AnyRetailPricing: false,
            AllRetailPricing: false);

        string note = InfrastructureCostSummaryNotes.ComposeIllustrativeOnlyNote(totals);

        note.Should().Contain("GCP");
        note.Should().NotContain("Azure Retail");
    }

    [Fact]
    public void ComposeRetailBlendNote_azure_only_claims_azure_retail_when_all_retail()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "api",
                    RuntimePlatform.AppService,
                    "Azure App Service",
                    55m,
                    InfrastructureCostPriceSource.RetailApi),
            ],
            55m,
            AnyRetailPricing: true,
            AllRetailPricing: true);

        string note = InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals);

        note.Should().Contain("Azure Retail");
    }
}
