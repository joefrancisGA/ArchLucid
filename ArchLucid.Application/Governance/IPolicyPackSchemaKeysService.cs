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
}
