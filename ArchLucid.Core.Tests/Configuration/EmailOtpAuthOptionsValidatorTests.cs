using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EmailOtpAuthOptionsValidatorTests
{
    [Fact]
    public void Validate_development_allows_empty_hash_pepper_when_enabled()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(isDevelopment: true, isProduction: false);

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions { Enabled = true, HashPepper = string.Empty });

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_production_like_requires_hash_pepper_when_enabled()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(isDevelopment: false, isProduction: true);

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions { Enabled = true, HashPepper = "short" });

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("HashPepper", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_production_like_succeeds_with_long_hash_pepper()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(isDevelopment: false, isProduction: true);

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions
            {
                Enabled = true,
                HashPepper = new string('x', 32)
            });

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_production_like_requires_bot_secret_when_challenge_enabled()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(isDevelopment: false, isProduction: true);

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions
            {
                Enabled = true,
                HashPepper = new string('x', 32),
                RequireBotChallenge = true,
                BotChallenge = new EmailOtpBotChallengeOptions
                {
                    Provider = EmailOtpBotChallengeProvider.Turnstile,
                    SecretKey = string.Empty
                }
            });

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("SecretKey", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_saas_environment_requires_hash_pepper_when_enabled()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(environmentName: "SaaS");

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions { Enabled = true, HashPepper = "short" });

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("HashPepper", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_archlucid_environment_production_requires_hash_pepper_when_enabled()
    {
        EmailOtpAuthOptionsValidator sut = CreateValidator(
            environmentName: Environments.Development,
            configuration: new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["ARCHLUCID_ENVIRONMENT"] = "Production" })
                .Build());

        ValidateOptionsResult result = sut.Validate(
            Options.DefaultName,
            new EmailOtpAuthOptions { Enabled = true, HashPepper = "short" });

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("HashPepper", StringComparison.Ordinal));
    }

    private static EmailOtpAuthOptionsValidator CreateValidator(bool isDevelopment, bool isProduction)
    {
        string environmentName = isProduction
            ? Environments.Production
            : isDevelopment
                ? Environments.Development
                : Environments.Staging;

        return CreateValidator(environmentName);
    }

    private static EmailOtpAuthOptionsValidator CreateValidator(
        string environmentName,
        IConfiguration? configuration = null)
    {
        TestHostEnvironment hostEnvironment = new()
        {
            EnvironmentName = environmentName
        };

        IConfiguration resolvedConfiguration = configuration ?? new ConfigurationBuilder().Build();

        return new EmailOtpAuthOptionsValidator(hostEnvironment, resolvedConfiguration);
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;

        public string ApplicationName { get; set; } = "ArchLucid.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
