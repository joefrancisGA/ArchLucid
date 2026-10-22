using System.Security.Cryptography.X509Certificates;
using System.Xml.Linq;

namespace ArchLucid.Core.Auth.Saml;

/// <summary>
///     Validates a local SAML 2.0 IdP metadata XML document (endpoints, certificates, optional XML signature) without
///     requiring a running API host.
/// </summary>
public static class SamlIdpMetadataFileDiagnostics
{
    private static readonly XNamespace SamlMetadataNs = "urn:oasis:names:tc:SAML:2.0:metadata";
    private static readonly XNamespace DsNs = "http://www.w3.org/2000/09/xmldsig#";

    private static readonly TimeSpan MetadataValidUntilWarnLeadTime = TimeSpan.FromDays(30);

    public static IReadOnlyList<SamlTestConfigComponentResult> Evaluate(string metadataXml)
    {
        if (string.IsNullOrWhiteSpace(metadataXml))
        {
            return
            [
                new SamlTestConfigComponentResult(
                    "metadata.parse",
                    SamlTestConfigComponentStatus.Fail,
                    "SAML metadata XML is empty.")
            ];
        }

        List<SamlTestConfigComponentResult> results = [];

        XDocument document;

        try
        {
            document = XDocument.Parse(metadataXml, LoadOptions.None);
        }
        catch (Exception ex)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.parse",
                SamlTestConfigComponentStatus.Fail,
                $"Metadata XML is not well-formed: {ex.Message}"));

            return results;
        }

        results.Add(new SamlTestConfigComponentResult(
            "metadata.parse",
            SamlTestConfigComponentStatus.Pass,
            "Metadata XML parsed successfully."));

        AppendDiscoveryChecks(results, metadataXml);
        AppendEndpointChecks(results, document);
        AppendSignatureChecks(results, document);

        return results;
    }

    private static void AppendDiscoveryChecks(List<SamlTestConfigComponentResult> results, string metadataXml)
    {
        try
        {
            SamlMetadataDiscoveryResult discovery = SamlMetadataDiscoveryParser.Parse(metadataXml);

            results.Add(new SamlTestConfigComponentResult(
                "metadata.entityId",
                SamlTestConfigComponentStatus.Pass,
                $"entityID (issuer) is '{discovery.IssuerUri}'."));

            if (discovery.SigningCertificateThumbprints.Count == 0)
            {
                results.Add(new SamlTestConfigComponentResult(
                    "metadata.signingCertificates",
                    SamlTestConfigComponentStatus.Warn,
                    "No signing X509Certificate elements were found under KeyDescriptor nodes."));
            }
            else
            {
                results.Add(new SamlTestConfigComponentResult(
                    "metadata.signingCertificates",
                    SamlTestConfigComponentStatus.Pass,
                    $"{discovery.SigningCertificateThumbprints.Count} signing certificate thumbprint(s) discovered."));
            }
        }
        catch (Exception ex)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.discovery",
                SamlTestConfigComponentStatus.Fail,
                ex.Message));
        }

        DateTimeOffset? validUntilUtc = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(metadataXml);

        if (validUntilUtc is null)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.validUntil",
                SamlTestConfigComponentStatus.Pass,
                "No root validUntil attribute (normal for many IdPs)."));

            return;
        }

        DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();

        if (validUntilUtc <= nowUtc)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.validUntil",
                SamlTestConfigComponentStatus.Fail,
                $"Metadata validUntil {validUntilUtc:O} (UTC) is in the past."));

            return;
        }

        if (validUntilUtc - nowUtc <= MetadataValidUntilWarnLeadTime)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.validUntil",
                SamlTestConfigComponentStatus.Warn,
                $"Metadata validUntil {validUntilUtc:O} (UTC) — within {MetadataValidUntilWarnLeadTime.Days} days."));

            return;
        }

        results.Add(new SamlTestConfigComponentResult(
            "metadata.validUntil",
            SamlTestConfigComponentStatus.Pass,
            $"Metadata validUntil {validUntilUtc:O} (UTC)."));
    }

    private static void AppendEndpointChecks(List<SamlTestConfigComponentResult> results, XDocument document)
    {
        XElement? root = document.Root;

        if (root is null)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.ssoEndpoints",
                SamlTestConfigComponentStatus.Fail,
                "Metadata document has no root element."));

            return;
        }

        List<string> ssoBindings = root
            .Descendants(SamlMetadataNs + "SingleSignOnService")
            .Select(static e => e.Attribute("Binding")?.Value?.Trim() ?? string.Empty)
            .Where(static b => !string.IsNullOrWhiteSpace(b))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (ssoBindings.Count == 0)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.ssoEndpoints",
                SamlTestConfigComponentStatus.Fail,
                "No SingleSignOnService endpoints were found in IdP metadata."));

            return;
        }

        results.Add(new SamlTestConfigComponentResult(
            "metadata.ssoEndpoints",
            SamlTestConfigComponentStatus.Pass,
            $"SingleSignOnService bindings: {string.Join(", ", ssoBindings)}."));
    }

    private static void AppendSignatureChecks(List<SamlTestConfigComponentResult> results, XDocument document)
    {
        XElement? signatureElement = document
            .Descendants(DsNs + "Signature")
            .FirstOrDefault();

        if (signatureElement is null)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.xmlSignature",
                SamlTestConfigComponentStatus.Info,
                "No XML ds:Signature element present — signature verification skipped."));

            return;
        }

        bool hasReference = signatureElement.Descendants(DsNs + "Reference").Any();
        bool hasSignatureValue = signatureElement.Descendants(DsNs + "SignatureValue").Any();
        bool hasKeyInfoCert = signatureElement
            .Descendants(DsNs + "X509Certificate")
            .Any(static e => !string.IsNullOrWhiteSpace(e.Value));

        if (!hasReference || !hasSignatureValue)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.xmlSignature",
                SamlTestConfigComponentStatus.Fail,
                "ds:Signature is present but missing Reference or SignatureValue nodes."));

            return;
        }

        if (!hasKeyInfoCert)
        {
            results.Add(new SamlTestConfigComponentResult(
                "metadata.xmlSignature",
                SamlTestConfigComponentStatus.Warn,
                "ds:Signature is present but no embedded X509Certificate was found in KeyInfo."));

            return;
        }

        results.Add(new SamlTestConfigComponentResult(
            "metadata.xmlSignature",
            SamlTestConfigComponentStatus.Pass,
            "ds:Signature structure includes Reference, SignatureValue, and an embedded X509Certificate."));
    }
}
