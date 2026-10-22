# SN-FQ-HOLD — Do not “fix” this by widening architecture APIs

**Not implementation.**

## Hold

- Do **not** change `GET /v1/architectures/{architectureId:guid}/seal-delta` to accept `customer-intake` or other slugs.
- Do **not** create a SecureNow architecture row for the sample slug.
- Do **not** delete IH-016, `InhabitedFindingsDocumentChrome`, or the Architecture nested findings document at `/architecture/architectures/{architectureId}/findings`.
- Do **not** share `archlucid.lastOpenArchitectureId.v1` into SecureNow as a supported scope. Security ignores it (**SN-FQ-01**).
- Do **not** point SecureNow recovery at `/architecture/architectures/...`.

The screenshot is a product-line leak. The repair is to stop mounting the architecture desk on `/compliance/findings`, not to make the desk succeed for a sample slug.
