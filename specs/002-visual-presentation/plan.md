# SPEC-002 — Plan

## Layout

### Home

```
┌──────────────────────────────────────────────────────────────┐
│ headline · one sentence · [Probar el configurador]  │ scene  │
│                                                     │ (drag) │
│                                                     │ ◉ ○    │
├──────────────────────────────────────────────────────────────┤
│ 4 fact tiles (big number, two words)                          │
├──────────────────────────────────────────────────────────────┤
│ scenario card (scene, name, 3 chips, CTA) × N                 │
├──────────────────────────────────────────────────────────────┤
│ 3 steps: Catálogo → Dominio → Shell (icon, title, one line)   │
└──────────────────────────────────────────────────────────────┘
```

The hero scene is the first scenario's default configuration, rendered by the
same `Stage` the configurator uses, with a scenario switcher beneath it. Both
the hero and the cards load their catalog through `getProduct`, so nothing on
the home page is a screenshot that can drift.

### Configurator

```
┌ back · company · product name ──────────────── [copiar enlace] ┐
├──────────────────────────────┬─────────────────────────────────┤
│                              │ group name          constraint  │
│   scene (sticky, ≥ 50 %)     │ [tile] [tile] [tile]            │
│   hint · reset               │ group name                      │
│   caption                    │ [tile] [tile]                   │
│                              │ …                               │
│                              │ rule notice · results           │
├──────────────────────────────┴─────────────────────────────────┤
│ dock: estimate  delta  disclaimer      [Validar] [Guardar]     │
└────────────────────────────────────────────────────────────────┘
```

Document order stays preview → controls → actions, as the narrow layout needs.
The dock is `position: sticky; bottom: 0` inside the page, so it is in the
flow for assistive technology and pinned for sighted users.

### Saved configuration

Same tokens, lighter touch: a receipt-style summary beside the quote form,
with the frozen estimate as the header's focal point.

## Swatches

`web/src/visual/swatches.ts` exports one pure function:

```ts
swatchColorsFor(pack: VisualPack | null, key: string | null): string[]
```

It walks `pack.slots`, collects every `when` entry whose `key` matches, and
maps each to `pack.materials[entry.material].color`. Nothing else in the pack
is read. `OptionGroups` receives the pack from `ConfiguratorPage` (already
loaded for the stage) and renders a swatch when the list is non-empty.

## Files

| File                                       | Change                                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| `web/src/styles.css`                       | Rewritten: same tokens, new layout and components          |
| `web/src/pages/HomePage.tsx`               | Hero with scene, fact tiles, image-first cards, step strip |
| `web/src/pages/ConfiguratorPage.tsx`       | Studio layout, dock, share in the top bar                  |
| `web/src/components/OptionGroups.tsx`      | Tiles with swatches; takes `pack`                          |
| `web/src/components/ProductVisual.tsx`     | Scene card without heading prose                           |
| `web/src/visual/swatches.ts` (+ test)      | Swatch derivation                                          |
| `web/src/pages/SavedConfigurationPage.tsx` | Receipt layout                                             |
| `web/public/demo-scenarios.json`           | One-line descriptions                                      |

## Strings the journeys assert on (kept verbatim)

- h1 matching `/Un motor\..*Cualquier producto\./s`
- Two links named `Abrir configurador`
- `Modo offline · estimación no autoritativa`, `Technical Demo`
- `Restablecer vista`, `Validar selección`, `Guardar configuración`
- `La escena se interpreta desde el catálogo. Su estado nunca altera reglas ni precio.`
- `Selección válida:`, table caption `Desglose devuelto por la API`
- `Ver configuración y solicitar presupuesto`, `Configuración guardada`
- Quote form labels and `Registrar solicitud`, `Solicitud registrada`
