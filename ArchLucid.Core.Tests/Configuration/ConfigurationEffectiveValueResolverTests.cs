using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class ConfigurationEffectiveValueResolverTests
{
    [Fact]
    public void Resolve_returns_null_when_unset()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "Missing:Key", isSet: false);

        v.Should().BeNull();
    }

    [Fact]
    public void Resolve_redacts_connection_strings()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ConnectionStrings:ArchLucid"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ConnectionStrings:ArchLucid",
            isSet: true);

        v.Should().Be("***");
    }

    [Fact]
    public void Resolve_returns_scalar_when_not_sensitive()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = "Sql"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:StorageProvider", isSet: true);

        v.Should().Be("Sql");
    }

    [Fact]
    public void Resolve_redacts_private_key_config_paths()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Trial:LocalIdentity:JwtPrivateKeyPemPath"] = "/secrets/jwt.pem"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Trial:LocalIdentity:JwtPrivateKeyPemPath",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:ClientSecret")]
    [InlineData("Azure:Storage:PrimaryKey")]
    [InlineData("Azure:Storage:AccountKey")]
    public void Resolve_redacts_explicit_credential_config_paths(string configPath)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:SigningCertificatePath", "/secrets/signing.pfx")]
    [InlineData("ArchLucid:Saml:SigningCertificate", "/secrets/signing.pfx")]
    public void Resolve_redacts_certificate_config_paths(string configPath, string secretValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = secretValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sync_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SyncAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SyncAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_system_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SystemAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SystemAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_supplier_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SupplierAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SupplierAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_subscription_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SubscriptionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SubscriptionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_suite_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SuiteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SuiteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_supply_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SupplyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SupplyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_survey_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SurveyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SurveyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_switch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SwitchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SwitchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_symbol_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SymbolAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SymbolAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tab_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TabAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TabAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tag_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TagAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TagAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tail_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TailAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TailAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tap_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_target_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TargetAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TargetAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_task_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TaskAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TaskAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tax_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TaxAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TaxAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_team_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TeamAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TeamAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tech_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TechAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TechAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tenant_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TenantAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TenantAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_test_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_text_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TextAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TextAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_theme_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ThemeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ThemeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_third_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ThirdAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ThirdAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tier_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TierAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TierAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tile_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_time_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TimeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TimeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tip_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TipAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TipAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_title_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TitleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TitleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_top_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TopAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TopAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_total_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TotalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TotalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_touch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TouchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TouchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trace_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TraceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TraceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_track_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trade_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TradeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TradeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_train_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_transfer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TransferAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TransferAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_transit_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TransitAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TransitAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_travel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TravelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TravelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_treat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TreatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TreatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trend_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrendAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrendAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trial_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tribe_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TribeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TribeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trick_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrickAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrickAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_triple_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TripleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TripleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trust_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrustAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrustAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_truth_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TruthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TruthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trophy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrophyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrophyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trunk_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrunkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrunkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_trusty_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TrustyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TrustyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tune_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TuneAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TuneAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_turbo_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TurboAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TurboAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_turn_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TurnAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TurnAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_twin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TwinAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TwinAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_twist_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TwistAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TwistAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_tweak_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TweakAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TweakAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_two_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TwoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TwoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_type_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TypeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TypeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ultra_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UltraAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UltraAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_uncle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UncleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UncleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_under_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UnderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UnderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_union_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UnionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UnionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_unique_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UniqueAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UniqueAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_unity_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UnityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UnityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_upper_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UpperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UpperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_urban_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UrbanAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UrbanAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_usable_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UsableAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UsableAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_useful_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UsefulAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UsefulAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_user_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UserAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UserAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_utmost_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UtmostAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UtmostAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_utility_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:UtilityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:UtilityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_valid_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ValidAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ValidAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_value_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ValueAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ValueAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_vault_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VaultAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VaultAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_vendor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VendorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VendorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_verified_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VerifiedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VerifiedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_version_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VersionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VersionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_virtual_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VirtualAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VirtualAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_visible_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VisibleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VisibleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_vital_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VitalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VitalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_vocal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VocalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VocalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_voice_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VoiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VoiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_volume_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VolumeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VolumeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_voucher_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VoucherAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VoucherAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_voyage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VoyageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VoyageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_voter_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:VoterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:VoterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wait_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WaitAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WaitAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_walk_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WalkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WalkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wall_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wand_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WandAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WandAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_want_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WantAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WantAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_warm_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WarmAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WarmAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_warning_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WarningAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WarningAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wash_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WashAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WashAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_watch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wave_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WaveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WaveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_way_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_weak_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WeakAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WeakAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wear_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WearAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WearAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_weather_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WeatherAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WeatherAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_week_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WeekAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WeekAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_weight_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WeightAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WeightAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_welcome_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WelcomeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WelcomeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_well_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WellAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WellAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_west_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wheat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WheatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WheatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wheel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WheelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WheelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_width_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WidthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WidthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wild_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WildAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WildAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wind_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WindAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WindAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wine_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wing_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WingAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WingAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wire_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WireAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WireAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wipe_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WipeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WipeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wish_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WishAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WishAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_with_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WithAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WithAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wood_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WoodAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WoodAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_word_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WordAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WordAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_work_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WorkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WorkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_world_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WorldAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WorldAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_worm_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WormAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WormAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wrap_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WrapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WrapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wrist_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WristAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WristAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_write_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WriteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WriteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wrong_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WrongAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WrongAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wren_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WrenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WrenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wrest_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WrestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WrestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_wretch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WretchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WretchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_xray_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:XrayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:XrayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_xeno_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:XenoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:XenoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_xml_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:XmlAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:XmlAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_yaml_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:YamlAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:YamlAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_yacht_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:YachtAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:YachtAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_yield_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:YieldAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:YieldAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_zone_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ZoneAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ZoneAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_zest_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ZestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ZestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_zero_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ZeroAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ZeroAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_alpha_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AlphaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AlphaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_amber_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AmberAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AmberAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_angel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AngelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AngelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_apex_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ApexAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ApexAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_apple_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AppleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AppleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_arab_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArabAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArabAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_arch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_arena_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArenaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArenaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_argue_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArgueAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArgueAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_armor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArmorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArmorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_array_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArrayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArrayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_arrow_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArrowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArrowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_artist_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArtistAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArtistAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_atlas_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AtlasAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AtlasAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_audio_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AudioAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AudioAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bacon_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BaconAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BaconAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_badge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BadgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BadgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_baker_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BakerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BakerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_balance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BalanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BalanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ball_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_band_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BandAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BandAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bank_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BankAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BankAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bar_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BarAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BarAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_base_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bay_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beam_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BeamAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BeamAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bear_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BearAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BearAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BeatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BeatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beef_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BeefAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BeefAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BeerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BeerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bell_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BellAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BellAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bench_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BenchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BenchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_berry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BerryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BerryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_belt_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BeltAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BeltAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bend_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BendAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BendAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beta_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BetaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BetaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_beth_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BethAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BethAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_best_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bid_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BidAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BidAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_big_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BigAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BigAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bike_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BikeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BikeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bind_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BindAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BindAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bird_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BirdAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BirdAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bit_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BitAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BitAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bite_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BiteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BiteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blank_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlankAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlankAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blend_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlendAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlendAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blink_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlinkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlinkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bloom_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BloomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BloomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blow_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_boat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_body_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BodyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BodyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bold_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoldAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoldAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bone_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoneAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoneAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_book_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BookAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BookAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_boom_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_boot_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BootAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BootAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_border_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BorderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BorderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_boss_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BossAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BossAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bot_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BotAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BotAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bowl_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BowlAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BowlAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_box_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoxAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoxAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_boy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BoyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BoyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_branch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BranchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BranchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brand_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrandAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrandAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bread_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BreadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BreadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_break_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BreakAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BreakAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brick_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrickAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrickAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brief_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BriefAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BriefAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bright_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrightAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrightAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bring_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BringAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BringAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_broad_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BroadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BroadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_broadcast_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BroadcastAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BroadcastAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brow_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brown_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrownAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrownAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_browser_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrowserAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrowserAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_brush_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrushAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrushAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bucket_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BucketAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BucketAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bulk_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BulkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BulkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bump_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BumpAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BumpAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_burn_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BurnAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BurnAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_burst_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BurstAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BurstAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_business_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BusinessAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BusinessAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_button_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ButtonAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ButtonAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_buyer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BuyerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BuyerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_byte_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ByteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ByteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bypass_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BypassAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BypassAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bundle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BundleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BundleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_buzz_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BuzzAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BuzzAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cable_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CableAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CableAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_calendar_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CalendarAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CalendarAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_call_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_camera_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CameraAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CameraAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_campus_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CampusAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CampusAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cancel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CancelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CancelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_candidate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CandidateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CandidateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_canvas_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CanvasAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CanvasAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_capability_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CapabilityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CapabilityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_capital_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CapitalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CapitalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_captain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CaptainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CaptainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_capture_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CaptureAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CaptureAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_career_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CareerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CareerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cargo_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CargoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CargoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_carry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CarryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CarryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_carter_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CarterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CarterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cart_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CartAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CartAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_case_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cash_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CashAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CashAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cast_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CastAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CastAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_catalog_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CatalogAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CatalogAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cascade_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CascadeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CascadeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cassette_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CassetteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CassetteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_castle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CastleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CastleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_casual_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CasualAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CasualAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_catch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_category_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CategoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CategoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cater_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CaterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CaterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cave_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CaveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CaveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cause_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CauseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CauseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_caution_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CautionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CautionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_celebrate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CelebrateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CelebrateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cell_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CellAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CellAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_center_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CenterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CenterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_central_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CentralAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CentralAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_century_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CenturyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CenturyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ceramic_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CeramicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CeramicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_certain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CertainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CertainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chair_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChairAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChairAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_challenge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChallengeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChallengeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_change_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChangeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChangeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_character_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CharacterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CharacterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_charge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChargeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChargeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_charm_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CharmAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CharmAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chart_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChartAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChartAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chase_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_check_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CheckAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CheckAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cheer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CheerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CheerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cheese_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CheeseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CheeseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chemical_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChemicalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChemicalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chicken_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChickenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChickenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chief_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChiefAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChiefAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_child_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChildAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChildAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chip_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChipAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChipAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chocolate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChocolateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChocolateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_choice_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChoiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChoiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_choose_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChooseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChooseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_christian_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChristianAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChristianAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_christmas_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChristmasAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChristmasAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_chrome_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChromeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChromeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_church_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChurchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChurchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_circle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CircleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CircleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_circuit_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CircuitAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CircuitAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_citizen_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CitizenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CitizenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_city_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_civil_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CivilAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CivilAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_claim_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClaimAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClaimAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_class_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClassAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClassAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_classic_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClassicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClassicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_clean_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CleanAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CleanAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_clear_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClearAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClearAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_click_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClickAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClickAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_climate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClimateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClimateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_clock_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClockAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClockAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_close_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CloseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CloseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cloth_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClothAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClothAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_club_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClubAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClubAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_coach_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoachAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoachAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_coast_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoastAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoastAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_code_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CodeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CodeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_coffee_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoffeeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoffeeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_coin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoinAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoinAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cold_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ColdAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ColdAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_color_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ColorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ColorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_column_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ColumnAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ColumnAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_comic_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ComicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ComicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_common_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CommonAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CommonAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_company_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CompanyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CompanyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_compare_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CompareAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CompareAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_computer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ComputerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ComputerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_token_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TokenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TokenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_signing_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Auth:SigningKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ArchLucid:Auth:SigningKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SharedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SharedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_secondary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SecondaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SecondaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_primary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrimaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrimaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_account_shared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AccountSharedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AccountSharedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_storage_account_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StorageAccountKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StorageAccountKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blob_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlobAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlobAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_file_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_queue_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QueueAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QueueAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_table_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TableAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TableAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_disk_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DiskAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DiskAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_web_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WebAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WebAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_manage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ManageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ManageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dfs_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DfsAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DfsAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cosmos_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CosmosAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CosmosAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_api_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ApiAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ApiAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_data_lake_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DataLakeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DataLakeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_service_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ServiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ServiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_event_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EventAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EventAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_portal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PortalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PortalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_admin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AdminAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AdminAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sas_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SasAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SasAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_backup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BackupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BackupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_master_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MasterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MasterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_root_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RootAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RootAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_account_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AccountAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AccountAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_key_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KeyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KeyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_default_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DefaultAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DefaultAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_global_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GlobalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GlobalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shared_key_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SharedKeyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SharedKeyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_custom_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CustomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CustomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_local_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LocalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LocalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_remote_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RemoteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RemoteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_temp_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TempAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TempAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_temporary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TemporaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TemporaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_external_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExternalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExternalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_internal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InternalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InternalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_primary_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrimaryStorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrimaryStorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_secondary_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SecondaryStorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SecondaryStorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rotated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RotatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RotatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_legacy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LegacyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LegacyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_staged_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StagedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StagedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_connector_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConnectorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConnectorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_deprecated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeprecatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeprecatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fallback_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FallbackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FallbackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_integration_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IntegrationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IntegrationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_migration_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MigrationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MigrationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_partner_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PartnerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PartnerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_replica_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReplicaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReplicaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_archive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArchiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArchiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_disaster_recovery_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DisasterRecoveryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DisasterRecoveryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_replication_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReplicationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReplicationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_audit_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AuditAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AuditAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_automation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AutomationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AutomationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_batch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bootstrap_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BootstrapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BootstrapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_broker_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrokerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrokerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bridge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BridgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BridgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cache_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CacheAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CacheAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_channel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChannelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChannelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_client_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClientAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClientAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cluster_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClusterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClusterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cloud_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CloudAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CloudAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_compute_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ComputeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ComputeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_config_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConfigAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConfigAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_connection_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConnectionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConnectionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_container_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ContainerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ContainerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_control_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ControlAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ControlAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_core_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_content_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ContentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ContentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_copy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CopyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CopyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_corporate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CorporateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CorporateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_credential_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CredentialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CredentialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_customer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CustomerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CustomerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cross_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CrossAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CrossAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_crypto_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CryptoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CryptoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_data_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DataAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DataAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_database_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DatabaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DatabaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dedicated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DedicatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DedicatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_deployment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeploymentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeploymentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_developer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeveloperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeveloperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_device_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeviceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeviceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_direct_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DirectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DirectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_digital_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DigitalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DigitalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_directory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DirectoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DirectoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_distributed_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DistributedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DistributedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_document_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DocumentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DocumentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_domain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DomainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DomainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_drill_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DrillAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DrillAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_drive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DriveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DriveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dynamic_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DynamicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DynamicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_edge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EdgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EdgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_email_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmailAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmailAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_embedded_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmbeddedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmbeddedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_emergency_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmergencyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmergencyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_encryption_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EncryptionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EncryptionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_enterprise_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EnterpriseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EnterpriseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_entry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EntryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EntryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_environment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EnvironmentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EnvironmentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_exchange_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExchangeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExchangeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_execution_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExecutionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExecutionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_export_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_extension_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExtensionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExtensionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_federated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FederatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FederatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fetch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FetchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FetchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_filter_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FilterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FilterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_final_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FinalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FinalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_finance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FinanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FinanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_firewall_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FirewallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FirewallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_flag_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FlagAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FlagAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fleet_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FleetAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FleetAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_flow_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FlowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FlowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_folder_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FolderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FolderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_forward_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ForwardAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ForwardAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_foundation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FoundationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FoundationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_front_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FrontAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FrontAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_full_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FullAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FullAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_gateway_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GatewayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GatewayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_group_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GroupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GroupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_guest_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GuestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GuestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_handle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HandleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HandleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hash_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HashAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HashAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_health_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HealthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HealthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_host_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HostAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HostAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hub_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HubAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HubAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hybrid_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HybridAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HybridAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_identity_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IdentityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IdentityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_image_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ImageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ImageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_import_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ImportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ImportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_index_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IndexAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IndexAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_instance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InstanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InstanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_interactive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InteractiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InteractiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_inventory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InventoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InventoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_invoice_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InvoiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InvoiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_io_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_issuer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IssuerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IssuerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_item_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ItemAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ItemAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_job_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JobAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JobAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_join_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JoinAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JoinAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_journal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JournalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JournalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_json_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JsonAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JsonAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_jump_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JumpAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JumpAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_kernel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KernelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KernelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_kafka_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KafkaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KafkaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_keeper_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KeeperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KeeperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_label_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LabelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LabelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lambda_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LambdaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LambdaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_layer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LayerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LayerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lead_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LeadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LeadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lease_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LeaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LeaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_library_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LibraryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LibraryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_link_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LinkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LinkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_live_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_load_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lock_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LockAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LockAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_log_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LogAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LogAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_login_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_long_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LongAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LongAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lookup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LookupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LookupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_loop_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoopAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoopAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_low_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_machine_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MachineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MachineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_managed_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ManagedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ManagedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_map_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_member_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MemberAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MemberAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_memory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MemoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MemoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_merge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MergeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MergeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_message_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MessageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MessageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_metric_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MetricAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MetricAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mirror_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MirrorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MirrorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mobile_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MobileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MobileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_model_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ModelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ModelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_module_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ModuleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ModuleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_monitor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MonitorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MonitorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_month_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MonthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MonthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mounted_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MountedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MountedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_motion_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MotionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MotionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mount_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MountAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MountAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_move_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MoveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MoveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_multi_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MultiAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MultiAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_music_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MusicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MusicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_named_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NamedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NamedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_native_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NativeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NativeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_network_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NetworkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NetworkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_node_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NodeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NodeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_normal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NormalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NormalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_notebook_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NotebookAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NotebookAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_object_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ObjectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ObjectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_offline_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OfflineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OfflineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_online_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OnlineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OnlineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_open_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OpenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OpenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_operator_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OperatorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OperatorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ops_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OpsAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OpsAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_option_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OptionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OptionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_order_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OrderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OrderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_org_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OrgAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OrgAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_origin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OriginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OriginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_output_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OutputAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OutputAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_overlay_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OverlayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OverlayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_owner_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OwnerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OwnerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pack_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_page_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_parallel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ParallelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ParallelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_parent_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ParentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ParentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_partial_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PartialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PartialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pattern_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PatternAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PatternAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_patch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_path_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PathAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PathAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_payload_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PayloadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PayloadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_payment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PaymentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PaymentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_peer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PeerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PeerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pending_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PendingAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PendingAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_performance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PerformanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PerformanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_permission_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PermissionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PermissionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pipeline_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PipelineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PipelineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_platform_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PlatformAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PlatformAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_plugin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PluginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PluginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_point_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PointAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PointAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_policy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PolicyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PolicyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pool_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PoolAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PoolAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_port_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PortAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PortAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_post_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PostAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PostAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_power_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PowerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PowerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_premium_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PremiumAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PremiumAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_prepared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PreparedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PreparedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_preview_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PreviewAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PreviewAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_private_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrivateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrivateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_process_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProcessAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProcessAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_profile_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProfileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProfileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_program_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProgramAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProgramAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_project_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProjectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProjectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_provision_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProvisionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProvisionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_proxy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProxyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProxyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_public_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PublicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PublicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_publisher_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PublisherAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PublisherAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pulse_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PulseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PulseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_push_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PushAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PushAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_purge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PurgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PurgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_put_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PutAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PutAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_query_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QueryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QueryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_quota_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QuotaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QuotaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_random_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RandomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RandomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_range_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RangeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RangeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_read_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_record_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RecordAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RecordAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_recovery_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RecoveryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RecoveryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_redact_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RedactAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RedactAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_refer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReferAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReferAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_refresh_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RefreshAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RefreshAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_relay_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RelayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RelayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_release_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReleaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReleaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_registry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RegistryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RegistryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_remediation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RemediationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RemediationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_render_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RenderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RenderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_renewal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RenewalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RenewalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_report_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_request_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RequestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RequestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_resource_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResourceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResourceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_response_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResponseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResponseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_restore_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RestoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RestoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_result_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResultAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResultAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_retry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RetryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RetryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_return_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReturnAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReturnAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_reverse_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReverseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReverseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_reveal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RevealAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RevealAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_review_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReviewAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReviewAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_revoke_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RevokeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RevokeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_roll_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RollAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RollAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_room_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RoomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RoomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rotate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RotateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RotateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_route_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RouteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RouteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_router_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RouterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RouterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_routine_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RoutineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RoutineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rule_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_run_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RunAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RunAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_runtime_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuntimeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuntimeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rubric_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RubricAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RubricAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rural_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuralAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuralAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rust_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RustAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RustAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sale_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SaleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SaleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sample_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SampleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SampleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sandbox_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SandboxAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SandboxAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scale_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScaleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScaleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scan_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScanAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScanAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_schedule_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScheduleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScheduleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_schema_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SchemaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SchemaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scope_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScopeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScopeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_score_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scout_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScoutAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScoutAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scratch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScratchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScratchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_screen_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScreenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScreenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_script_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScriptAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScriptAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scroll_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScrollAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScrollAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_search_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SearchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SearchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_seat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SeatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SeatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_segment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SegmentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SegmentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_select_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SelectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SelectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_self_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SelfAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SelfAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_send_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SendAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SendAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sensor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SensorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SensorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_serial_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SerialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SerialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_server_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ServerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ServerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_session_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SessionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SessionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_setup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SetupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SetupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_share_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShareAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShareAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shelf_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShelfAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShelfAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shield_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShieldAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShieldAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shift_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShiftAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShiftAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ship_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShipAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShipAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shop_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShopAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShopAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_short_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShortAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShortAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_show_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shot_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ShotAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ShotAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_side_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SideAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SideAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_signal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SignalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SignalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_single_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SingleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SingleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sink_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SinkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SinkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_site_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SiteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SiteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_size_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SizeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SizeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_skin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SkinAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SkinAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_skip_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SkipAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SkipAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_slide_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SlideAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SlideAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_slot_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SlotAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SlotAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_small_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SmallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SmallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_smart_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SmartAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SmartAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_smoke_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SmokeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SmokeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_snap_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SnapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SnapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_soft_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SoftAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SoftAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_solid_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SolidAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SolidAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_socket_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SocketAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SocketAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_source_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SourceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SourceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sound_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SoundAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SoundAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_space_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SpaceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SpaceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_speed_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SpeedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SpeedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_spell_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SpellAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SpellAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_split_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SplitAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SplitAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_spot_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SpotAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SpotAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stack_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stand_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StandAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StandAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_star_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StarAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StarAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_start_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StartAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StartAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_state_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_static_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StaticAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StaticAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_steam_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SteamAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SteamAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_store_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stream_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StreamAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StreamAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_strict_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StrictAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StrictAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_string_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StringAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StringAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_structured_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StructuredAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StructuredAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_studio_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StudioAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StudioAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stripe_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StripeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StripeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_strong_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StrongAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StrongAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_strike_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StrikeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StrikeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sub_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SubAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SubAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sum_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SumAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SumAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_super_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SuperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SuperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_support_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SupportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SupportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_stub_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StubAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StubAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_certificate_thumbprint_config_path_matching_azure_redactor()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Auth:CertificateThumbprint"] = "ABCDEF123456"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ArchLucid:Auth:CertificateThumbprint",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:PasswordlessAuth:Enabled", "true")]
    [InlineData("ArchLucid:TokenizerModel:Name", "gpt-4.1")]
    [InlineData("ArchLucid:ApiKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ConnectionStringFreeSettings:Enabled", "true")]
    [InlineData("ArchLucid:ConnectionStringlessSettings:Enabled", "true")]
    [InlineData("ArchLucid:SecretizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ApiKeyizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ConnectionStringizerSettings:Enabled", "true")]
    [InlineData("ArchLucid:PasswordizerAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PasswordFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:SecretFreeStorage:Bucket", "logs")]
    [InlineData("ArchLucid:TokenFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:TokenlessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ApiKeyFreeAuth:Mode", "managed-identity")]
    [InlineData("Features:NonSecretStorage:Bucket", "logs")]
    [InlineData("ArchLucid:PrivateKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PrivateKeyizerModule:Name", "module-a")]
  public void Resolve_returns_scalar_for_non_secret_segment_substrings(string configPath, string expectedValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = expectedValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        v.Should().Be(expectedValue);
    }
}
