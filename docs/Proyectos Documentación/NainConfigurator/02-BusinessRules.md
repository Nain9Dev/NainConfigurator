# Business Rules

Document version: 2.7  
Status: Approved for MVP implementation  
Last updated: 2026-07-28  
Supersedes: `02-BusinessRules.v1.md`  
Initial product: Escritorio gaming modular (`DESK-001`)

## 1. Purpose

This document defines the authoritative business behavior of NainConfigurator.

The platform is product-agnostic. The first approved catalog is a modular gaming desk, but the rules are expressed through companies, products, option groups, options, compatibility rules, configurations and quote requests.

The MVP supports one published product, but no rule may depend on desk-specific database columns or request properties such as `DeskColor`, `DeskSize`, `DeskLeg` or `DeskDrawer`.

## 2. Source-of-truth boundaries

| Document | Authority |
|---|---|
| `01-ProductDefinition.md` | Product-specific catalog values, codes, prices and defaults |
| `02-BusinessRules.md` | Business invariants, validation and lifecycle behavior |
| `03-DataModel.md` | Logical entities, ownership, relationships and persistence requirements |
| `03.1-UserFlows.md` | Public user intent, client state transitions and recovery behavior |
| `03.2-UXRequirements.md` | Public presentation, accessibility, branding and locale behavior |
| `04.1-ApiContracts.md` | Public HTTP routes, request fields, response fields and error representation |
| `05-DatabaseDesign.md` | Approved physical SQL Server implementation of the logical model |
| `AI_CONTEXT.md` | Short project summary only; it is not an independent source of truth |

If documents conflict:

1. This document is authoritative for business behavior.
2. `01-ProductDefinition.md` is authoritative for the approved values of `DESK-001`.
3. `03-DataModel.md`, `03.1-UserFlows.md`, `03.2-UXRequirements.md` and `04.1-ApiContracts.md` must be aligned before implementation when a business rule changes persistence, interaction behavior, presentation context or the public contract.
4. `05-DatabaseDesign.md` must implement the logical model without redefining business behavior.

## 3. Normative language

- **Must**: mandatory for the MVP.
- **Must not**: prohibited for the MVP.
- **May**: optional behavior that does not change a business invariant.
- **Future**: intentionally not implemented in the MVP.

## 4. Core terminology

| Term | Definition |
|---|---|
| Company | Business that owns and publishes a product catalog |
| Product | Commercial item that can be configured |
| Catalog version | Positive integer identifying one published state of a product catalog |
| Option group | Set of related choices governed by minimum and maximum selections |
| Option | Selectable catalog item belonging to exactly one option group and one product |
| Compatibility rule | Data-driven constraint between selected options |
| Configuration | Immutable saved selection and commercial snapshot |
| Configuration snapshot | Historical copy of the commercial data used when a configuration was created |
| Visual state | Optional presentation-only data used to restore the 3D view |
| Content locale | BCP 47 language tag that identifies the human-readable catalog or saved snapshot language |
| Company brand profile | Current versioned non-commercial logo and semantic color presentation data |
| Quote request | Commercial contact request associated with one saved configuration |
| Client request ID | Client-generated GUID used to make create operations idempotent |

---

## 5. Catalog and configuration rules

### BR-001 - Product must be active

**Rule**

A product can be loaded, validated or configured only when it is active and published for the requested company.

**Validation**

- The product must exist.
- The product must belong to the requested company.
- The product must be active.
- A historical saved configuration remains retrievable if the product is later deactivated.

**API behavior**

- Catalog load: reject an inactive product.
- Configuration validation and creation: reject an inactive product.
- Historical configuration retrieval: use the saved snapshot without revalidating current product status.

**Error code:** `PRODUCT_NOT_AVAILABLE`  
**Status:** Approved.

---

### BR-002 - Required option groups

**Rule**

Every option group must contain at least its configured `minSelections` number of distinct selected options.

**DESK-001 commercial required groups**

- `DESKTOP_SIZE`
- `DESKTOP_FINISH`
- `LEG_TYPE`

`DRAWER_POSITION` is commercially optional but technically requires one explicit selection according to BR-011.

**Error code:** `MIN_SELECTIONS_NOT_REACHED`  
**Status:** Approved.

---

### BR-003 - Single-selection groups

**Rule**

An option group with `maxSelections = 1` cannot contain more than one selected option.

**DESK-001 applicable groups**

- `DESKTOP_SIZE`
- `DESKTOP_FINISH`
- `LEG_TYPE`
- `DRAWER_POSITION`

**Error code:** `MAX_SELECTIONS_EXCEEDED`  
**Status:** Approved.

---

### BR-004 - Multiple-selection groups

**Rule**

An option group may contain multiple distinct options only when its selection limits allow it.

For `DESK-001`, `ACCESSORIES` has `minSelections = 0` and `maxSelections = null`.

