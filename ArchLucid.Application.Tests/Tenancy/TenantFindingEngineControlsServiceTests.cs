using ArchLucid.Application.Configuration;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

public sealed class TenantFindingEngineControlsServiceTests
{
  [Fact]
  public async Task GetAsync_returns_host_defaults_when_no_override()
  {
    Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    InMemoryTenantSettingsRepository settings = new();
    TenantFindingEngineControlsService service = CreateService(
      settings,
      tenantId,
      new InsightDensityGateOptions { EnableLlmJudge = false, EnableLlmJudgeForEngineFindings = false },
      new PortfolioRecurrenceFindingOptions { Enabled = false });

    TenantFindingEngineControlsSnapshot snapshot = await service.GetAsync(CancellationToken.None);

    snapshot.EffectiveEnableLlmJudge.Should().BeFalse();
    snapshot.EffectiveEnableLlmJudgeForEngineFindings.Should().BeFalse();
    snapshot.EffectivePortfolioRecurrenceEnabled.Should().BeFalse();
    snapshot.EnableLlmJudgeOverridden.Should().BeFalse();
    snapshot.EnableLlmJudgeForEngineFindingsOverridden.Should().BeFalse();
    snapshot.PortfolioRecurrenceEnabledOverridden.Should().BeFalse();
  }

  [Fact]
  public async Task SetAsync_persists_tenant_overrides()
  {
    Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    InMemoryTenantSettingsRepository settings = new();
    TenantFindingEngineControlsService service = CreateService(
      settings,
      tenantId,
      new InsightDensityGateOptions(),
      new PortfolioRecurrenceFindingOptions());

    TenantFindingEngineControlsSnapshot snapshot = await service
      .SetAsync(true, true, true, CancellationToken.None);

    snapshot.EffectiveEnableLlmJudge.Should().BeTrue();
    snapshot.EffectiveEnableLlmJudgeForEngineFindings.Should().BeTrue();
    snapshot.EffectivePortfolioRecurrenceEnabled.Should().BeTrue();
    snapshot.EnableLlmJudgeOverridden.Should().BeTrue();
    snapshot.EnableLlmJudgeForEngineFindingsOverridden.Should().BeTrue();
    snapshot.PortfolioRecurrenceEnabledOverridden.Should().BeTrue();

    string? llmJudge = await settings.TryGetAsync(
      tenantId,
      TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled,
      CancellationToken.None);

    llmJudge.Should().Be("true");
  }

  [Fact]
  public async Task ClearOverridesAsync_removes_stored_values()
  {
    Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    InMemoryTenantSettingsRepository settings = new();
    TenantFindingEngineControlsService service = CreateService(
      settings,
      tenantId,
      new InsightDensityGateOptions { EnableLlmJudge = true },
      new PortfolioRecurrenceFindingOptions { Enabled = true });

    await service.SetAsync(false, false, false, CancellationToken.None);
    TenantFindingEngineControlsSnapshot snapshot = await service.ClearOverridesAsync(CancellationToken.None);

    snapshot.EffectiveEnableLlmJudge.Should().BeTrue();
    snapshot.EnableLlmJudgeOverridden.Should().BeFalse();
  }

  [Fact]
  public async Task InsightDensityGateOptionsResolver_merges_tenant_llm_judge_flags()
  {
    Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    InMemoryTenantSettingsRepository settings = new();
    await settings.UpsertAsync(
      tenantId,
      TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled,
      "true",
      CancellationToken.None);

    Mock<IScopeContextProvider> scope = new();
    scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

    InsightDensityGateOptionsResolver resolver = new(
      Options.Create(new InsightDensityGateOptions { EnableLlmJudge = false }),
      scope.Object,
      settings);

    InsightDensityGateOptions effective = resolver.Resolve();

    effective.EnableLlmJudge.Should().BeTrue();
    effective.DemotionThreshold.Should().Be(50);
  }

  [Fact]
  public async Task PortfolioRecurrenceFindingOptionsResolver_merges_tenant_enabled_flag()
  {
    Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    InMemoryTenantSettingsRepository settings = new();
    await settings.UpsertAsync(
      tenantId,
      TenantSettingKeys.FindingsPortfolioRecurrenceEnabled,
      "true",
      CancellationToken.None);

    Mock<IScopeContextProvider> scope = new();
    scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

    PortfolioRecurrenceFindingOptionsResolver resolver = new(
      Options.Create(new PortfolioRecurrenceFindingOptions { Enabled = false }),
      scope.Object,
      settings);

    PortfolioRecurrenceFindingOptions effective = resolver.Resolve();

    effective.Enabled.Should().BeTrue();
    effective.MaxFindings.Should().Be(10);
  }

  private static TenantFindingEngineControlsService CreateService(
    ITenantSettingsRepository settings,
    Guid tenantId,
    InsightDensityGateOptions insightDensityHost,
    PortfolioRecurrenceFindingOptions portfolioHost)
  {
    Mock<IScopeContextProvider> scope = new();
    scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

    return new TenantFindingEngineControlsService(
      Options.Create(insightDensityHost),
      Options.Create(portfolioHost),
      scope.Object,
      settings);
  }
}
