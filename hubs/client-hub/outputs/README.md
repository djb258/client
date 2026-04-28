# Client Hub — Outputs

## What this directory is

Canonical storage for vendor-facing forms, applications, and output artifacts that get filled out per client and sent to vendors/carriers as part of the client onboarding or servicing workflow.

Structure:

```
workers/client-hub/outputs/
├── README.md                          (this file)
├── <vendor-slug>/                     (one directory per carrier/vendor)
│   └── <form-or-document-name>.pdf    (the raw template, unfilled)
```

## Current inventory

| Vendor | File | Purpose |
|---|---|---|
| `uhc/` (UnitedHealthcare) | `plan-participant-application-surest-level-funded-2-50.pdf` | Streamlined plan participant application for UnitedHealthcare and Surest / Level Funded / Select markets (2-50 employee groups). Blank template — needs to be filled out per client with group-specific changes before submission to UHC. |

## Rules

1. **This is raw template storage.** Files here are the unfilled versions. Do not commit filled-out per-client copies (those live elsewhere in the client record, not in git).
2. **One directory per vendor/carrier** using a clean kebab-case slug (`uhc`, `aetna`, `first-health`, `healthsmart`, etc.).
3. **Filenames use kebab-case** and name the document purpose. Drop marketing cruft from the original filename (e.g., `Plan participant application - Streamlined - UnitedHealthcare and Surest_Level Funded_Select markets_2-50_UnitedHealthcare (1).pdf` becomes `plan-participant-application-surest-level-funded-2-50.pdf`).
4. **Update this README's inventory table** whenever a new file is added.
5. **Binary discipline:** PDFs and other binaries live here only if they are canonical templates. If the file changes frequently, consider R2 storage instead with a pointer in the client-hub D1.

## The flow

```
1. Vendor/carrier releases a new application template
2. Dave pulls it down and commits it to workers/client-hub/outputs/<vendor>/
3. When a client needs to submit: copy the template, fill it out per the client's details,
   send to vendor, log the transmission in the client record (D1)
4. The raw template in git stays the source-of-truth version
```

## HEIR identity

| Field | Value |
|---|---|
| sovereign_ref | imo-creator |
| hub_id | client-hub |
| cc_layer | CC-03 |
| ctb_placement | leaf |