A null `maxSelections` means that the catalog has no explicit numeric limit. It does not permit duplicate options or options outside the product.

**Status:** Approved.

---

### BR-005 - Option ownership

**Rule**

Every selected option must belong to the requested product. The API derives the option group from persisted catalog data; the client does not declare that relationship.

**Validation**

- The option must exist.
- The option must belong to the selected product.
- The option group used for counting selections is the persisted group, never a client value.
- An option from another company or product must be rejected.

**Error codes**

- `OPTION_NOT_FOUND`
- `OPTION_DOES_NOT_BELONG_TO_PRODUCT`

**Status:** Approved.

---

### BR-006 - Active options

**Rule**

Only active options can be used in a new validation or configuration.

Deactivating an option must not alter or invalidate a historical configuration snapshot.

**Error code:** `OPTION_NOT_AVAILABLE`  
**Status:** Approved.

---

### BR-007 - Estimated price formula

**Rule**

The estimated price is the product base price plus the price adjustment of every distinct selected option.

```text
EstimatedPrice = ProductBasePrice + Sum(SelectedOption.PriceAdjustment)
```

Each selected option is included exactly once. Unselected options and client-provided amounts are never included.

**Status:** Approved.

---

### BR-008 - Server-side price authority

**Rule**

The API is the only authority for validation and the final estimated price returned or persisted.

**Validation**

- The API uses current persisted catalog values for validation.
- The API ignores any client-calculated price.
- Public create and validation requests must not contain an authoritative price field.
- A manipulated renderer or browser value cannot change the stored price.

**Status:** Approved.

---

### BR-009 - Configuration snapshot

**Rule**

A saved configuration must preserve the commercial data used at creation time.

**Required snapshot data**

- Company slug and name
- Product code and name
- Catalog version at creation
- Product base price
- Currency code
- Option group code and name
- Option code and name
- Option price adjustment
- Visual asset key
- Price breakdown
- Total estimated price
- Creation timestamp in UTC
- Optional visual state

Future catalog changes must not modify this data.

**Status:** Approved.

---

### BR-010 - Unique public resource codes

**Rule**

Every saved configuration and quote request must receive a globally unique, non-sequential public code. Internal numeric identifiers must never be used as public identifiers.

**Approved formats**

```text
Configuration: NCF-{24 uppercase hexadecimal characters}
Quote request: NQR-{24 uppercase hexadecimal characters}
```

Examples:

```text
NCF-A72F1C904B8D6E2134FA09BC
NQR-43C81A729D0E4B5F8612AC70
```

**Generation rules**

- The random portion must be generated from a cryptographically strong random source.
- A unique database constraint is mandatory.
- If a collision occurs, the API generates another code inside the same operation.
- Codes are immutable and are never reused.

**Error behavior**

If a unique code cannot be generated after the configured retry limit, the transaction fails and no partial resource is persisted.

**Status:** Approved.

---

### BR-011 - Explicit drawer position

**Rule**

`DRAWER_POSITION` must always contain exactly one selection:

- `DRAWER_NONE`
- `DRAWER_LEFT`
- `DRAWER_RIGHT`

Commercially, the drawer is optional. Technically, `DRAWER_NONE` represents the explicit decision not to add one.

**Validation**

- `minSelections = 1`
- `maxSelections = 1`
- `DRAWER_LEFT` and `DRAWER_RIGHT` cannot coexist.
- Omitting all drawer options is invalid.

**Error codes**

- `MIN_SELECTIONS_NOT_REACHED`
- `MAX_SELECTIONS_EXCEEDED`

**Status:** Approved.

---

### BR-012 - Quote request requires a saved configuration

**Rule**

A quote request must be associated with an existing saved configuration.

The quote request uses the immutable configuration snapshot. It does not rebuild the selection from the current catalog.

**Error code:** `CONFIGURATION_NOT_FOUND`  
**Status:** Approved.

---

### BR-013 - Electric standing desk minimum size

**Rule**

`LEG_ELECTRIC_STANDING` cannot be selected with `SIZE_120_60`.

**Valid target options**

- `SIZE_140_70`
- `SIZE_160_80`

**Catalog representation**

```text
Rule code: RULE-001
Type: RequiresAny
Source: LEG_ELECTRIC_STANDING
Targets: SIZE_140_70, SIZE_160_80
```

**Client behavior**

The public client and optional renderer should disable or clearly explain the invalid choice as soon as the combination is known.

**API behavior**

The API must independently reject the invalid combination even if the client allowed it.

**Error code:** `INVALID_OPTION_COMBINATION`  
**Error message:** `Las patas elevables eléctricas requieren un tablero de al menos 140 x 70 cm.`  
**Status:** Approved.

---

### BR-014 - Price adjustment integrity

**Rule**

Every option must contain one monetary price adjustment in the same currency as its product.

**Validation**

