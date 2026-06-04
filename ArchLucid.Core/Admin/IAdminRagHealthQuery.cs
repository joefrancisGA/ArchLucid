using ArchLucid.Contracts.Admin;

namespace ArchLucid.Core.Admin;

/// <summary>Builds operator-visible RAG corpus freshness (TB-194) without coupling Api to Retrieval.</summary>
public interface IAdminRagHealthQuery
{
    AdminRagHealthResponse GetRagHealth();
}
