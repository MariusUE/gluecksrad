# Thüringen-Glücksrad

Lokale Next.js-Anwendung für ein Eventdisplay: **Rad drücken → drehen → erneut drücken → abbremsen → Ergebnis schließen → nächste Runde.**

## Starten

Voraussetzungen: Node.js **24.12.0** (siehe `.nvmrc`) und npm **11.11.0**. Alle direkten Paketversionen sind exakt in `package.json`, alle aufgelösten Pakete in `package-lock.json` festgehalten.

```bash
npm ci
npm run dev
```

Browser: `http://127.0.0.1:3000`. Für den lokalen Einsatz den Produktionsbuild verwenden:

```bash
npm run build
npm start
```

Der Server bindet standardmäßig nur an die lokale Schnittstelle. Kein Konto, keine Umgebungsvariablen und keine externen Dienste erforderlich. Betrieb und offene Geräteabnahmen: [BETRIEB.md](BETRIEB.md).

## Spielregeln

- Acht gleich wahrscheinliche Felder: **12,5 % pro Feld**, **25 % pro Kategorie** (Kaffee, Wein, Hauptgewinn, Niete).
- Das Ergebnis wird beim ersten Druck einmal mit Web Crypto ausgewählt. Der Stoppzeitpunkt ändert es nicht.
- 400 ms Startschutz, danach eine Umdrehung pro Sekunde ohne Zeitlimit. Der zweite Druck löst eine etwa vier bis sechs Sekunden lange Abbremsung aus.
- Während Startschutz, Abbremsung und Ergebnisanzeige sind weitere Radaktivierungen gesperrt. Die Anzeige wechselt passend zum Zustand.
- Ergebnis im nativen Dialog. „Schließen & weiterdrehen“ oder Escape setzen zurück. Hintergrundklick schließt nicht; kein automatisches Schließen.
- Maus, Touch, Enter und Leertaste werden unterstützt. Ton ist schaltbar und standardmäßig leise eingeschaltet; kein Speichern der Einstellung.
- Bei reduzierter Bewegung bleibt das Rad während des Spiels ruhig und wird beim zweiten Druck mit einer kurzen Überblendung ausgerichtet.
- Ein verborgener Tab pausiert Animation und Audio. Technische Animationsfehler geben die Bedienung mit einem Hinweis wieder frei.

Die vier gelieferten Beschreibungen stehen unverändert in [`wheel.ts`](src/features/wheel/config/wheel.ts), einschließlich **„Hüfte“**. Die Erwähnung von Newsletter, Visitenkarte und LinkedIn ist ausschließlich Beschreibungstext; es gibt keine Links, Formulare oder Erfassung. Der Hauptgewinntext beschreibt die Teilnahme an einem Lostopf, keinen zugesicherten Reisegewinn.

## Architektur

| Bereich | Verantwortung |
| --- | --- |
| `src/app/` | App Router, Metadaten und globale Gestaltung |
| `src/features/wheel/config/` | Ergebnisse, Reihenfolge und Farben |
| `domain/` | Typen, Validierung und Zustandsautomat |
| `selection/` | Acht gleich große Zufallsintervalle eines Uint32-Werts |
| `animation/` | SVG-Geometrie und abbrechbarer WAAPI-Controller |
| `audio/` | Lokal erzeugte, optionale Web-Audio-Klicks |
| `useWheelGame.ts` | Synchrone Eingabesperre, Vorgangskennungen, Lebenszyklus |
| `components/` | Rad, einfache eigene SVG-Symbole, Dialog und CSS Modules |

Winkelkonvention: 0° zeigt nach oben, positive Winkel drehen im Uhrzeigersinn, Feld `i` hat sein Zentrum bei `i × 45°`. Das Ziel liegt bei `−i × 45°` modulo 360°. Die Zeigerposition bleibt fest. Der Controller liest die WAAPI-Zeit für Winkel und Feldklicks; React wird nicht pro Bild aktualisiert.

Zufallsquelle und Animation sind über typisierte Abhängigkeiten in Komponententests austauschbar. Browsertests ersetzen `crypto.getRandomValues` im Testbrowser. Die Anwendung bietet keine Gewinnerparameter, Testschalter oder öffentlichen Backend-Endpunkte.

Alle Spielmodule, SVGs und Styles werden mit der Seite geladen. Nach vollständigem Laden funktionieren weitere Runden ohne Netzwerk. Ein Offline-Neuladen bzw. Kaltstart ohne lokalen Server wird nicht zugesichert; es gibt keinen Service Worker.

## Prüfen

```bash
npm ci
npx playwright install chromium --only-shell
npm run check
```

`check` führt Lint, Typecheck, Unit-/Komponententests, Produktionsbuild und Playwright aus. Die Browsertests starten selbst einen Produktionsserver auf `127.0.0.1:3100`; der Port muss frei sein. Linux benötigt die üblichen Chromium-Systembibliotheken. Bei einer vorhandenen Playwright-Installation kann `PLAYWRIGHT_BROWSERS_PATH` auf den Browserordner zeigen.

Einzeln: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. `npm run test:watch` startet den Test-Watchmodus. Browserberichte und Layoutbilder liegen nach einem Lauf in `playwright-report/` und `test-results/` und werden nicht eingecheckt.

Prüfstand: Lockfile-Install, Lint, Typecheck und Produktionsbuild erfolgreich; **47 Unit-/Komponententests und 18 Browsertests bestanden**. Details und Abnahmegrenzen stehen in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md). Die Browsermatrix umfasst 1920 × 1080, 1366 × 768, 1280 × 800 und 1024 × 768. Die axe-Prüfungen auf Startseite und Hauptgewinn-Dialog melden keine Verstöße; die Prüfung am Display bleibt separat offen.

## Gestaltung und Auslieferungsstand

Systemschrift (Arial/Helvetica) und die selbst erstellten geometrischen SVG-Symbole sind vorläufig. Die Wortmarke im Kopf ist ebenfalls eine eigene Platzhalterdarstellung und kein geliefertes offizielles Logo. Es werden keine externen Schriften, Bilder oder Iconpakete geladen. Die Segmentfarben entsprechen der gelieferten digitalen Palette; transparente Flächen und Schatten leiten sich daraus ab. Textplaketten verbessern den Kontrast der kleinen Feldbeschriftungen.

Offen bleiben finale Markenassets samt Nutzungsrechten, Hostingentscheidung und die Abnahme am tatsächlichen 42-Zoll-Display (Multitouch, Lautstärke, Lesbarkeit, Leistung). Es erfolgten keine Veröffentlichung und keine Änderungen am Eventgerät.

Die Paketwahl wurde bei Einrichtung anhand der npm-Registry und der [offiziellen Next.js-Installationsdokumentation](https://nextjs.org/docs/app/getting-started/installation) geprüft. Next.js 16.3.5 und React/React DOM 19.3.0 sind exakt festgehalten; TypeScript ist streng konfiguriert. Weitere Versionen: `package.json`.

Der Next.js-Build nutzt mit TypeScript 6 die Compiler-API (`experimental.useTypeScriptCli: false`), da die CLI-Ausgabe im Build-Worker hier zeitweise nicht vollständig eingelesen wurde. Die Typprüfung bleibt im Build aktiv und wird zusätzlich mit `npm run typecheck` ausgeführt.
