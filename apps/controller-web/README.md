# Controller web

The supported TanStack Start/Vite entry is at the repository root: `src/routes`, `src/components`, `src/styles.css`. Run `bun install` and `bun run dev` from the root. This directory documents the monorepo app boundary rather than duplicating the running web app or introducing a second router.

`gameplay-entry.tsx` is a separate no-routing React entry for the native companion's local HTTP controller. It reuses the existing Gamepad, BridgeProvider and all shared protocol/input/transport code. Bundle it with `bun build apps/controller-web/gameplay-entry.tsx --target browser --minify --outfile native/linux-companion/web/gameplay.js`, then compile Rust. Its CSS reuses the controller design tokens/styles; the companion embeds all assets for offline operation.
