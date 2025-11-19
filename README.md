## Design System Manager Prototype

Design System Manager (DSM) is a React + TypeScript + Vite prototype that demonstrates a complete design-token workflow: CRUD for tokens, component registry with previews, preset editing with overrides, live impact analysis, and publishing/version history — all backed by a mock API that persists data in `localStorage`.

### Key capabilities
- Token table with inline editing, inline validation, contrast grades (AA/AAA/Fail), usage drawer, and delete guards.
- Component registry with accessibility warnings, drawer editor, and preset-based previews (using scoped CSS variables).
- Preset list with duplicate/export/delete actions, dedicated editor route for global + per-component overrides, preview theme switcher, impact analysis, and publish modal with diff + accessibility report.
- Version history with download + revert (revert creates a new published snapshot).
- Integrations page that surfaces sync errors via reusable alert banners.
- Accessibility: focus-visible outlines, ARIA labels, keyboard-friendly drawers/modals, WCAG contrast indicators.

---

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

| Script | Description |
| --- | --- |
| `npm run build` | Type-check + bundle via Vite |
| `npm run test` | Vitest unit tests (resolver, impact, publish flow) |
| `npm run reset-seed` | Touches `public/reset-flag.json`. Reloading the app detects the new timestamp, clears `localStorage`, and replays the seed data |

Vite serves `public/`, so the reset flag is available via `/reset-flag.json`. On app boot we fetch the JSON; if the timestamp differs from the last seen value we call `initSeedDataIfNeeded(true)` to re-import everything.

---

## Architecture overview

```
src/
├─ App.tsx                # Routing + global nav + seeding + CSS var sync
├─ lib/
│  ├─ mockApi.ts          # localStorage-backed API with change events & snapshots
│  ├─ resolver.ts         # token validation, contrast ratios, CSS variable helpers
│  ├─ impact.ts           # computeImpact(preset, tokens, components)
│  └─ *.test.ts           # unit tests
├─ components/
│  ├─ AlertBanner.tsx
│  ├─ TokenTable.tsx / TokenUsageDrawer.tsx / TokenDrawer.tsx
│  ├─ ComponentInspectorDrawer.tsx / PreviewCanvas.tsx
│  ├─ PresetEditor.tsx + PublishModal.tsx + ImpactModal.tsx
│  └─ VersionList.tsx
├─ pages/
│  ├─ Dashboard.tsx                    # KPIs, warnings, quick actions
│  ├─ TokensPage.tsx                   # token CRUD + validation + contrast
│  ├─ ComponentsPage.tsx               # registry + accessibility editing
│  ├─ PresetsPage.tsx                  # list view (status/actions)
│  ├─ PresetEditorPage.tsx             # editor with overrides + preview
│  ├─ VersionsPage.tsx                 # publish history + revert
│  └─ IntegrationsPage.tsx             # mocked sync failure UI
└─ seed/                               # initial JSON data
```

TypeScript types live in `src/types.ts`, covering tokens, components, presets, versions, impact reports, validation issues, etc.

---

## Mock API & persistence

- Seeds (`seed/*.json`) are imported on first run via `initSeedDataIfNeeded`. The helper also dispatches `CustomEvent('dsm:change', { detail: { type, id } })` so UI screens can refresh when data changes in another tab.
- Data layout:
  - `dsm:tokens`, `dsm:components`, `dsm:presets`
  - `dsm:versions:<presetId>` arrays
  - `dsm:snapshots:<snapshotId>` payloads for download/export flows
- `publishPreset` auto-increments the patch segment (semver), stores immutable snapshots, and appends snapshot IDs to `preset.publishedVersions`.
- `revertPresetVersion` clones the selected snapshot, restores overrides, and immediately publishes a new version (fulfilling “revert creates a new published snapshot”).

---

## Token resolution & accessibility

`resolveTokens(baseTokens, preset)` returns a key→value map after applying global overrides. `resolveComponentTokens(component, resolvedTokens, preset)` applies per-component overrides. The preview canvas scopes CSS variables on a container (not `:root`) so multiple previews can coexist.

