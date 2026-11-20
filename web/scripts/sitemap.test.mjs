import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest runs from `web/`, the directory that holds `package.json`.
const sitemap = readFileSync(resolve("public", "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);

// GitHub Pages answers every path it does not own with a 404, and the app
// resolves its routes in the browser. A sitemap entry other than the entry
// point therefore reaches search engines as a 404 (SPEC-003).
describe("sitemap.xml", () => {
  it("lists only the entry point of the demo", () => {
    expect(locs).toEqual(["https://configurator.naindev.com/"]);
  });

  it("lists no client-side route", () => {
    expect(locs.filter((loc) => loc.includes("/configure/"))).toEqual([]);
  });
});
