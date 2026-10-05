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
    public void ComposeRetailBlendNote_azure_only_blend_mentions_azure_like_aws_and_gcp()
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
                new InfrastructureCostLine(
                    "topology",
                    "cache",
                    RuntimePlatform.Redis,
                    "Azure Cache for Redis",
                    40m,
                    InfrastructureCostPriceSource.Estimated),
            ],
            95m,
            AnyRetailPricing: true,
            AllRetailPricing: false);

        string note = InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals);

        note.Should().Contain("Azure");
        note.Should().NotBe(
            "Blend of Retail API matches and illustrative fallbacks (consumption SKU/region probes do not guarantee agreement with your bill).");
    }

    [Fact]
    public void ComposeIllustrativeOnlyNote_azure_only_mentions_azure_not_generic_only()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "api",
                    RuntimePlatform.AppService,
                    "Azure App Service",
                    55m,
                    InfrastructureCostPriceSource.Estimated),
            ],
            55m,
            AnyRetailPricing: false,
            AllRetailPricing: false);

        string note = InfrastructureCostSummaryNotes.ComposeIllustrativeOnlyNote(totals);

        note.Should().Contain("Azure");
        note.Should().NotBe("Illustrative infrastructure USD/month (Retail API probing disabled).");
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
    public void ComposeRetailBlendNote_aws_only_all_retail_does_not_claim_azure_retail()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "web",
                    RuntimePlatform.Ec2,
                    "Amazon EC2",
                    85m,
                    InfrastructureCostPriceSource.RetailApi),
            ],
            85m,
            AnyRetailPricing: true,
            AllRetailPricing: true);

        string note = InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals);

        note.Should().Contain("AWS");
        note.Should().NotContain("Azure Retail");
    }

    [Fact]
    public void ComposeRetailBlendNote_gcp_only_all_retail_does_not_claim_azure_retail()
    {
        InfrastructureCostEstimateTotals totals = new(
            [
                new InfrastructureCostLine(
                    "topology",
                    "app",
                    RuntimePlatform.Gke,
                    "Google Kubernetes Engine",
                    120m,
                    InfrastructureCostPriceSource.RetailApi),
            ],
            120m,
            AnyRetailPricing: true,
            AllRetailPricing: true);

        string note = InfrastructureCostSummaryNotes.ComposeRetailBlendNote(totals);

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
