> **Scope:** Zoom-in — Azure deployment topology (Terraform roots).
> **Map:** [`../../library/DEPLOYMENT_TERRAFORM.md`](../../library/DEPLOYMENT_TERRAFORM.md)

# ArchLucid — Azure topology

![Azure topology](archlucid-azure-topology.svg)

Editable source: [`archlucid-azure-topology.mmd`](archlucid-azure-topology.mmd)

```mermaid
flowchart TB
  subgraph edge["Edge optional"]
    FD["Front Door / terraform-edge"]
    APIM["APIM Consumption optional"]
  end

  subgraph compute["Workload"]
    ACR["ACR"]
    CA_API["Container Apps — Api"]
    CA_WK["Container Apps — Worker"]
  end

  subgraph data["Data plane"]
    SQL[("Azure SQL<br/>per-tenant catalogs")]
    ST["Storage blobs / queues"]
    SB["Service Bus optional"]
    KV["Key Vault"]
    AOAI["Azure OpenAI optional"]
    REDIS["Redis optional"]
    COSMOS["Cosmos optional"]
  end

  subgraph net["Network"]
    PE["Private endpoints<br/>terraform-private"]
  end

  subgraph obs["Observability"]
    LAW["Log Analytics / Monitor"]
  end

  CI["CI build"] --> ACR
  ACR --> CA_API
  ACR --> CA_WK
  FD --> APIM --> CA_API
  FD -.-> CA_API
  CA_API --> SQL
  CA_WK --> SQL
  CA_API --> ST
  CA_WK --> ST
  CA_API --> SB
  CA_WK --> SB
  CA_API --> KV
  CA_WK --> KV
  CA_API --> AOAI
  CA_WK --> AOAI
  CA_API --> REDIS
  CA_API --> COSMOS
  PE -.-> SQL
  PE -.-> ST
  PE -.-> KV
  CA_API --> LAW
  CA_WK --> LAW
```
