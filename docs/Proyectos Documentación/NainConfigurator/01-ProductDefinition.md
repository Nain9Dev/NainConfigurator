# Product Definition

Document version: 2.1  
Status: Approved for MVP implementation  
Last updated: 2026-07-18  
Scope: Product-specific catalog values for `DESK-001`; business behavior is defined in `02-BusinessRules.md`.
Public content locale: `es-ES`

## Product

Escritorio gaming modular

## Product code

DESK-001

## Description

Un escritorio modular configurable mediante una experiencia 3D en la web.

The room is only a visual environment. The configurable commercial product is the desk.

## Currency

EUR

## Base price

299.90 EUR

## Price presentation

Estimated retail price with taxes included. Shipping and installation are excluded.

Price disclaimer: `Precio estimado. El precio final puede requerir confirmación comercial.`

## Default configuration

- Tamaño del tablero: 120 × 60 cm
- Acabado del tablero: Blanco
- Tipo de patas: Metálicas estándar
- Posición de la cajonera: Sin cajonera
- Accesorios: Ninguno

## Default configuration price

299.90 EUR

## Published catalog state

- Catalog version: 1
- Active: Yes
- Published: Yes
- Product visual asset key: Product_Desk_001

All option groups, options and compatibility rules listed below are active in the approved MVP catalog.

## Option Group: Tamaño del tablero

Code: DESKTOP_SIZE  
minSelections: 1  
maxSelections: 1  
Sort order: 1

| Code | Name | Price adjustment | Default | Visual asset key | Sort order |
|---|---|---:|---|---|---:|
| SIZE_120_60 | 120 × 60 cm | 0.00 | Yes | DeskTop_120_60 | 1 |
| SIZE_140_70 | 140 × 70 cm | 40.00 | No | DeskTop_140_70 | 2 |
| SIZE_160_80 | 160 × 80 cm | 80.00 | No | DeskTop_160_80 | 3 |

## Option Group: Acabado del tablero

Code: DESKTOP_FINISH  
minSelections: 1  
maxSelections: 1  
Sort order: 2

| Code | Name | Price adjustment | Default | Visual asset key | Sort order |
|---|---|---:|---|---|---:|
| FINISH_WHITE | Blanco | 0.00 | Yes | Material_Desk_White | 1 |
| FINISH_BLACK | Negro | 10.00 | No | Material_Desk_Black | 2 |
| FINISH_OAK | Roble | 35.00 | No | Material_Desk_Oak | 3 |
| FINISH_DARK_WALNUT | Nogal oscuro | 45.00 | No | Material_Desk_DarkWalnut | 4 |

## Option Group: Tipo de patas

Code: LEG_TYPE  
minSelections: 1  
maxSelections: 1  
Sort order: 3

| Code | Name | Price adjustment | Default | Visual asset key | Sort order |
|---|---|---:|---|---|---:|
| LEG_STANDARD_METAL | Metálicas estándar | 0.00 | Yes | Legs_StandardMetal | 1 |
| LEG_PREMIUM_METAL | Metálicas premium | 60.00 | No | Legs_PremiumMetal | 2 |
| LEG_ELECTRIC_STANDING | Elevables eléctricas | 220.00 | No | Legs_ElectricStanding | 3 |

## Option Group: Posición de la cajonera

Code: DRAWER_POSITION  
minSelections: 1  
maxSelections: 1  
Sort order: 4

| Code | Name | Price adjustment | Default | Visual asset key | Sort order |
|---|---|---:|---|---|---:|
| DRAWER_NONE | Sin cajonera | 0.00 | Yes | null | 1 |
| DRAWER_LEFT | Cajonera izquierda | 70.00 | No | Drawer_Left | 2 |
| DRAWER_RIGHT | Cajonera derecha | 70.00 | No | Drawer_Right | 3 |

## Option Group: Accesorios

Code: ACCESSORIES  
minSelections: 0  
maxSelections: null  
Sort order: 5

| Code | Name | Price adjustment | Default | Visual asset key | Sort order |
|---|---|---:|---|---|---:|
| ACCESSORY_MONITOR_STAND | Soporte para monitor | 35.00 | No | Accessory_MonitorStand | 1 |
| ACCESSORY_CABLE_TRAY | Bandeja para cables | 25.00 | No | Accessory_CableTray | 2 |
| ACCESSORY_RGB_LIGHTING | Iluminación RGB | 30.00 | No | Accessory_RgbLighting | 3 |
| ACCESSORY_HEADPHONE_HOLDER | Soporte para auriculares | 15.00 | No | Accessory_HeadphoneHolder | 4 |

## Compatibility rule catalog data

| Code | Type | Source option codes | Target option codes | Message | Active |
|---|---|---|---|---|---|
| RULE-001 | RequiresAny | LEG_ELECTRIC_STANDING | SIZE_140_70, SIZE_160_80 | Las patas elevables eléctricas requieren un tablero de al menos 140 x 70 cm. | Yes |

## Configuración predeterminada

```
Base price:                  299.90
SIZE_120_60:                  0.00
FINISH_WHITE:                 0.00
LEG_STANDARD_METAL:           0.00
DRAWER_NONE:                  0.00
Accessories:                  0.00
----------------------------------
Estimated price:            299.90 EUR
```

## Configuración intermedia

```
Base price:                  299.90
SIZE_140_70:                 40.00
FINISH_OAK:                  35.00
LEG_PREMIUM_METAL:           60.00
DRAWER_LEFT:                 70.00
ACCESSORY_CABLE_TRAY:        25.00
----------------------------------
Estimated price:            529.90 EUR
```

## Configuración completa

```
Base price:                         299.90
SIZE_160_80:                         80.00
FINISH_DARK_WALNUT:                  45.00
LEG_ELECTRIC_STANDING:              220.00
DRAWER_RIGHT:                        70.00
ACCESSORY_MONITOR_STAND:             35.00
ACCESSORY_CABLE_TRAY:                25.00
ACCESSORY_RGB_LIGHTING:              30.00
ACCESSORY_HEADPHONE_HOLDER:          15.00
-----------------------------------------
Estimated price:                   819.90 EUR
```
