using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class EmailNotificationOptionsTests
{
    [Fact]
    public void SectionName_is_Email_group()
    {
        EmailNotificationOptions.SectionName.Should().Be("Email");
    }

    [Fact]
    public void Defaults_use_noop_provider_smtp_defaults_and_sales_inbox()
    {
        EmailNotificationOptions options = new();

        options.Provider.Should().Be(EmailProviderNames.Noop);
        options.SmtpPort.Should().Be(25);
        options.PricingQuoteSalesInbox.Should().Be("sales@archlucid.net");
        options.AzureCommunicationServicesEndpoint.Should().BeNull();
        options.AzureManagedIdentityClientId.Should().BeNull();
        options.SmtpHost.Should().BeNull();
        options.SmtpUser.Should().BeNull();
        options.SmtpPassword.Should().BeNull();
        options.FromAddress.Should().BeNull();
        options.FromDisplayName.Should().BeNull();
        options.OperatorBaseUrl.Should().BeNull();
        options.ProductDisplayName.Should().BeNull();
    }

    [Fact]
    public void Providers_have_distinct_stable_literals()
    {
        EmailProviderNames.Noop.Should().Be("Noop");
        EmailProviderNames.Smtp.Should().Be("Smtp");
        EmailProviderNames.AzureCommunicationServices.Should().Be("AzureCommunicationServices");
    }

    [Fact]
    public void Initialization_overrides_optional_template_and_transport_fields()
    {
        EmailNotificationOptions options =
            new()
            {
                Provider = EmailProviderNames.AzureCommunicationServices,
                AzureCommunicationServicesEndpoint = "https://acs.example",
                AzureManagedIdentityClientId = "msi-tenant",
                SmtpHost = "smtp.example",
                SmtpPort = 587,
                SmtpUser = "u",
                SmtpPassword = "p",
                FromAddress = "noreply@example.com",
                FromDisplayName = "ArchLucid QA",
                OperatorBaseUrl = "https://operator.example/",
                ProductDisplayName = "ArchLucid",
                PricingQuoteSalesInbox = "quotes@example.com",
            };

        options.Provider.Should().Be(EmailProviderNames.AzureCommunicationServices);
        options.AzureCommunicationServicesEndpoint.Should().Be("https://acs.example");
        options.AzureManagedIdentityClientId.Should().Be("msi-tenant");
        options.SmtpHost.Should().Be("smtp.example");
        options.SmtpPort.Should().Be(587);
        options.SmtpUser.Should().Be("u");
        options.SmtpPassword.Should().Be("p");
        options.FromAddress.Should().Be("noreply@example.com");
        options.FromDisplayName.Should().Be("ArchLucid QA");
        options.OperatorBaseUrl.Should().Be("https://operator.example/");
        options.ProductDisplayName.Should().Be("ArchLucid");
        options.PricingQuoteSalesInbox.Should().Be("quotes@example.com");
    }

    [Fact]
    public void Smtp_provider_literal_can_round_trip()
    {
        EmailNotificationOptions options = new() { Provider = EmailProviderNames.Smtp };

        options.Provider.Should().Be("Smtp");
    }
}
