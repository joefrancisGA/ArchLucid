> **Scope:** Configuring Azure Private Endpoints.

# Private endpoint setup

This guide explains how to configure Azure Private Endpoints for SQL and Blob storage resources using the provided Terraform modules.

## Prerequisites
- An existing Azure Virtual Network (VNet) where the private endpoints will be connected.
- Terraform installed and authenticated to your Azure environment.

## Configuring private endpoints
The optional `infra/terraform-private/` modules provide the necessary configuration to establish private connectivity.

1. **Navigate to the private infrastructure module:**
   ```bash
   cd infra/terraform-private/
   ```

2. **Configure your variables:**
   Set the required variables for your VNet, subnet, and the target SQL and Blob storage resources. Provide these in your `terraform.tfvars` file or via command-line arguments.

3. **Deploy the private endpoints:**
   Run Terraform to provision the endpoints and private DNS zones.
   ```bash
   terraform init
   terraform apply
   ```

## Verifying connectivity
Once deployed, Azure SQL and Blob storage hostnames will resolve to private IPs within your VNet. Ensure that your ArchLucid API (e.g., running in App Service or Container Apps) is VNet-integrated so it can route traffic through the private endpoints.

## Post-migration lockdown
After confirming private connectivity works, you should restrict public access to the SQL and Blob resources via the Azure portal or Terraform to enforce a deny-by-default public network policy.