- Base price and adjustments use two decimal places.
- The current MVP catalog uses non-negative base prices and adjustments.
- The calculated estimated price cannot be lower than zero.
- Discounts, taxes calculation, shipping and installation are not implicit option adjustments in the MVP.

Future negative adjustments require an explicit discount rule before they are published.

**Status:** Approved.

---

### BR-015 - Immediate displayed price

**Rule**

The public client may calculate an immediate estimated price from the loaded catalog to provide responsive feedback.

This client calculation is informative only. Validation and creation must use the API result.

If the local and API values differ, the API value wins and the client must refresh its displayed breakdown.

**Status:** Approved.

---

### BR-016 - Non-contractual estimate

**Rule**

The displayed and saved configuration price is an estimate, not a contractual quote.

**Approved message**

```text
Precio estimado. El precio final puede requerir confirmación comercial.
```

For `DESK-001`, the estimate is expressed in EUR and includes taxes as defined in `01-ProductDefinition.md`. Shipping, installation and later commercial adjustments are excluded unless they are added explicitly to a future catalog model.

**Status:** Approved.

---

## 6. Generic platform invariants

### BR-017 - Company and product scope

**Rule**

Every product belongs to exactly one company catalog in the MVP data model. A product code is resolved together with its `companySlug`.

**Validation**

- `companySlug` must identify an existing company.
- The requested product must belong to that company.
- Configurations inherit the company from the resolved product.
- Quote requests inherit the company from the saved configuration.
- The client cannot override company ownership during configuration or quote creation.

**Error codes**

- `COMPANY_NOT_FOUND`
- `PRODUCT_NOT_FOUND`

**Status:** Approved.

---

### BR-018 - Option group must be active

**Rule**

Only active option groups are returned in a published catalog and accepted in new configurations.

Options inside an inactive group cannot be selected even if the option record itself is active.

Historical snapshots remain valid after a group is deactivated.

**Error code:** `OPTION_NOT_AVAILABLE`  
**Status:** Approved.

---

### BR-019 - Selection limits are data-driven

**Rule**

The validation engine must use `minSelections` and `maxSelections`. It must not contain product-specific branches for required, optional, single or multiple groups.

**Catalog invariants**

- `minSelections` is an integer greater than or equal to zero.
- `maxSelections` is null or an integer greater than or equal to one.
- When `maxSelections` is not null, `minSelections` cannot exceed it.
- A group cannot require more selections than the number of active options it contains.
- A null `maxSelections` means no explicit configured maximum.

**Status:** Approved.

---

### BR-020 - Duplicate selected options are invalid

**Rule**

`selectedOptionCodes` must contain distinct option codes.

Duplicates are rejected before group selection counts and price calculation. The API must not silently remove duplicates because that could hide a client defect or attempted price manipulation.

**Error code:** `DUPLICATE_OPTION_CODE`  
**HTTP status:** `400 Bad Request`  
**Status:** Approved.

---

### BR-021 - Catalog version consistency

**Rule**

Validation and configuration creation must use the same published catalog version that the client loaded.

**Validation**

- `catalogVersion` is required and must be a positive integer.
- It must equal the product's current published version.
- An outdated version cannot be validated, priced or saved.
- The client must reload the product after a version conflict.

**Version increment rule**

The catalog version must increase whenever a published field can change the selectable interface, 3D representation, validation, price or saved snapshot. This includes changes to:

- Product base price, currency, name, description or availability
- Option group name, active state, order or selection limits
- Option name, group, active state, order, default state, price or visual asset key
- Compatibility rule type, source, targets, active state or message

A company display-name change must increment the catalog version of each published product whose configuration snapshot includes that name.

**Error code:** `CATALOG_VERSION_OUTDATED`  
**HTTP status:** `409 Conflict`  
**Status:** Approved.

---

### BR-022 - Stable catalog codes

**Rule**

Published codes are stable business identifiers.

**Uniqueness scopes**

| Identifier | Scope |
|---|---|
| Company slug | Global |
| Product code | Company |
| Option group code | Product |
| Option code | Product |
| Compatibility rule code | Product |
| Configuration code | Global |
| Quote request code | Global |

**Format conventions**

- Company slugs use lowercase letters, numbers and hyphens.
- Product, group, option and rule codes use uppercase letters, numbers, hyphens and underscores.
- API responses always return the canonical persisted form.
- Published codes are immutable and cannot later identify a different resource.

**Status:** Approved.

---

### BR-023 - Valid default configuration

**Rule**

Every published product must have a complete default selection that satisfies all active catalog rules.

**Validation**

- Every group with `minSelections > 0` has enough active default options.
- Defaults do not exceed `maxSelections`.
- Default options are active and belong to the product.
- The combined defaults satisfy every active compatibility rule.
- The default estimated price is valid.

If these conditions are not met, the product is not publishable and must not be returned as available.

