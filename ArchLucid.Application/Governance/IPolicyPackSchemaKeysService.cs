using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Exposes configurable key metadata for <see cref="ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument" />
///     by parsing the registered JSON Schema (same shape as OpenAPI / Swashbuckle).
/// </summary>
public interface IPolicyPackSchemaKeysService
{
    /// <summary>Returns flat and tree views of all valid, configurable policy pack content keys.</summary>
    PolicyPackSchemaKeysResponse GetSchemaKeys();

    /// <summary>Returns the full JSON Schema for <c>PolicyPackContentDocument</c> client-side validation.</summary>
    PolicyPackContentDocumentJsonSchemaResponse GetContentDocumentJsonSchema();
}
