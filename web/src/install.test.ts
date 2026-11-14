import { describe, expect, it } from "vitest";

import html from "../index.html?raw";
import manifestJson from "../public/manifest.webmanifest?raw";

// Vite inlines each PNG as a base64 data URL; no Node typings are needed.
const pngs = import.meta.glob<string>("../public/icons/*.png", {
  query: "?inline",
  import: "default",
  eager: true,
});

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

const manifest = JSON.parse(manifestJson) as Record<string, unknown> & {
  icons: ManifestIcon[];
};

function pngBytes(path: string): Uint8Array {
  const dataUrl = pngs[`../public${path}`];
  expect(dataUrl, `${path} must exist`).toBeDefined();
  return Uint8Array.from(atob(dataUrl!.split(",")[1] ?? ""), (c) =>
    c.charCodeAt(0),
  );
}

/** Width and height declared in the IHDR chunk of a PNG file. */
function pngSize(file: Uint8Array): string {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  expect(String.fromCharCode(...file.subarray(1, 4))).toBe("PNG");
  return `${view.getUint32(16)}x${view.getUint32(20)}`;
}

function metaContent(name: string): string[] {
  const pattern = new RegExp(
    `<meta\\s+name="${name}"\\s+content="([^"]*)"`,
    "gs",
  );
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function linkHrefs(rel: string): string[] {
  const pattern = new RegExp(`<link\\s+rel="${rel}"\\s+href="([^"]*)"`, "g");
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

describe("installable site (REQ-CFG-012)", () => {
  it("names the app and opens it standalone from the root", () => {
    expect(manifest.name).toBe("NainConfigurator");
    expect(manifest.short_name).toBe("NainConfig");
    expect(manifest.description).toBe(metaContent("description")[0]);
    expect(manifest.lang).toBe("es");
    expect(manifest.dir).toBe("ltr");
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#f2f0e9");
    expect(manifest.background_color).toBe("#f2f0e9");
    expect(manifest).not.toHaveProperty("prefer_related_applications");
  });

  it("declares 192 and 512 px icons plus a maskable one, each at its real size", () => {
    expect(manifest.icons).toEqual([
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
    for (const icon of manifest.icons) {
      expect(pngSize(pngBytes(icon.src))).toBe(icon.sizes);
    }
    expect(pngSize(pngBytes("/icons/apple-touch-icon.png"))).toBe("180x180");
  });

  it("links the manifest and carries the iOS tags in the served document", () => {
    expect(linkHrefs("manifest")).toEqual(["/manifest.webmanifest"]);
    expect(linkHrefs("apple-touch-icon")).toEqual([
      "/icons/apple-touch-icon.png",
    ]);
    expect(metaContent("mobile-web-app-capable")).toEqual(["yes"]);
    expect(metaContent("apple-mobile-web-app-capable")).toEqual(["yes"]);
    expect(metaContent("apple-mobile-web-app-title")).toEqual([
      manifest.short_name,
    ]);
    expect(metaContent("apple-mobile-web-app-status-bar-style")).toEqual([
      "default",
    ]);
  });
});
