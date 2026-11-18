# Ikariam · Painel Imperial Helênico — Project Map

Compact architectural reference for fast onboarding. Keep UI copy in **PT-BR**; keep this doc concise to minimize token overhead.

## 1. Stack & Core Config

- **Runtime**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`)
- **PWA**: `vite-plugin-pwa` (`registerType: 'autoUpdate'`, Workbox precache max 5 MiB, shortcuts for `?tab=edificios|recursos|vikings|militar`)
- **Cloud Sync**: Firebase v13 Firestore (`myikariamlog21`, collection `imperial_saves`, doc `dados_imperiais`) + `localStorage` offline cache
- **Icons / Audio**: `lucide-react`, native Web Audio API synth, Web Speech API (`pt-BR`), Service Worker Notification API

## 2. Domain Invariants (Do Not Break)

- **Fleet capacity**: `230` merchant ships (`600` cap each) + `28` freighters (`52.000` cap each) = `1.594.000` (`1,59M`)
- **Default global gold**: `81.530.000` (`81,53M`, stored at `ikariam_ouro_global`)
- **Cities**: 12 defaults (`SPYC` capital + 11 colonies) in `INITIAL_CITIES`; users can add more via `addCity`
- **Units order & naming**: Follow `UNIT_CATALOG` / `SELECTOR_UNIT_ORDER`; land ram is `Aríete` in group `artilharia` (never `frente`)
- **Formatting**: Coords masked as `XX:YY` (`formatCoordMask`), numeric inputs formatted with dots (`2.000`), top ticker uses compact `M`/`k` (`formatCompactResource`) with warehouse fill bars (no raw max totals in top bar)
- **Dual Theme**: Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));` toggled via `.dark` on `<html>`; CSS vars in `src/index.css` (`--bg-canvas`, `--bg-surface`, `--text-primary`)

## 3. High-Level Architecture

```text
index.html ─► src/main.tsx (SW registerSW) ─► src/App.tsx (Swipe + Scroll Anchor + 10-View Router)
                                                  │
                       ┌──────────────────────────┼──────────────────────────┐
                       ▼                          ▼                          ▼
             src/context/ImperialContext.tsx   Shell UI (components/)     10 Feature Views (views/)
             • Global state + LS hydration     • Header + ResourceTicker  • OverviewView (inicio)
             • 1s live tick (prod + timers)    • DesktopTabNav (all widths)• EdificiosView
             • Firestore debounce sync (1.5s)  • MobileBottomNav (Menu ctr)• RecursosView / MilitarView
             • Notifications + Audio triggers  • Modals (4 modals)        • Vikings / Simulador / Pirataria
                       │                       • CollapsiblePanel         • Espionagem / Calc. / Notas
                       ▼
        src/data/gameData.ts · src/utils/calculations.ts · src/services/{firebase,audio,notification}Service.ts
```

## 4. File Inventory & Roles (~8.6k LOC total)

