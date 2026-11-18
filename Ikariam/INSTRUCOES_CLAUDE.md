# Claude Credit-Saving Instructions (`INSTRUCOES_CLAUDE.md`)

Operational playbook to minimize input/output tokens when inspecting or modifying this repo. **Read this before opening source files.**

## 1. Golden Token-Saving Rules

1. **Never whole-read large files (`>250 LOC`)** unless rewriting them:
   - Always slice-read with line ranges on: `ImperialContext.tsx` (1053), `MilitarView.tsx` (678), `CalculadorasView.tsx` (568), `Modals.tsx` (565), `SimuladorView.tsx` (548), `calculations.ts` (437), `OverviewView.tsx` (425), `EdificiosView.tsx` (415), `gameData.ts` (368), `RecursosView.tsx` (339).
2. **Grep before reading**: Run 1 targeted `grep -nE` across `src/` to find exact line numbers before viewing slices.
3. **Skip noise directories/files completely**:
   - Ignore `dist/`, `dev-dist/`, `node_modules/`, `bun.lock`, `public/*.png`, `.aistudio/`.
4. **Surgical edits only**: Use targeted patch edits (`replace` / `multi_replace`) instead of rewriting full modules.
5. **Consult `MAPA_PROJETO.md` once** only when a task spans multiple modules or persistence schemas.

---

## 2. Task-to-Location Routing Matrix (Read Only What You Need)

### A. Navigation, Mobile Gestures, Scroll & Layout
| Task | Exact File & Line Slice | Key Symbols / Sections |
| :--- | :--- | :--- |
| Change swipe tabs / threshold / blocked elements | `src/App.tsx` **L20–106** | `PRIMARY_SWIPE_TABS`, `isSwipeBlockedTarget`, `handleTouchStart`, `handleTouchEnd` |
| Fix scroll position on tab switch | `src/App.tsx` **L55–68** & `src/context/ImperialContext.tsx` **L562–575** | `tabAnchorRef` `useEffect`, `setActiveTab`, `tabChangeSeq` |
| Mobile bottom bar / centered Menu / drawer icons | `src/components/MobileBottomNav.tsx` **L22–239** | `LEFT_TABS`, `RIGHT_TABS`, `MORE_TABS`, centered Menu button (**L189–215**) |
| Top horizontal tab strip (mobile + desktop) | `src/components/DesktopTabNav.tsx` **L18–111** | `DESKTOP_TABS`, `scrollContainerRef` auto-center (**L40–50**) |
| Theme tokens & tab slide animations | `src/index.css` **L5–36, L114–175** | `:root`, `.dark`, `.no-scrollbar`, `@keyframes tabSlide*` |
| Mobile accordion expand/collapse bar | `src/App.tsx` **L155–199** & `src/components/CollapsiblePanel.tsx` **L15–87** | `triggerAccordionAll`, `accordionSignal` |

### B. Real-Time Engine, State, Firebase & Alerts
| Task | Exact File & Line Slice | Key Symbols / Sections |
| :--- | :--- | :--- |
| Context API types & exports | `src/context/ImperialContext.tsx` **L117–196** | `ImperialContextValue` interface |
| LocalStorage hydration on boot/reload | `src/context/ImperialContext.tsx` **L59–115, L353–369** | `readJsonLS`, `loadAll*`, `reloadFromLocalStorage` |
| Firestore auto/manual sync & pull | `src/context/ImperialContext.tsx` **L310–429** & `src/services/firebaseService.ts` **L20–76** | `syncNowToCloud`, `scheduleCloudSync`, `pullFromCloud`, `saveImperialDataToFirebase` |
| 1s live production tick + expiration alarms | `src/context/ImperialContext.tsx` **L433–555** | `liveProdActive` resource accumulation, `timers`, `obrasFila`, `radarMissions` alerts |
| Cities, resources, army, buildings, goals CRUD | `src/context/ImperialContext.tsx` **L582–796** | `addCity`, `updateCityResource`, `updateCityArmy`, `addObra`, `addMeta`, `upsertSpyTarget` |
| Audio synths & PT-BR voice synthesis | `src/services/audioService.ts` **L21–151** | `playWarHorn`, `playConfiguredAlarm`, `speakAlertPTBR` |
| Browser/SW system notifications | `src/services/notificationService.ts` **L10–49** | `requestSystemNotificationPermission`, `sendSystemNotification` |
| PWA manifest, shortcuts, Workbox cache | `vite.config.ts` **L12–114** & `src/hooks/usePWAInstall.ts` | `VitePWA`, `shortcuts`, `maximumFileSizeToCacheInBytes`, `usePWAInstall` |