**Error behavior:** Return `PRODUCT_NOT_AVAILABLE` publicly and log the catalog defect internally.  
**Status:** Approved.

---

### BR-024 - Compatibility rules are evaluated from catalog data

**Rule**

Every active compatibility rule whose source option is selected must be evaluated by the API.

For `RequiresAny`, validation succeeds only when at least one configured target option is also selected.

**Evaluation rules**

- Inactive rules are ignored.
- A rule is not triggered when none of its source options is selected.
- Every triggered active rule must pass.
- The client may use the same rule data to guide the user, but the API remains authoritative.
- Rule evaluation must not use hardcoded desk option codes in the generic validator.

**Error code:** `INVALID_OPTION_COMBINATION`  
**Status:** Approved.

---

### BR-025 - Monetary precision and currency

**Rule**

All monetary calculations use decimal arithmetic. Binary floating-point types must not be used for authoritative prices.

**Validation and persistence**

- Currency uses an ISO 4217 code.
- One configuration contains exactly one currency inherited from the product.
- Base price, adjustments and totals use a scale of two decimal places in the MVP.
- Price components are summed without converting to `float` or `double`.
- The serialized result is a JSON decimal number, not a formatted currency string.

**Status:** Approved.

---

### BR-026 - Deterministic normalized result

**Rule**

Equivalent valid selections must produce the same normalized selections, price breakdown and estimated price regardless of request array order.

**Ordering**

1. Option groups by catalog `sortOrder`, then stable group code.
2. Options by catalog `sortOrder`, then stable option code.
3. Price breakdown starts with `BasePrice`, followed by option adjustments in normalized option order.

The normalized result is produced by the API and may be used by the client to correct its local state.

**Status:** Approved.

---

## 7. Configuration lifecycle rules

### BR-027 - Validation does not persist data

**Rule**

`POST /api/v1/configurations/validate` validates and calculates only. It must not create a configuration, quote request or idempotency record.

The validation and creation use cases must reuse the same application-layer validation and price calculation logic.

**Status:** Approved.

---

### BR-028 - Configuration creation is atomic

**Rule**

Configuration creation must complete in one atomic application transaction with one explicit transaction owner.

The atomic operation includes:

- Configuration public code
- Company and product reference
- Catalog version
- Configuration header
- Selected option snapshots
- Price breakdown and estimated total
- Optional visual state
- Idempotency data
- Server creation timestamp

If any insert fails, the complete transaction is rolled back. No partial configuration may remain.

**Status:** Approved.

---

### BR-029 - Saved configurations are immutable

**Rule**

A saved configuration cannot be edited in the MVP.

If a user changes a selection after saving, the client creates a new configuration with a new `clientRequestId` and configuration code.

Catalog price changes, renamed options, deactivated options and changed visual assets must not alter an existing snapshot.

**Status:** Approved.

---

### BR-030 - Visual state is optional and non-authoritative

**Rule**

`visualState` may restore presentation state, but it cannot define products, selected options, compatibility, currency or price.

**MVP constraints**

- `visualState` is optional.
- Maximum serialized UTF-8 size is 16 KB.
- When present, `schemaVersion` is required.
- The MVP supports `schemaVersion = 1`.
- Version 1 may contain the documented camera position and rotation fields.
- Values must be finite JSON numbers.
- Data outside the supported schema is rejected rather than interpreted as business data.
- Missing visual state does not prevent configuration retrieval; the client uses its default camera.

**Error codes**

- `VISUAL_STATE_TOO_LARGE`
- `VISUAL_STATE_INVALID`
- `VISUAL_STATE_SCHEMA_UNSUPPORTED`

**Status:** Approved.

---

### BR-031 - Configuration creation is idempotent

**Rule**

`clientRequestId` is a required GUID for configuration creation.

**Behavior**

- First valid request: create the configuration and return `201 Created` with `wasExisting = false`.
- Same ID and same normalized payload: return the existing configuration with `200 OK` and `wasExisting = true`.
- Same ID and different normalized payload: reject with `409 Conflict`.

Option array order does not make the payload different. The idempotency comparison uses canonical company, product, catalog version, normalized option codes and canonical visual state.

An existing successful idempotency record is resolved before current catalog validation. Therefore, an exact replay returns its original configuration even if the product catalog changed after creation. A new `clientRequestId` still requires the current catalog version.

Concurrent requests with the same `clientRequestId` must be protected by a unique persistence constraint so that only one configuration can be committed.

**Error code:** `CLIENT_REQUEST_ID_REUSED`  
**Status:** Approved.

---

### BR-032 - Quote request creation is idempotent

**Rule**

Quote request creation follows the same idempotency behavior as BR-031, using a separate quote-request idempotency scope.

The comparison uses the configuration code, normalized contact values, message, privacy policy version and acknowledgment.

An idempotent replay must not create a second lead, notification or commercial action.

An existing successful quote idempotency record is resolved before attempting a new quote creation.