| Path | LOC | Role & Key Exports |
| :--- | :---: | :--- |
| `vite.config.ts` | 129 | Vite + `VitePWA` manifest, icons, shortcuts, Workbox, port `3000` |
| `src/index.css` | 175 | Tailwind v4 import, `@custom-variant dark`, theme CSS vars, `.animate-tab-*`, `.no-scrollbar` |
| `src/main.tsx` | 15 | App boot + `registerSW({ immediate: true })` |
| `src/App.tsx` | 227 | `ImperialShell`: smart scroll-to-tab-anchor, 4-tab finger swipe, mobile accordion bar, 10-view switch |
| `src/types/ikariam.ts` | 155 | All TS interfaces & unions (`TabId`, `City`, `CityResources`, `BuildQueueItem`, `ArmyUnit`, etc.) |
| `src/data/gameData.ts` | 368 | Static catalogs (`INITIAL_CITIES`, `UNIT_CATALOG`, `BUILDING_LIST`, `MIRACLES`, `PIRATE_RAIDS`, defaults) |
| `src/context/ImperialContext.tsx` | 1053 | Central provider: state, 1s tick engine, Firestore sync, alarms, modals, `useImperial` |
| `src/firebase.ts` | 12 | `firebaseConfig` object (`myikariamlog21`) |
| `firestore.rules` | 14 | Firestore security rules for `imperial_saves` |
| `src/services/firebaseService.ts` | 76 | `collectImperialLocalStorage`, `saveImperialDataToFirebase`, `loadImperialDataFromFirebase` |
| `src/services/audioService.ts` | 151 | Web Audio synths (`playWarHorn`, `playWarDrums`, `playAlertBell`, `playGoldCoins`, `playStoneClick`) + TTS |
| `src/services/notificationService.ts` | 49 | `getNotificationPermission`, `requestSystemNotificationPermission`, `sendSystemNotification` |
| `src/utils/formatters.ts` | 73 | `formatNumberDots`, `parseCleanNumber`, `formatCompactResource`, `formatCoordMask`, `formatCountdown` |
| `src/utils/calculations.ts` | 437 | Pure game math: wine urgency, Vikings, travel time, port load, supply route, wall siege, battle slots |
| `src/utils/contextHelpers.ts` | 10 | Audio wrapper helpers (`playClickWrapper`, `playConfiguredAlarmSafe`) |
| `src/hooks/usePWAInstall.ts` | 59 | `beforeinstallprompt` + iOS install detection |
| `src/hooks/useOnlineStatus.ts` | 22 | `navigator.onLine` reactive hook |
| `src/components/Header.tsx` | 294 | Brand, clock, city picker, utility buttons (Cloud, Install, Alerts, Audio, Theme), 4 advisors |
| `src/components/ResourceTicker.tsx` | 174 | City/Empire toggleable top ticker (5 resources in `M` + fill bars, gold, fleet, free citizens) |
| `src/components/DesktopTabNav.tsx` | 111 | Responsive horizontal scrollable tab strip (visible mobile + desktop), auto-centers active tab |
| `src/components/MobileBottomNav.tsx` | 239 | Fixed bottom thumb bar (`Início`, `Edifícios`, centered `Menu` drawer, `Recursos`, `Militar`) |
| `src/components/CollapsiblePanel.tsx` | 87 | Mobile/desktop accordion wrapper responding to `accordionSignal` |
| `src/components/Modals.tsx` | 565 | 4 modals: New City, 12-City Panorama, 4 Advisors, Soundboard & Live Engine config |
| `src/components/HudAlertBanner.tsx` | 31 | Top floating alert toast (`hudAlert`) |
| `src/components/OfflineIndicator.tsx` | 16 | Offline status banner |
| `src/components/PWAInstallButton.tsx` | 72 | Install CTA + iOS Safari tip |
| `src/views/OverviewView.tsx` | 425 | `inicio` tab: notification nudge, 4 KPIs, wine urgencies, upcoming builds, active timers |
| `src/views/EdificiosView.tsx` | 415 | `edificios` tab: live building queue countdowns + building resource goals (`metas`) & fleet calc |
| `src/views/RecursosView.tsx` | 339 | `recursos` tab: 5-resource editor per city, warehouse diagnosis, Tavern/wine calc, wine urgency ranking |
| `src/views/MilitarView.tsx` | 678 | `militar` tab: war timers, garrison CRUD (exact order), BBCode export, battle guide, naval radar |
| `src/views/VikingsView.tsx` | 261 | `vikings` tab: barbarian level per city/coord (`1–50`), loot, ships, troops, sea-chart reduction, +5 preview |
| `src/views/SimuladorView.tsx` | 548 | `simulador` tab: land/naval slot grid, cooks/moral calc, net gold upkeep, wall siege, staggered wave planner |
| `src/views/PiratariaView.tsx` | 205 | `pirataria` tab: 8 raid launchers (`2.5m`–`8h`) + fortress raid victory probability |
| `src/views/EspionagemView.tsx` | 214 | `espionagem` tab: target CRUD, 20% loot capacity calc, one-click route prefill |
| `src/views/CalculadorasView.tsx` | 568 | `calculadoras` tab: travel time, loot/port load, inter-city supply route, cost reducer (`-32%`), 8 miracles |
| `src/views/NotasBackupView.tsx` | 261 | `notas` tab: tactical templates, Discord/BBCode copy, Firebase manual sync, JSON import/export, reset |

## 5. Persistence Contract (`localStorage` + Firestore)

- **Firestore Document**: `imperial_saves/dados_imperiais` stores `{ payloadJson: string, totalChaves, atualizadoEm, atualizadoEmTexto, origem }`.
- **Collected Keys (`ikariam_*`)**:
  - Cities & active selection: `ikariam_cidades_v2`, `ikariam_cidade_ativa`
  - Per-city dynamic keys: `ikariam_res_<cityId>`, `ikariam_exercito_<cityId>`, `ikariam_viking_lvl_<cityId>`
  - Queues & planners: `ikariam_obras_v2`, `ikariam_metas_v2`, `ikariam_timers`, `ikariam_missoes_radar`, `ikariam_alvos_espiao`
  - Global empire & prefs: `ikariam_taberna`, `ikariam_pesq`, `ikariam_ouro_global`, `ikariam_notas`, `ikariam_tema`, `ikariam_audio_muted`, `ikariam_som_pref`, `ikariam_voz_pref`, `ikariam_live_prod_active`, `ikariam_autosync_firebase`, `ikariam_ultimo_sync_firebase`
- **Cross-View Prefill Flow**: `OverviewView`, `EdificiosView`, and `EspionagemView` call `triggerPrefillRoute(...)` -> sets `prefillRoute` and switches `activeTab` to `'calculadoras'` -> `CalculadorasView` consumes it via `useEffect`.
