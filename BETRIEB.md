# Betriebsanleitung

## Lokal vorbereiten

1. Node.js 24.12.0 und npm 11.11.0 bereitstellen; im Repository `npm ci` ausführen.
2. `npm run build` ausführen und den erfolgreichen Abschluss prüfen.
3. `npm start` starten und laufen lassen. Im Browser `http://127.0.0.1:3000` öffnen.
4. Auf vollständiges Laden warten. Eine Runde mit Start, bewusstem Stopp und Schließen spielen.
5. Lautstärke am Gerät niedrig einstellen und über „Ton an/aus“ prüfen. Der erste Raddruck aktiviert Web Audio, sofern der Browser es erlaubt.

Die Anwendung benötigt keine Konfiguration, Kontingente, Anmeldung oder Datenbank. Zum Beenden den lokalen Server im Terminal mit Strg+C stoppen. Browser-Vollbild, Kioskmodus, Energieeinstellungen und automatischer Start werden von dieser Anwendung nicht am Gerät eingerichtet.

## Während des Betriebs

| Anzeige / Situation | Bedienung |
| --- | --- |
| „Zum Drehen drücken“ | Einmal irgendwo auf das Rad drücken |
| „Es geht los …“ | Kurzen Startschutz abwarten (400 ms) |
| „Zum Stoppen drücken“ | Noch einmal auf das Rad drücken |
| „Dein Glück kommt näher …“ | Rund vier bis sechs Sekunden abwarten |
| Ergebnis | Inhalt lesen; mit „Schließen & weiterdrehen“ oder Escape schließen |
| Technischer Hinweis | Erneut auf das Rad drücken; eine neue Runde beginnt |

Das Stoppen beeinflusst die Gewinnchance nicht. Ein Ergebnis bleibt bis zum Schließen fest. Es gibt keinen automatischen Timeout und keinen Anspruch auf dokumentierte bzw. gespeicherte Ergebnisse. Beschreibungen zu Newsletter und Lostopf müssen gegebenenfalls vom Standpersonal erklärt werden; die Anwendung führt keine Anmeldung durch.

Bei reduzierter Bewegung dreht das Rad nicht fortlaufend. Die zwei Bedienaktionen bleiben gleich. Das System übernimmt diese Browser-/Betriebssystempräferenz jeweils beim Rundenstart. Während eines laufenden Spiels bleibt die gewählte Bewegungsart bestehen.

## Netzwerkausfall, Tabwechsel und Störungen

- Nach vollständigem Laden bleiben weitere Runden ohne Netzwerk spielbar. Die Seite bei Ausfall nicht unnötig neu laden. Bei lokal laufendem Server ist kein Veranstaltungs-WLAN für die Spielrunden nötig.
- Beim Tabwechsel oder Minimieren pausiert das Spiel über die Page Visibility API; bei der Rückkehr setzt es fort. Bei Bedarf den zweiten Raddruck zum Stoppen ausführen.
- Ein ausgefallener oder vom Browser blockierter Ton verhindert keine Runde. Ton aus- und wieder einschalten oder die nächste Runde starten.
- Bei Animationsfehlern kehrt die Anwendung mit einem Hinweis zu einer bedienbaren Startanzeige zurück. Die abgebrochene Auswahl wird verworfen.
- Bei einer vollständig blockierten Browserseite kann ein Neuladen helfen, sofern der lokale Server erreichbar ist. Eine laufende Runde wird dabei verworfen.
- Bei nicht erreichbarer Startseite zuerst prüfen, ob das Terminal mit `npm start` noch läuft und Port 3000 frei ist.

## Abnahme am Eventdisplay — noch offen

- Tatsächliches Betriebssystem, Browser/-version, Auflösung, Skalierung und Gerät dokumentieren.
- Alle acht Felder, Beschriftungen, Zeiger und Dialoge aus der üblichen Stehentfernung lesen können.
- Mehrere Finger gleichzeitig, schnelle Doppeltipps und lange Berührungen prüfen. Kein ungewollter Stopp in der Startphase, keine zweite Auswahl.
- Mindestens 30 aufeinanderfolgende Runden spielen. Auf ruckelfreie Bewegung, korrekte Zeigerausrichtung und stabile Reaktion achten.
- Ton und Lautstärke im Veranstaltungsumfeld testen. Stummschaltung muss unmittelbar wirken.
- Tabwechsel/Minimieren in Start, Dauerrotation und Abbremsung am tatsächlichen Browser prüfen.
- Tastaturbedienung, sichtbaren Fokus, Escape, lange Beschreibung und eventuelle Betriebssystempräferenz für reduzierte Bewegung prüfen.
- Netzwerk nach dem Laden trennen und mehrere Runden vollständig abschließen.
- Markenfreigabe für Schrift, Logo und SVG-Symbole einholen; Platzhalter sind in README dokumentiert.

Die automatisierte Browserprüfung emuliert Touch und die Sichtbarkeitssignale in Chromium Headless. Sie ersetzt keine echte Mehrfinger-, Lautstärke- oder Hardware-Performanceabnahme.

## Updates und Rückkehr zur vorherigen Version

Vor einem Event eine geprüfte Version samt `package-lock.json` und Laufzeitversion sichern. Ein Update erst nach erfolgreichem `npm run check` und einer lokalen Proberunde übernehmen. Bei Problemen die vorherige Version wiederherstellen, `npm ci` und `npm run build` ausführen und den Server neu starten. Keine automatische Aktualisierung während des Eventbetriebs.

Hosting, Domain, TLS außerhalb von localhost, automatischer Start und Kioskverwaltung sind noch nicht festgelegt. Die aktuelle Anwendung bindet nur lokal. Diese Anleitung nimmt keine Geräteänderungen oder Veröffentlichung vor.