### C. Game Data, Math & Modals
| Task | Exact File & Line Slice | Key Symbols / Sections |
| :--- | :--- | :--- |
| Fleet caps, gold default, 12 initial cities | `src/data/gameData.ts` **L15–59** | `FLEET_*`, `DEFAULT_GLOBAL_GOLD`, `RESOURCE_META`, `INITIAL_CITIES` |
| Military unit catalog, order, costs, `Aríete` | `src/data/gameData.ts` **L61–160, L345–368** | `UNIT_CATALOG`, `SELECTOR_UNIT_ORDER`, `OFFICIAL_UNIT_COSTS`, `normalizeArmyList` |
| Buildings, cost reducers, pirate raids, miracles | `src/data/gameData.ts` **L162–285** | `BUILDING_LIST`, `COST_REDUCER_BUILDINGS`, `PIRATE_RAIDS`, `MIRACLES` |
| Wine urgency ranking math | `src/utils/calculations.ts` **L5–35** | `computeWineUrgencyRanking` |
| Vikings raid stats & Sea Charts reduction | `src/utils/calculations.ts` **L37–104** | `calcVikingStats` |
| Travel time, port load, supply routes, wall siege | `src/utils/calculations.ts` **L106–202** | `calcTravelTime`, `calcLootAndPort`, `calcSupplyRoute`, `calcWallSiege` |
| Battle line slot distributor (land & naval) | `src/utils/calculations.ts` **L204–437** | `buildBattleSimulation` |
| Masks, dots, `M`/`k` formatting, countdowns | `src/utils/formatters.ts` **L1–73** | `formatNumberDots`, `formatCompactResource`, `formatCoordMask`, `formatCountdown` |
| Top header, city selector, resource ticker | `src/components/Header.tsx` **L45–93** & `src/components/ResourceTicker.tsx` **L29–174** | `advisors`, `summary`, `tickerMode` |
| Modals (New City, Panorama, Advisors, Soundboard) | `src/components/Modals.tsx` | New City **L76–148** · Panorama **L149–288** · Advisors **L289–475** · Soundboard **L476–565** |

### D. Feature Views (`src/views/*`) — Section Line Map
| View | Sections & Line Ranges |
| :--- | :--- |
| `OverviewView.tsx` | Wine supply prefill helper **L47–55** · Top 4 KPIs **L79–160** · Wine Urgencies **L165–244** · Next Builds **L247–310** · Active Timers **L315–380** · Quick Actions **L382–421** |
| `EdificiosView.tsx` | Handlers **L25–64** · Building Queue (`obrasFila`) **L67–249** · Resource Goals (`metasEdificios`) + fleet needs **L252–412** |
| `RecursosView.tsx` | City resource editor (5 resources + dot inputs) **L70–177** · Warehouse & Tavern/Wine calc **L181–240** · Wine Priority Ranking **L242–335** |
| `MilitarView.tsx` | State & troop handlers **L14–166** · War Timers **L168–314** · Garrison CRUD & BBCode **L317–525** · Battle Line Guide **L529–554** · Naval Radar **L557–675** |
| `VikingsView.tsx` | Raid timer & `+1` handlers **L18–43** · Viking Island Calc (loot/troops/navy/Sea Charts) **L46–200** · Next 5 Levels Preview **L203–258** |
| `SimuladorView.tsx` | State & moral/gold/wall memos **L10–94** · Battle Grid Simulator **L107–236** · Cooks & Moral **L240–323** · City Gold Balance **L325–400** · Wall Siege **L406–466** · Wave Planner **L468–544** |
| `PiratariaView.tsx` | State & launch handler **L8–30** · 8 Timed Raids **L33–66** · Fortress Strength vs Rival **L69–202** |
| `EspionagemView.tsx` | Target save & filter **L7–39** · Target CRUD + 20% Loot + Route Prefill **L41–212** |
| `CalculadorasView.tsx` | Prefill listeners **L55–77** · Travel Time **L112–239** · Loot & Port **L242–338** · Supply Routes **L341–459** · Cost Reducer **L462–527** · 8 Miracles **L531–565** |
| `NotasBackupView.tsx` | Templates & JSON import/export **L27–109** · Tactical Notes **L111–156** · Firebase Manual Sync & Backup **L159–257** |

---

## 3. Fast Verification Workflow

Run only after edits are complete:
- Type check: `npm run lint` (`tsc --noEmit`)
- Production build + PWA SW check: `npm run build` (`vite build`)
- If `ImperialContext.tsx`, `calculations.ts`, or a view changes significantly, update the affected line ranges in Section 2 above so subsequent sessions stay exact.
