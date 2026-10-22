# DCH hold — out of scope

**Do not implement this file.** It bounds DCH-01 through DCH-04.

## Stay out

- Key Vault secret GET, certificate download, or storage account key list
- Kudu, SCM, site extensions, function app keys, and slot sticky settings beyond the two list actions DCH-04 already names
- Persisting a setting value, password, account key, or shared access key in a package, warning, log, or review record
- Promoting a hostname match from inferred to observed
- A new companion file, a new collector family, or a general POST method on `GetOnlyHostedAzureArmReadClient`
- Re-running AX-DE-18, SN-RT, or NR-31 as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
