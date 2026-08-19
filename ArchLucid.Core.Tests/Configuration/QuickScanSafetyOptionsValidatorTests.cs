using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QuickScanSafetyOptionsValidatorTests
{
    [Fact]
    public void Validate_production_safe_disabled_succeeds()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: true);
        QuickScanSafetyOptions options = CreateProductionSafeDisabledOptions();

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_production_safe_enabled_conservative_succeeds()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: true);
        QuickScanSafetyOptions options = CreateProductionSafeEnabledOptions();

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_production_anonymous_without_global_spend_fails()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: true);
        QuickScanSafetyOptions options = CreateProductionSafeEnabledOptions();
        options.GlobalBudget.MaxAnonymousSpendPerHour = 0m;
        options.GlobalBudget.MaxAnonymousSpendPerDay = 0m;

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("MaxAnonymousSpendPerHour", StringComparison.Ordinal));
        result.Failures.Should().Contain(f => f.Contains("MaxAnonymousSpendPerDay", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_production_anonymous_without_approved_models_fails()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: true);
        QuickScanSafetyOptions options = CreateProductionSafeEnabledOptions();
        options.Models.AllowedModelIds = [];

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("AllowedModelIds", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_sample_fallback_requires_approved_fallback_models()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: false);
        QuickScanSafetyOptions options = CreateProductionSafeDisabledOptions();
        options.Models.ApprovedFallbackModelIds = [];

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("ApprovedFallbackModelIds", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_emergency_disabled_requires_message()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: false);
        QuickScanSafetyOptions options = CreateProductionSafeDisabledOptions();
        options.EmergencyDisabled = true;
        options.EmergencyDisabledMessage = "   ";

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("EmergencyDisabledMessage", StringComparison.Ordinal));
    }

    [Fact]
    public void ResolveEffectiveFeatureState_emergency_disabled_turns_off_execution()
    {
        QuickScanSafetyOptions options = CreateProductionSafeEnabledOptions();
        options.EmergencyDisabled = true;

        QuickScanSafetyEffectiveFeatureState effective = options.ResolveEffectiveFeatureState();

        effective.Enabled.Should().BeFalse();
        effective.AnonymousExecutionEnabled.Should().BeFalse();
        effective.SampleFallbackEnabled.Should().BeTrue();
    }

    [Fact]
    public void Validate_development_allows_anonymous_without_production_guardrails()
    {
        QuickScanSafetyOptionsValidator sut = CreateValidator(isProduction: false);
        QuickScanSafetyOptions options = CreateProductionSafeDisabledOptions();
        options.AnonymousExecutionEnabled = true;
        options.Models.AllowedModelIds = [];
        options.GlobalBudget.MaxAnonymousSpendPerHour = 0m;

        ValidateOptionsResult result = sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    private static QuickScanSafetyOptions CreateProductionSafeDisabledOptions()
    {
        return new QuickScanSafetyOptions
        {
            Enabled = false,
            AnonymousExecutionEnabled = false,
            SampleFallbackEnabled = true,
            Models = new QuickScanSafetyModelLimits
            {
                ApprovedFallbackModelIds = ["gpt-4o-mini-fallback"]
            }
        };
    }

    private static QuickScanSafetyOptions CreateProductionSafeEnabledOptions()
    {
        return new QuickScanSafetyOptions
        {
            Enabled = true,
            AnonymousExecutionEnabled = true,
            SampleFallbackEnabled = true,
            Models = new QuickScanSafetyModelLimits
            {
                AllowedModelIds = ["gpt-4o-mini"],
                DefaultModelId = "gpt-4o-mini",
                ApprovedFallbackModelIds = ["gpt-4o-mini-fallback"]
            }
        };
    }

    private static QuickScanSafetyOptionsValidator CreateValidator(bool isProduction)
    {
        IHostEnvironment hostEnvironment = new TestHostEnvironment(
            isProduction ? Environments.Production : Environments.Development);

        IConfiguration configuration = new ConfigurationBuilder().Build();

        return new QuickScanSafetyOptionsValidator(hostEnvironment, configuration);
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