**Error code:** `CLIENT_REQUEST_ID_REUSED`  
**Status:** Approved.

---

## 8. Quote request and privacy rules

### BR-033 - Quote contact data

**Rule**

A quote request requires a contact name and email. Phone and message are optional.

**Normalization and constraints**

- Leading and trailing whitespace is removed from text input.
- A required value that is empty after trimming is invalid.
- Name: required, maximum 150 characters.
- Email: required, syntactically valid, maximum 254 characters.
- Phone: optional, maximum 30 characters.
- Message: optional, maximum 1000 characters.
- Email syntax validation does not claim that the mailbox exists.

**Error codes**

- `NAME_REQUIRED`
- `EMAIL_REQUIRED`
- `EMAIL_INVALID`

**Status:** Approved.

---

### BR-034 - Privacy notice acknowledgment

**Rule**

A quote request cannot be created unless the user explicitly acknowledges the privacy notice presented by the configured company.

**Validation and evidence**

- `privacyPolicy.acknowledged` must be `true`.
- Acknowledgment must not be preselected by the client.
- `privacyPolicy.version` is required.
- The version must match the active policy version configured for the company at submission time.
- The API stores the acknowledged version, its immutable content identity and its own UTC acknowledgment timestamp.
- Acknowledgment proves presentation of the notice only. It does not select or prove the controller's lawful basis, contractual acceptance or marketing consent.
- Marketing consent is outside the MVP and requires a separate future purpose and workflow.

**Error codes**

- `PRIVACY_POLICY_NOT_ACKNOWLEDGED`
- `PRIVACY_POLICY_VERSION_REQUIRED`
- `PRIVACY_POLICY_VERSION_OUTDATED`

**Status:** Approved for MVP implementation. The client-specific legal notice, lawful basis and contractual privacy artifacts remain required before processing real customer data.

---

### BR-035 - Quote ownership and initial status

**Rule**

The saved configuration determines the company and product for the quote request. These values are not accepted from the public quote request body.

Every newly created quote request starts with status `New`.

Future commercial status transitions are outside the public MVP API and must be defined before an administration workflow is implemented.

**Status:** Approved.

---

### BR-036 - Server timestamps use UTC

**Rule**

Creation and privacy acknowledgment timestamps are generated by the API in UTC. Client timestamps are not authoritative.

Public timestamps use ISO 8601 UTC representation.

**Status:** Approved.

---

### BR-037 - Public data and logging boundaries

**Rule**

Public contracts and application logs must expose only the data required for their purpose.

**Requirements**

- Public responses never expose internal numeric database identifiers.
- Retrieving a configuration never returns quote contact data.
- Quote creation responses do not echo email, phone or message.
- Logs must not include full quote request bodies, email addresses, phone numbers or free-text messages.
- Logs may include public resource codes, stable error codes and `traceId` values.
- Unexpected errors return a generic public message and retain technical details only in internal logs.

**Status:** Approved.

---

## 9. Client and validation behavior

### BR-038 - The client is catalog-driven

**Rule**

Babylon.js or any future renderer must build its visual mapping from the product catalog returned by the API.

The client must not hardcode:

- Product prices
- Option availability
- Selection limits
- Default commercial selections
- Compatibility results
- Product-specific request properties

The client may contain a mapping from `visualAssetKey` to a local visual asset. A missing visual asset is a presentation problem and must not cause the client to invent a commercial selection.

**Status:** Approved.

---

### BR-039 - Unsupported compatibility rules fail safely

**Rule**

The MVP validation engine implements `RequiresAny` only.

`RequiresAll` and `ExcludesAny` are reserved for future use and must not be published as active rules until both API and client support are implemented and tested.

An active unknown or unsupported rule type must never be silently ignored. The affected product is treated as unavailable and the catalog defect is logged internally.

**Public error behavior:** `PRODUCT_NOT_AVAILABLE`  
**Status:** Approved.

---

### BR-040 - Deterministic validation pipeline

**Rule**

Validation executes in this order:

1. Request shape and field constraints.
2. Existing idempotency record resolution for create requests.
3. Company and product resolution.
4. Catalog version consistency.
5. Option existence, ownership and active state.
6. Duplicate detection and group selection limits.
7. Compatibility rules.
8. Authoritative price calculation and normalization.
9. Persistence, only for a valid new create request.

Dependent stages are not executed when their prerequisites fail. Independent errors discovered in the same stage may be returned together.

**Result rules**

- Invalid JSON or field shape: `400 Bad Request`.
- Missing company, product or configuration: `404 Not Found`.
- Catalog or idempotency conflict: `409 Conflict`.
- Failed business invariant: `422 Unprocessable Entity`.
- An invalid configuration has no authoritative estimated price.
- Validation failure never writes data.

**Status:** Approved.

---

### BR-041 - New quote requests require current product availability

**Rule**

