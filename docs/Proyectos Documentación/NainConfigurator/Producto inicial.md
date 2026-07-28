# Initial Product Notes (Historical)

Status: Superseded by `00-ProjectOverview.md`, `01-ProductDefinition.md` and `02-BusinessRules.md`.

This file is retained only as the original product exploration. It is not authoritative for implementation.

---

## Modular Desk Configurator

Un configurador web para personalizar un escritorio modular y solicitar presupuesto.

No configuraremos toda la habitación. La habitación será únicamente el escenario visual. El producto comercial será el escritorio.

Esto reduce el trabajo 3D y permite reutilizar después la misma base para:

- Mesas de oficina.
- Escritorios gaming.
- Muebles a medida.
- Armarios.
- Cocinas.
- Estanterías.
- Pérgolas.
- Puertas y ventanas.
- Equipamiento industrial.

La plataforma debe llamarse de forma genérica:

```
NainConfigurator
```

El primer producto dentro de la plataforma:

```
Modular Gaming Desk
```

Código:

```
DESK-001
```

Así no construimos una aplicación atada exclusivamente a escritorios. Construimos un sistema de productos configurables y usamos un escritorio como primer caso real.

## Qué configuraremos exactamente

## Opciones obligatorias

### Desktop size

```
120 × 60 cm
140 × 70 cm
160 × 80 cm
```

### Desktop finish

```
White
Black
Oak
Dark Walnut
```

### Leg type

```
Standard Metal
Premium Metal
Electric Standing
```

## Opciones opcionales

### Drawer position

```
None
Left
Right
```

### Accessories

```
Monitor Stand
Cable Tray
RGB Lighting
Headphone Holder
```

Esto es suficiente para demostrar:

- Cambio de modelos.
- Cambio de materiales.
- Activación de objetos.
- Reglas entre opciones.
- Cálculo de precios.
- Guardado.
- Recuperación.
- Integración con API.
- Solicitud de presupuesto.

## Regla importante de escalabilidad

No debemos diseñar el sistema pensando:

```
DeskColor
DeskSize
DeskLeg
DeskDrawer
```

Eso quedaría limitado a escritorios.

Debemos pensar:

```
Product
OptionGroup
Option
CompatibilityRule
Configuration
```

Ejemplo:

```
Product: Modular Gaming Desk

OptionGroup: Desktop Size
Option: 160 × 80 cm

OptionGroup: Desktop Finish
Option: Oak
```

Cuando incorporemos una cocina, la arquitectura seguirá funcionando:

```
Product: Modular Kitchen

OptionGroup: Countertop Finish
Option: White Marble
```

El producto inicial es específico, pero el modelo conceptual es genérico.
