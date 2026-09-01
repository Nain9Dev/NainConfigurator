## What changed

<!-- One paragraph. What does this do, and why is it needed? -->

## How it was verified

<!-- Commands you ran and what they produced. "It builds" is not verification. -->

- [ ] `dotnet format --verify-no-changes`, `dotnet build -c Release` and `dotnet test -c Release` pass
- [ ] `npm run format:check`, `npm run build` and `npm test` pass in `web/`
- [ ] New or changed behaviour is covered by a test
- [ ] Interactive changes were checked with the keyboard only, and `npm run test:e2e:offline` passes

## Boundaries

- [ ] No product-specific field, branch or fork was introduced — the change works from catalog data
- [ ] Layer dependencies are unchanged: `Domain ← Application ← Infrastructure ← Hosts`
- [ ] Validation and pricing remain server-authoritative
- [ ] No credentials, personal data, real customer data or production export is included
- [ ] New dependencies are recorded in `eng/third-party/approved-direct-dependencies.json` with their licence

## Related

<!-- Closes #123 -->
