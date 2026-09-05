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
