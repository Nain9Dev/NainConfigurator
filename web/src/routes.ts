/**
 * Routing with no router dependency.
 *
 * The shell has three screens and navigates with real links, so the platform
 * already does the work: full page loads, working back button, shareable URLs
 * and no history state to keep in sync.
 *
 * `BASE_URL` is honoured so the same build serves from `/` behind the ASP.NET
 * Core host and from `/<repo>/` on a static host such as GitHub Pages.
 */

export type AppRoute =
  | { type: "home" }
  | {
      type: "configure";
      companySlug: string;
      productCode: string;
      selectedOptionCodes: string[];
    }
  | { type: "configuration"; configurationCode: string }
  | { type: "notFound" };

const BASE_PATH = normalizeBase(import.meta.env.BASE_URL);

export function parseRoute(location: Location): AppRoute {
  const segments = stripBase(location.pathname).split("/").filter(Boolean);

  if (segments.length === 0) {
    return { type: "home" };
  }

  if (segments.length === 3 && segments[0] === "configure") {
    return {
      type: "configure",
      companySlug: decodeURIComponent(segments[1] ?? ""),
      productCode: decodeURIComponent(segments[2] ?? ""),
      selectedOptionCodes: new URLSearchParams(location.search).getAll(
        "option",
      ),
    };
  }

  if (segments.length === 2 && segments[0] === "configurations") {
    return {
      type: "configuration",
      configurationCode: decodeURIComponent(segments[1] ?? ""),
    };
  }

  return { type: "notFound" };
}

/** Resolves a file served from `public/` against the deployment base. */
export function asset(fileName: string): string {
  return `${BASE_PATH}/${fileName}`.replace(/\/{2,}/g, "/");
}

/** Prefixes an application path with the deployment base. */
export function href(path: string): string {
  const suffix = path.startsWith("/") ? path.slice(1) : path;

  return `${BASE_PATH}/${suffix}`.replace(/\/{2,}/g, "/");
}

function stripBase(pathname: string): string {
  if (BASE_PATH.length > 0 && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length);
  }

  return pathname;
}

/** Turns "/", "/repo/" or undefined into "" or "/repo". */
function normalizeBase(base: string | undefined): string {
  if (base === undefined || base === "/" || base === "") {
    return "";
  }

  return base.endsWith("/") ? base.slice(0, -1) : base;
}