A new quote request may be created only when the product referenced by its saved configuration is currently active and published for the owning company.

**Historical behavior**

- The saved configuration remains retrievable from its immutable snapshot when the current product is inactive or unpublished.
- The historical configuration is not revalidated against the current catalog.
- A new quote request with a new `clientRequestId` is rejected when the current product is unavailable.
- An exact replay of a quote request that was created successfully before the product became unavailable returns the existing quote request because idempotency resolution occurs first.

**Error code:** `PRODUCT_NOT_AVAILABLE`  
**HTTP status:** `422 Unprocessable Entity`  
**Status:** Approved.

---

### BR-042 - Company default locale and historical content locale

**Rule**

Each public company has exactly one supported BCP 47 default locale for the MVP. The initial public company and `DESK-001` use `es-ES`.

- The product catalog response exposes the resolved company locale.
- All public company, catalog, compatibility and disclaimer text in one response uses that locale.
- A saved configuration persists the locale used for its human-readable snapshot.
- Historical retrieval uses the persisted configuration locale, not a later company default.
- A default-locale change is published only with aligned public content and increments every affected product catalog version because future snapshots change language context.
- Language-specific fields such as `NameEs` and `NameEn` are prohibited. Future simultaneous same-company multilingual content requires generic locale-keyed translations and explicit fallback rules.

**Status:** Approved.

---

### BR-043 - Company branding is versioned non-commercial presentation

**Rule**

Company branding uses a current independently versioned profile and never becomes commercial catalog or configuration truth.

- MVP mode is `CoBranded`.
- The optional logo is a managed asset key; arbitrary CSS, HTML, JavaScript, fonts and executable customer assets are prohibited.
- Primary and foreground colors use validated `#RRGGBB` values and meet the approved accessibility contrast requirement before publication.
- Branding changes increment the brand-profile version and do not increment `catalogVersion`.
- Missing, invalid or failed runtime branding uses the accessible platform theme and company display name.
- Branding failure never blocks product load, validation, configuration creation, retrieval or quote creation.
- Saved configurations do not snapshot branding; retrieval may use current branding only as optional presentation.

**Status:** Approved.

---

### BR-044 - Published catalog content stays inside the supported envelope

**Rule**

A product may be publicly published only when its current catalog remains inside the tested capacity and human-readable content limits defined by `04.2-NonFunctionalRequirements.md`.

**Publication limits**

- At most 50 active option groups, 500 active options, 500 active compatibility rules and 2,000 active rule participant links per product.
- Company display name: maximum 150 Unicode scalar values.
- Product name: maximum 150.
- Product description: maximum 2,000.
- Price disclaimer: maximum 500.
- Option-group and option name: maximum 150 each.
- Compatibility-rule message: maximum 500.
- Managed visual or logo asset key: maximum 200.

Content at the limit remains valid and cannot be silently truncated. A catalog above the limit is rejected during managed publication; existing saved snapshots remain readable.

These are generic service limits and never justify product-specific fields or validation branches.

**Status:** Approved.

---

### BR-045 - Quote personal data expires

**Rule**

Every newly created quote request receives a server-generated `RetentionUntilUtc` from the active privacy-policy version's approved `QuoteRetentionDays`.

**Lifecycle requirements**

- `QuoteRetentionDays` defaults to 365 and must be between 30 and 1,825 days.
- A value above 365 requires documented controller justification before policy activation.
- After `RetentionUntilUtc`, the complete quote aggregate is deleted within 24 hours unless an approved legal hold applies.
- Deletion includes contact values, message, idempotency material and acknowledgment linkage; it never deletes or mutates the linked non-personal configuration.
- Legal holds are authorized, scoped, auditable and reviewed at least every 90 days.
- Backup copies expire inside the approved 35-day backup window and a restored environment reapplies completed deletions before serving traffic.
- The quote idempotency guarantee ends when the quote is lawfully deleted; a later submission is a new commercial intent.

**Status:** Approved.

---

## 10. Approved DESK-001 selection model

| Group code | Commercial meaning | minSelections | maxSelections | Default |
|---|---|---:|---:|---|
| `DESKTOP_SIZE` | Required single | 1 | 1 | `SIZE_120_60` |
| `DESKTOP_FINISH` | Required single | 1 | 1 | `FINISH_WHITE` |
| `LEG_TYPE` | Required single | 1 | 1 | `LEG_STANDARD_METAL` |
| `DRAWER_POSITION` | Optional feature represented explicitly | 1 | 1 | `DRAWER_NONE` |
| `ACCESSORIES` | Optional multiple | 0 | null | None |

### Approved compatibility rules

| Rule code | Type | Source | Targets | Result |
|---|---|---|---|---|
| `RULE-001` | `RequiresAny` | `LEG_ELECTRIC_STANDING` | `SIZE_140_70`, `SIZE_160_80` | At least one target must be selected |

### Approved price checks

