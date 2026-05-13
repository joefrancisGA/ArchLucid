using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InitAppsettingsDocumentBuilderTests
{
    [Fact]
    public void JwtBearer_emits_entra_sections_and_disables_api_key()
    {
        InitWizardAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=srv;Database=db;User Id=u;Password=pwd;TrustServerCertificate=True;",
            AuthKind = InitAuthWizardKind.JwtBearer,
            JwtAuthority = "https://login.microsoftonline.com/tenant/v2.0",
            JwtAudience = "api://archlucid-api",
            JwtNameClaimType = "preferred_username",
        };

        string json = InitAppsettingsDocumentBuilder.BuildIndentedJson(answers);

        JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("Hosting").GetProperty("Role").GetString().Should().Be("Combined");
        root.GetProperty("ArchLucid").GetProperty("StorageProvider").GetString().Should().Be("Sql");
        root.GetProperty("ConnectionStrings").GetProperty("ArchLucid").GetString().Should().Contain("Server=srv");
        root.GetProperty("ArchLucidAuth").GetProperty("Mode").GetString().Should().Be("JwtBearer");
        root.GetProperty("ArchLucidAuth").GetProperty("Authority").GetString().Should().Contain("microsoftonline.com");
        root.GetProperty("ArchLucidAuth").GetProperty("NameClaimType").GetString().Should().Be("preferred_username");
        root.GetProperty("Authentication").GetProperty("ApiKey").GetProperty("Enabled").GetBoolean().Should().BeFalse();
        root.GetProperty("Authentication").GetProperty("ApiKey").GetProperty("DevelopmentBypassAll").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public void ApiKey_emits_admin_key_enabled_section()
    {
        InitWizardAnswers answers = new()
        {
            ConnectionStringsArchLucid = "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AuthKind = InitAuthWizardKind.ApiKey,
            ApiAdminKey = "secret-admin-key",
        };

        string json = InitAppsettingsDocumentBuilder.BuildIndentedJson(answers);

        JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("ArchLucidAuth").GetProperty("Mode").GetString().Should().Be("ApiKey");
        root.GetProperty("Authentication").GetProperty("ApiKey").GetProperty("Enabled").GetBoolean().Should().BeTrue();
        root.GetProperty("Authentication").GetProperty("ApiKey").GetProperty("AdminKey").GetString().Should().Be("secret-admin-key");
    }

    [Fact]
    public void DevelopmentBypass_emits_development_bundle_only_under_arch_lucid_auth()
    {
        InitWizardAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AuthKind = InitAuthWizardKind.DevelopmentBypass,
            DevUserId = "custom-dev",
            DevUserName = "Alice",
            DevRole = "Reader",
        };

        string json = InitAppsettingsDocumentBuilder.BuildIndentedJson(answers);

        JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("ArchLucidAuth").GetProperty("Mode").GetString().Should().Be("DevelopmentBypass");
        root.GetProperty("ArchLucidAuth").GetProperty("DevUserId").GetString().Should().Be("custom-dev");
        root.GetProperty("Authentication").GetProperty("ApiKey").GetProperty("DevelopmentBypassAll").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public void ValidateSql_throws_when_blank()
    {
        FluentActions.Invoking(() => InitAppsettingsDocumentBuilder.ValidateSqlConnectionString("  "))
            .Should().Throw<ArgumentException>();
    }

    [Fact]
    public void DescribeSqlConnection_never_includes_password_keyword_from_builder_sample()
    {
        string raw =
            "Server=tcp:sql.database.windows.net;Database=catalog;User Id=reader;Password=hunter2;Encrypt=True;TrustServerCertificate=False;";

        string summary = InitAppsettingsDocumentBuilder.DescribeSqlConnection(raw);

        summary.Should().Contain("sql.database.windows.net");
        summary.Should().Contain("catalog");
        summary.Should().NotContain("hunter2");
    }

    [Fact]
    public void BuildIndentedJson_throws_when_jwt_missing_audience()
    {
        InitWizardAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AuthKind = InitAuthWizardKind.JwtBearer,
            JwtAuthority = "https://login.microsoftonline.com/tenant/v2.0",
            JwtAudience = "",
        };

        FluentActions.Invoking(() => InitAppsettingsDocumentBuilder.BuildIndentedJson(answers))
            .Should().Throw<ArgumentException>()
            .WithMessage("*Audience*");
    }
}
