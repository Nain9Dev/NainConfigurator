# Business Rules (Superseded)

Status: Superseded by `02-BusinessRules.md` on 2026-07-18.

## BR-001 - Product must be active

### Description

A configuration can only be created for an active product.

### Validation

The selected product must have IsActive equal to true.

### Error message

The selected product is not available.

### Status

Approved.

---

## BR-002 - Required option groups

### Description

Every required option group must contain one selected option.

### Required groups

- Desktop Size
- Desktop Finish
- Leg Type

### Error message

All required product options must be selected.

### Status

Approved.

---

## BR-003 - Single-selection groups

### Description

Only one option can be selected from a single-selection option group.

### Applicable groups

- Desktop Size
- Desktop Finish
- Leg Type
- Drawer Position

### Error message

Only one option can be selected for this option group.

### Status

Approved.

---

## BR-004 - Multiple-selection groups

### Description

Multiple options can be selected from a multiple-selection option group.

### Applicable groups

- Accessories

### Status

Approved.

---

## BR-005 - Option ownership

### Description

Every selected option must belong to the configured product.

### Validation

The API must reject options belonging to another product.

### Error message

One or more selected options are invalid.

### Status

Approved.

---

## BR-006 - Active options

### Description

Only active product options can be selected.

### Error message

One or more selected options are not available.

### Status

Approved.

---

## BR-007 - Estimated price

### Description

The estimated price is calculated using the product base price and the price adjustment of every selected option.

### Formula

Estimated price =
Product base price
+ Selected option price adjustments

### Status

Approved.

---

## BR-008 - Server-side price calculation

### Description

The API must calculate the final estimated price using database values.

### Reason

The price received from Unity cannot be trusted.

### Status

Approved.

---

## BR-009 - Configuration snapshot

### Description

A saved configuration must preserve the selected option names and prices that existed when it was created.

### Reason

Future product price changes must not modify historical configurations.

### Status

Approved.

---

## BR-010 - Unique configuration code

### Description

Every saved configuration must receive a unique public code.

### Example

NCF-8A72F1

### Error message

The configuration could not be saved.

### Status

Approved.

---

## BR-011 - Drawer position

### Description

A configuration cannot contain both a left drawer and a right drawer.

### Validation

Drawer Position is a single-selection group.

### Error message

Only one drawer position can be selected.

### Status

Approved.

---

## BR-012 - Quote request

### Description

A quote request must be associated with an existing saved configuration.

### Error message

The selected configuration does not exist.

### Status

Approved.

## Product Validation Scenarios

## SC-001 - Default configuration

Given the default product options  
When the estimated price is calculated  
Then the result must be 299.90 EUR.

## SC-002 - Missing required option

Given a configuration without a leg type  
When the configuration is validated  
Then the configuration must be rejected.

## SC-003 - Multiple finishes

Given a configuration with White and Oak finishes  
When the configuration is validated  
Then the configuration must be rejected.

## SC-004 - Invalid electric standing combination

Given SIZE_120_60 and LEG_ELECTRIC_STANDING  
When the configuration is validated  
Then the configuration must be rejected.

## SC-005 - Valid electric standing combination

Given SIZE_160_80 and LEG_ELECTRIC_STANDING  
When the configuration is validated  
Then the configuration must be accepted.

## SC-006 - Multiple accessories

Given Cable Tray, RGB Lighting and Headphone Holder  
When the configuration is validated  
Then all three accessories must be accepted.

## SC-007 - Invalid product option

Given an option that does not belong to DESK-001  
When the configuration is validated  
Then the configuration must be rejected.

## SC-008 - Modified client price

Given a client request containing a manipulated price  
When the configuration is saved  
Then the API must ignore the client price and recalculate it.
