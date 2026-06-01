# terraform-acr (TB-097)

Azure Container Registry for ArchLucid images. Default `enable_acr = false`. Production-like stacks use **Premium** SKU with `admin_enabled = false`.

Wire `acr_id` output into `terraform-container-apps` `acr_resource_id` (existing data block continues to work).
