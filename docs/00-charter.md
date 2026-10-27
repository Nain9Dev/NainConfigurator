# Project Charter — NainConfigurator

## 1. Problem Statement

Manufacturers selling highly customizable B2B products typically build bespoke configurator software per client or per product family. Every new account introduces customer-specific database columns, custom API endpoints, and dedicated deployment forks. As a result, software maintenance costs scale linearly with sales volume.

NainConfigurator delivers a single, catalog-driven configuration engine where option groups, selection limits, compatibility constraints, pricing formulas, and visual scene definitions are treated as rows in a unified database schema. Unrelated products—such as modular office furniture and urban commuter bicycles—share a single API contract, a single rendering engine, and a single deployment pipeline.

## 2. Core Architectural Objectives

1. **Schema Unification**: Support arbitrary configurable products without schema migrations, custom columns, or application recompilation.
2. **Deterministic Authoritative Pricing**: Calculate and validate all configuration prices authoritatively on the server; client-side estimations are for visual feedback only.
3. **Clean Architecture Isolation**: Pure domain evaluation logic (`ConfigurationEvaluator`) is fully isolated from SQL Server persistence and HTTP presentation layers, continuously guarded by `NetArchTest`.
4. **Zero-Cost Public Demonstration**: Enable complete in-browser demonstration execution against a bundled synthetic catalog (`web/public/offline-catalog.json`), requiring zero paid backend infrastructure (0.00 EUR recurring cost).

## 3. Scope Boundaries

- **In Scope**:
  - Pure domain evaluation engine in `NainConfigurator.Domain`.
  - Application orchestration and public contracts in `NainConfigurator.Application`.
  - Multi-tenant enterprise persistence with SQL Server 2025 in `NainConfigurator.Infrastructure`.
  - Public minimal API and static client host in `NainConfigurator.PublicHost`.
  - Automated architecture fitness functions in `NainConfigurator.Architecture.Tests`.
  - Accessible, responsive React 19 + TypeScript web application in `web/`.
- **Out of Scope**:
  - Live enterprise ERP synchronization during demo mode.
  - Payment processing and external payment gateway credentials.
