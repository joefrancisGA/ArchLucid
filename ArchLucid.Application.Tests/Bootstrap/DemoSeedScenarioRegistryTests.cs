using ArchLucid.Application.Bootstrap;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Bootstrap;

public sealed class DemoSeedScenarioRegistryTests
{
    [Fact]
    public void ListSeedSteps_returns_load_bearing_order_with_ui_sample_slugs()
    {
        IReadOnlyList<DemoSeedScenarioDefinition> steps = DemoSeedScenarioRegistry.ListSeedSteps();

        steps.Should().NotBeEmpty();
        steps.Select(s => s.StepName).Should().ContainInOrder(
            "retail-request",
            "retail-run-baseline",
            "retail-run-hardened",
            "retail-governance",
            "retail-export-record",
            "northwind-product-tour",
            "meridian-alpine-regulated",
            "created-package-sample");

        steps.Single(s => s.StepName == "meridian-alpine-regulated").UiSampleSlug.Should().Be("claims-intake");
        steps.Single(s => s.StepName == "created-package-sample").UiSampleSlug.Should().Be("ai-knowledge-assistant");
    }

    [Fact]
    public void ResolveByUiSampleSlug_finds_customer_intake_retail_steps()
    {
        DemoSeedScenarioDefinition? first = DemoSeedScenarioRegistry.ResolveByUiSampleSlug("customer-intake");

        first.Should().NotBeNull();
        first!.Value.StepName.Should().Be("retail-request");
        DemoSeedScenarioRegistry.ListByScenarioSlug(DemoSeedScenarioRegistry.RetailCheckoutSlug).Should().HaveCount(5);
    }
}
