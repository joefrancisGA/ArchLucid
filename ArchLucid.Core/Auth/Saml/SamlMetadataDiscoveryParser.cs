using System.Globalization;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Xml.Linq;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>Parses SAML 2.0 IdP metadata for SSO wizard discovery (issuer, signing certs, suggested claim names).</summary>
public static class SamlMetadataDiscoveryParser
{
    private static readonly XNamespace SamlMetadataNs = "urn:oasis:names:tc:SAML:2.0:metadata";
    private static readonly XNamespace DsNs = "http://www.w3.org/2000/09/xmldsig#";

    private static readonly string[] DefaultClaimNames =
    [
        "groups",
        "roles",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
        "memberOf"
    ];

    public static SamlMetadataDiscoveryResult Parse(string xml)
    {
        if (string.IsNullOrWhiteSpace(xml))
            throw new ArgumentException("SAML metadata XML is required.", nameof(xml));

        XDocument document = XDocument.Parse(xml, LoadOptions.None);
        XElement? root = document.Root;

        if (root is null)
            throw new InvalidOperationException("SAML metadata document has no root element.");

        string? issuer = root.Attribute("entityID")?.Value?.Trim();

        if (string.IsNullOrWhiteSpace(issuer))
            throw new InvalidOperationException("SAML metadata is missing entityID (issuer).");

        List<string> thumbprints = ExtractSigningCertificateThumbprints(root);

        return new SamlMetadataDiscoveryResult
        {
            IssuerUri = issuer,
            SigningCertificateThumbprints = thumbprints,
            AvailableClaimNames = DefaultClaimNames
        };
    }

    private static List<string> ExtractSigningCertificateThumbprints(XElement root)
    {
        List<string> thumbprints = [];

        IEnumerable<XElement> keyDescriptors = root.Descendants(SamlMetadataNs + "KeyDescriptor")
            .Where(static e =>
            {
                XAttribute? use = e.Attribute("use");

                return use is null
                       || string.Equals(use.Value, "signing", StringComparison.OrdinalIgnoreCase);
            });

        foreach (XElement keyDescriptor in keyDescriptors)
        {
            foreach (XElement certElement in keyDescriptor.Descendants(DsNs + "X509Certificate"))
            {
                string? base64 = certElement.Value?.Trim();

                if (string.IsNullOrWhiteSpace(base64))
                    continue;

                try
                {
                    byte[] raw = Convert.FromBase64String(CompressBase64Whitespace(base64));
                    using X509Certificate2 certificate = X509CertificateLoader.LoadCertificate(raw);

                    string thumbprint = certificate.Thumbprint ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(thumbprint) && !thumbprints.Contains(thumbprint, StringComparer.OrdinalIgnoreCase))
                        thumbprints.Add(thumbprint.ToUpperInvariant());
                }
                catch (FormatException)
                {
                    // Skip malformed cert nodes — other certs may still be valid.
                }
                catch (CryptographicException)
                {
                    // Skip malformed cert nodes — other certs may still be valid.
                }
            }
        }

        return thumbprints;
    }

    private static string CompressBase64Whitespace(string value) =>
        new string(value.Where(static c => !char.IsWhiteSpace(c)).ToArray());
}

/// <summary>Structured SAML metadata discovery output for the SSO wizard.</summary>
public sealed class SamlMetadataDiscoveryResult
{
    public string IssuerUri { get; init; } = string.Empty;

    public IReadOnlyList<string> SigningCertificateThumbprints { get; init; } = [];

    public IReadOnlyList<string> AvailableClaimNames { get; init; } = [];
}
