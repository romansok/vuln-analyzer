// Tiny utilities shared across components.

/** Conditionally join class names. Falsy entries are dropped. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** GitHub repo URL — single source of truth so we never hand-type it twice. */
export const GH_REPO = "https://github.com/romansok/vuln-analyzer";
export const GH_README = `${GH_REPO}/blob/main/README.md`;
export const GH_INSTALL_DOC = `${GH_REPO}/blob/main/INSTALL.md`;
export const GH_INSTALL_SH = `${GH_REPO}/blob/main/install.sh`;
export const GH_LICENSE = `${GH_REPO}/blob/main/LICENSE`;
export const GH_RELEASES = `${GH_REPO}/releases`;
export const GRYPE_MCP = "https://github.com/romansok/grype-mcp";