| Configuration | Expected estimated price |
|---|---:|
| Default configuration | 299.90 EUR |
| Intermediate example from `01-ProductDefinition.md` | 529.90 EUR |
| Complete example from `01-ProductDefinition.md` | 819.90 EUR |

---

## 11. Acceptance scenarios

### SC-001 - Default configuration

Given the approved default options  
When the estimated price is calculated  
Then the configuration is valid and the result is 299.90 EUR.

### SC-002 - Missing required option

Given a configuration without a leg type  
When the configuration is validated  
Then it is rejected with `MIN_SELECTIONS_NOT_REACHED`.

### SC-003 - Multiple finishes

Given `FINISH_WHITE` and `FINISH_OAK`  
When the configuration is validated  
Then it is rejected with `MAX_SELECTIONS_EXCEEDED`.

### SC-004 - Invalid electric standing combination

Given `SIZE_120_60` and `LEG_ELECTRIC_STANDING`  
When the configuration is validated  
Then it is rejected with `INVALID_OPTION_COMBINATION`.

### SC-005 - Valid electric standing combination

Given `SIZE_160_80` and `LEG_ELECTRIC_STANDING`  
When the configuration is validated  
Then the compatibility rule passes.

### SC-006 - Multiple accessories

Given `ACCESSORY_CABLE_TRAY`, `ACCESSORY_RGB_LIGHTING` and `ACCESSORY_HEADPHONE_HOLDER` once each  
When the configuration is validated  
Then all three accessories are accepted and priced once.

### SC-007 - Option from another product

Given an option that does not belong to `DESK-001`  
When the configuration is validated  
Then it is rejected with `OPTION_DOES_NOT_BELONG_TO_PRODUCT`.

### SC-008 - Manipulated client price

Given a client displays or sends a manipulated price  
When the API validates or creates the configuration  
Then the API calculates the total from persisted catalog values.

### SC-009 - Inactive product

Given `DESK-001` is inactive  
When its catalog is requested or a new configuration is submitted  
Then the request is rejected with `PRODUCT_NOT_AVAILABLE`.

### SC-010 - Inactive option or option group

Given a selected option or its group is inactive  
When the configuration is validated  
Then it is rejected with `OPTION_NOT_AVAILABLE`.

### SC-011 - Duplicate option

Given `ACCESSORY_CABLE_TRAY` appears twice  
When the request is validated  
Then it is rejected with `DUPLICATE_OPTION_CODE` and is not priced twice.

### SC-012 - Outdated catalog

Given the client loaded catalog version 1 and the current version is 2  
When validation or creation is requested with version 1  
Then it is rejected with `CATALOG_VERSION_OUTDATED` before price calculation.

### SC-013 - Explicit no-drawer selection

Given `DRAWER_NONE` is the only drawer option  
When the configuration is validated  
Then the drawer group is valid and adds 0.00 EUR.

### SC-014 - Missing drawer selection

Given no drawer option is sent  
When the configuration is validated  
Then it is rejected with `MIN_SELECTIONS_NOT_REACHED`.

### SC-015 - Validation has no side effects

Given a valid validation request  
When the API returns its normalized price  
Then no configuration or idempotency record exists because of that validation.

### SC-016 - Idempotent configuration replay

Given a configuration was created successfully  
When the same `clientRequestId` and normalized payload are sent again  
Then the existing configuration is returned and no duplicate is inserted.

### SC-017 - Reused client request ID with different data

Given a `clientRequestId` was already used  
When it is sent with a different selection or visual state  
Then the request is rejected with `CLIENT_REQUEST_ID_REUSED`.

### SC-018 - Historical snapshot after catalog change

Given a configuration was saved at 819.90 EUR  
When catalog prices or names later change  
Then retrieving that configuration still returns its original snapshot and 819.90 EUR.

### SC-019 - Business data inside visual state

Given `visualState` attempts to define a price or selected option  
When the request is validated  
Then the unsupported visual data is rejected and never influences business logic.

### SC-020 - Quote without privacy acknowledgment

Given an existing configuration and valid contact data  
When `privacyPolicy.acknowledged` is false  
Then no quote request is created and `PRIVACY_POLICY_NOT_ACKNOWLEDGED` is returned.

### SC-021 - Outdated privacy policy version

Given the company active privacy policy differs from the submitted version  
When a quote request is created  
Then it is rejected with `PRIVACY_POLICY_VERSION_OUTDATED`.

### SC-022 - Idempotent quote replay

Given a quote request was created successfully  
When the same `clientRequestId` and normalized payload are sent again  
Then the existing quote request is returned and no duplicate lead or notification is created.

### SC-023 - Invalid default catalog

Given the published defaults violate a selection or compatibility rule  
When the product catalog is requested  
Then the product is treated as unavailable and the internal catalog error is logged.

### SC-024 - Request order does not affect the result