Validation rules:
- Colors: hex or any CSS-supported color (via `CSS.supports('color', value)` when available).
- Sizes & spacing: `^\d+(\.\d+)?(px|rem|em|%)$`.
- Locked tokens cannot be overridden; publish modal blocks until conflicts resolved.
- Contrast ratios (against `color.surface`) are computed via WCAG formula, producing AAA/AA/Fail chips.

---

## Feature tour

### Tokens `/tokens`
- Inline editing with optimistic inputs (persist on blur).
- “Where used” drawer lists components + presets that rely on the token.
- Delete guard warns about impacted components.
- Invalid inputs surface error badges that also disable publishing.

### Components `/components`
- Library cards show structure & accessibility status.
- Drawer editor for `a11y.description` with warnings for missing copy.
- Preview switches between presets so designers can compare themes quickly.

### Presets
- `/presets` shows status (Draft/Published), latest semver, duplicate/export/delete buttons, and links to versions.
- `/presets/:id/edit` provides:
  - Global overrides column with base value context + reset actions.
  - Component override inspector with inline editing & reset per field.
  - Preview column with dropdown (current draft, base tokens, other presets).
  - Impact analysis modal + Publish modal with diffs, counts, release notes, and validation summary.
- `/presets/:id/versions` lists versions, allows download (via `downloadSnapshot`) and revert (creates new snapshot + toast).

### Publishing workflow
1. Edit overrides (global/component).
2. Run impact analysis (manual button or automatically before publish) to inspect severity + affected components.
3. Publish modal displays token/override diffs, accessibility warnings, semantic version, and release notes.
4. Successful publish pushes to `dsm:versions:<id>` and writes a snapshot for download flows.

### Integrations
- `/integrations`: shows how failed syncs surface via `AlertBanner`, with retry button toggling state.

---

## Resetting data

1. Run `npm run reset-seed` — this updates `public/reset-flag.json` with a new timestamp.
2. Reload the running DSM tab. On boot we fetch the reset flag; if the timestamp changed we wipe `localStorage`, re-import `seed/*.json`, and reapply base CSS variables.

You can also manually clear browser storage (`localStorage` keys prefixed with `dsm:`) if needed.

---

## Testing

`npm test` runs Vitest in jsdom:
- `tokenResolution.test.ts`: ensures override merging logic.
- `impact.test.ts`: verifies `computeImpact` surfaces changed tokens + affected components.
- `publish.test.ts`: proves semantic versioning auto-bumps patch numbers on consecutive publishes.

Manual smoke checklist (recommended before showcasing):
1. **Token update flows**
   - Edit `color.primary` inline → preview on `/components` updates immediately.
   - Open “Where used” to see components + presets referencing the token.
2. **Preset editing**
   - Navigate to `/presets/brand_x/edit`.
   - Override a global token and a component token, verify live preview changes.
   - Run Impact Analysis → modal lists tokens + affected components.
3. **Publishing**
   - Publish if no validation errors → new version appears under `/presets/brand_x/versions`.
   - Download snapshot JSON and inspect contents.
4. **Revert**
   - On versions page revert to an older snapshot → confirm a new version is created and preview updates.
5. **Accessibility checks**
   - Invalid hex shows inline errors, publish button disabled with explanatory tooltip.
   - Color tokens display AA/AAA/Fail chips based on contrast vs `color.surface`.

---

## Accessibility & keyboard support

- Drawer/Modal focus management (overlay click + Escape) with `aria-modal` + labels.
- All buttons and interactive cards are focus-visible, keyboard navigable (`Enter`/`Space` handlers).
- Toasts use `aria-live="polite"` for announcements.
- Color chips include `title` tooltips for ratio details.

---

## Resetting seeds & integrations tips

- All mutations dispatch `dsm:change` so multiple tabs stay in sync.
- Integrations page demonstrates error banners; toggle the mock failure via the Retry button.
---

Happy designing!

