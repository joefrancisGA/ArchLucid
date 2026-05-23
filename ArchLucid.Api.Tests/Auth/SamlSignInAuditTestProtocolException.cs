namespace ITfoxtec.Identity.Saml2;

/// <summary>Test double: production code treats exceptions in the <c>ITfoxtec.Identity.Saml2</c> namespace as SAML protocol faults.</summary>
public sealed class SamlSignInAuditTestProtocolException : Exception
{
    public SamlSignInAuditTestProtocolException()
        : base("test protocol fault")
    {
    }
}