Given two requests contain the same distinct options in different array orders  
When both are validated  
Then they return the same normalized selections, price breakdown and estimated price.

### SC-025 - Transaction rollback

Given any configuration insert fails after the transaction starts  
When the atomic transaction cannot commit  
Then the entire operation is rolled back and no partial configuration remains.

### SC-026 - New quote for unavailable product

Given a saved configuration whose current product is inactive or unpublished  
When a new quote request is submitted with a new `clientRequestId`  
Then no quote request is created and `PRODUCT_NOT_AVAILABLE` is returned.

### SC-027 - Existing quote replay after product becomes unavailable

Given a quote request was created successfully and its current product later became unavailable  
When the same `clientRequestId` and normalized quote payload are replayed  
Then the existing quote request is returned and no new availability validation blocks the replay.

### SC-028 - Company default locale is exposed and snapshotted

Given the company default locale is `es-ES` and the current catalog is published in Spanish  
When a configuration is created  
Then the response exposes `es-ES` and the configuration persists `ContentLocale = es-ES` with its human-readable snapshots.

### SC-029 - Company locale changes after a save

Given a configuration was saved with `ContentLocale = es-ES`  
When the company later publishes a different supported default locale and aligned catalog version  
Then the historical configuration remains in its original snapshot locale and is not translated from current catalog data.

### SC-030 - Branding changes independently

Given a published product and company brand profile version 1  
When only valid branding changes to version 2  
Then `catalogVersion`, selections, authoritative price and existing configuration snapshots remain unchanged.

### SC-031 - Branding fails at runtime

Given company branding is missing or cannot be rendered  
When a public product or saved configuration loads  
Then the accessible platform theme and company-name fallback are used and the commercial operation remains available.

### SC-032 - Catalog at the supported boundary

Given a valid product at every approved count and content-length boundary  
When it is validated for publication  
Then publication succeeds without truncating names, messages or asset keys.

### SC-033 - Catalog exceeds the supported boundary

Given a product exceeds any approved catalog count or content-length boundary  
When managed publication is attempted  
Then publication is rejected before the oversized state becomes public and historical configurations remain unchanged.

### SC-034 - Quote reaches its retention deadline

Given a quote request is past `RetentionUntilUtc` and has no approved legal hold  
When the retention process completes  
Then the complete quote aggregate is deleted within 24 hours and its linked configuration remains unchanged.

---

## 12. Contract alignment status

`04.1-ApiContracts.md` was aligned on 2026-07-18 with these approved decisions:

- Public configuration and quote request codes use 24 hexadecimal characters after their prefix.
- Privacy policy version is validated against the active company policy.
- The company catalog response exposes the active privacy policy version and the resource that the client must present to the user.
- Add `PRIVACY_POLICY_VERSION_OUTDATED`.
- Add `VISUAL_STATE_INVALID` and `VISUAL_STATE_SCHEMA_UNSUPPORTED`.
- Clarify that only `RequiresAny` is executable in the MVP.
- Clarify that any published catalog change covered by BR-021 increments `catalogVersion`.

It was aligned again on 2026-07-19 for BR-041: new quote requests reject an unavailable current product with `PRODUCT_NOT_AVAILABLE`, while exact successful quote replays are resolved before current product availability.

It was aligned again on 2026-07-19 for BR-042 and BR-043: company locale and current branding are exposed generically, saved configurations preserve `contentLocale`, and branding versions remain independent from commercial catalog versions.

It was aligned again on 2026-07-19 for BR-044: public catalog counts and human-readable content lengths must remain inside the approved non-functional envelope.

It was aligned again on 2026-07-19 for BR-034 and BR-045: the public contract records privacy-notice acknowledgment rather than legal consent, and every quote receives an enforceable retention deadline.

These were documentation changes only. They do not authorize implementation before the database and application design are approved.

---

## 13. Explicitly outside the MVP

- Public customer accounts and customer self-service authentication
- Online payments
- Product administration panel
- Configuration editing after save
- Multiple product listing endpoint
- Inventory and stock reservation
- Shipping and installation calculation
- Discount and promotion engine
- Tax calculation engine
- Quote status management beyond initial `New`
- Marketing consent
- Email or SMS notification workflow
- Virtual reality and augmented reality
- Free placement of room objects
- Multiple simultaneous public locales for the same company
- Full white-label mode and arbitrary customer styling

## 14. Decisions required before real customer launch

The technical controls are approved in `04.3-SecurityAndPrivacy.md`. These customer-specific or operational artifacts still do not block a synthetic-data demo, but they must exist before processing real customer data:

- Legally approved company privacy notice, lawful basis, controller contact and active immutable version
- Executed data-processing agreement, subprocessor/region disclosure and customer retention justification
- Named operational access, privacy and incident owners
- Evidence that rate limiting, access control, deletion, backup reconciliation and incident response work
- Commercial recipient and notification workflow
