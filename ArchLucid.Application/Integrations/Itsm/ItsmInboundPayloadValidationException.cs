namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Payload validation failure surfaced by <see cref="IItsmInboundPayloadReader" /> implementations.</summary>
public sealed class ItsmInboundPayloadValidationException : Exception
{
    public ItsmInboundPayloadValidationException(string externalKey, string reasonCode, string message)
        : base(message)
    {
        ExternalKey = externalKey;
        ReasonCode = reasonCode;
    }

    public string ExternalKey { get; }

    public string ReasonCode { get; }
}
