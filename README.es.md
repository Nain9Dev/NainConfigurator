<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/banner-light.svg">
  <img src="docs/assets/banner-dark.svg" alt="NainConfigurator - Configurador de Producto B2B Basado en Catálogo" width="100%">
</picture>

<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=flat-square)](README.md)
[![Español](https://img.shields.io/badge/Idioma-Espa%C3%B1ol-emerald?style=flat-square)](README.es.md)
[![Architecture Tests](https://img.shields.io/badge/Architecture%20Tests-NetArchTest%20enforced-80FF00?style=flat-square&logo=checkmarx&logoColor=black)](backend/tests/NainConfigurator.Architecture.Tests/CleanArchitectureFitnessTests.cs)
[![Live Demo](https://img.shields.io/badge/Demo%20Online-configurator.naindev.com-38bdf8?style=flat-square&logo=googlechrome&logoColor=white)](https://configurator.naindev.com/)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-83%20passing-80FF00?style=flat-square&logo=vitest&logoColor=white)](web)
[![Journeys](https://img.shields.io/badge/E2E-20%20cross--browser%20journeys-80FF00?style=flat-square&logo=playwright&logoColor=white)](web/e2e)
[![WCAG](https://img.shields.io/badge/WCAG%202.2-AA%20gated%20by%20axe-80FF00?style=flat-square&logo=accessibleicon&logoColor=white)](web/e2e)
[![License](https://img.shields.io/badge/License-AGPL--3.0--or--later-38bdf8?style=flat-square)](LICENSE)

</div>

**Demo online:** [configurator.naindev.com](https://configurator.naindev.com/) — todo el configurador se ejecuta en el navegador contra un catálogo sintético empaquetado. Sin backend externo, sin base de datos obligatoria para la demo, sin recursos en la nube facturables: 0,00 € de coste recurrente.

NainConfigurator es un configurador de producto B2B basado en catálogo, diseñado para admitir productos fundamentalmente distintos sin requerir código específico por cliente, nuevos contratos de API, columnas de base de datos adicionales o bifurcaciones de despliegue.

---

## El problema que resuelve

Un fabricante que comercializa productos configurables suele terminar manteniendo un configurador por cada cliente. Cada nueva cuenta añade columnas, endpoints y un despliegue propio, de modo que el coste de mantenimiento escala con cada venta.

Aquí, el producto son filas. Los grupos de opciones, los límites de selección, las reglas de compatibilidad, los precios **y la escena visual que el comprador contempla** son datos de catálogo. La demo incluye dos productos sin relación —un escritorio modular y una bicicleta urbana— que comparten el mismo esquema, el mismo contrato público, el mismo renderizador y la misma versión de publicación.

| Patrón habitual | Este motor |
|---|---|
| Una columna por propiedad de cliente | Productos, opciones y reglas son filas |
| Un endpoint por producto | Un contrato público único para cualquier producto |
| Una rama y un despliegue por marca | Un único despliegue, aislado por empresa |
| Precio reimplementado en cliente y servidor | El servidor recalcula el precio de forma autoritativa antes de persistir |
| Un componente de previsualización por producto | Un renderizador universal que interpreta un paquete visual publicado |

---

## Estructura de la Solución y Clean Architecture

Organizado en capas estrictas verificadas automáticamente mediante `NetArchTest`:

- **`NainConfigurator.Domain`**: Modelo de catálogo puro (`CatalogModel`), evaluación determinista de combinaciones y reglas de negocio sin dependencias externas.
- **`NainConfigurator.Application`**: Casos de uso de configuración pública, canonicalización de estado visual y contratos de persistencia.
- **`NainConfigurator.Infrastructure`**: Adaptadores de persistencia con soporte para aislamiento por empresa (SQL Server 2025 / EF Core).
- **`NainConfigurator.PublicHost`**: API REST pública y servidor estático del cliente web.
- **`NainConfigurator.Architecture.Tests`**: Pruebas de aptitud arquitectónica que verifican el aislamiento de capas.
- **`web/`**: Cliente interactivo en React 19 + TypeScript accesible (WCAG 2.2 AA).

---

## Desarrollo Local y Pruebas

```bash
# Ejecutar pruebas de arquitectura
dotnet test backend/tests/NainConfigurator.Architecture.Tests/NainConfigurator.Architecture.Tests.csproj

# Ejecutar pruebas de dominio
dotnet test backend/tests/NainConfigurator.Domain.Tests/NainConfigurator.Domain.Tests.csproj

# Pruebas del cliente frontend
cd web
npm test
```
