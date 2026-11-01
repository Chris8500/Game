# Nachtschicht

Erster spielbarer 2D-Browser-Shooter für **Chris8500/Game**. Handgezeichneter 1920er-Noir-Stil aus dem Chat „Spielfiguren und Animationen zeichnen“. Die originale Straße und acht Laufposen wurden übernommen.

## Starten

Node.js 22 oder neuer. Keine Abhängigkeiten, keine Installation nötig:

```sh
npm start
```

Dann http://127.0.0.1:4174 öffnen. Unter Windows startet `START.cmd` denselben Server. Das Startfenster muss geöffnet bleiben; wird es geschlossen oder der Rechner neu gestartet, `START.cmd` erneut ausführen. Ohne npm funktioniert `node scripts/serve.cjs`. `index.html` kann auch direkt im Browser geöffnet werden; der lokale Server ist für konsistente Bildverarbeitung empfohlen. Das gesamte Verzeichnis einschließlich `assets/` muss erhalten bleiben.

Optional erzeugt `node scripts/standalone.cjs` eine einzelne `Nachtschicht.html` im übergeordneten Ordner. Sie bettet alle Grafiken und den Code ein und kann direkt im Browser geöffnet werden.

## Spielen

- A / D oder Pfeile: laufen
- Leertaste: springen (erneuter Sprung erst nach Loslassen)
- S / Strg / Pfeil unten halten: ducken; dabei keine Bewegung
- Maus: frei zielen, auch nach links und oben/unten
- Linksklick: schießen; Rechtsklick halten: Gewehr anlegen
- R: nachladen, 4 Sekunden für zwei Patronen; leere Waffe lädt beim Schussversuch automatisch
- P / Escape: Pause; Fokusverlust pausiert und setzt Eingaben zurück
- Bildschirmtasten bieten dieselben Aktionen; Zielen durch Berührung des Spielfelds.

Anlegen beruhigt die Waffe innerhalb von etwa 1,4 Sekunden. Ducken verringert die Streuung zusätzlich. Laufen, Springen, schnelle Zielwechsel und Rückstoß verschlechtern die Präzision. Das Fadenkreuz zeigt den möglichen Einschlagbereich in Abhängigkeit von der Zielentfernung. Beim Schuss wird ein Punkt gleichmäßig über die Fläche dieses Kreises gewählt, bevor der Rückstoß den Kreis vergrößert. Das Projektil fliegt von der Mündung genau zu diesem Punkt und endet dort.

Nur wenn der Einschlagspunkt bei der Ankunft auf der sichtbaren Silhouette einer Gegnerfigur liegt, zählt er als Treffer. Die aktuelle Stand-/Laufpose und Blickrichtung werden berücksichtigt; Lücken zwischen Armen oder Beinen bleiben frei. Das Kreuzen einer Figur unterwegs zählt nicht. Bewegte Gegner können den Einschlagspunkt während der kurzen Flugzeit verlassen. Ein kleiner, ruhig gehaltener Fadenkreis erhöht deshalb die Trefferchance erheblich.

Fehlschüsse erzeugen grauen Staub und eine kleine Einschlagspur hinter den Figuren. Treffer zeigen eine goldene Kreuzmarkierung und lösen die Fallanimation aus. Die Statuszeile bestätigt „TREFFER“ oder „FEHLSCHUSS · HINTERGRUND“. Gegnergeschosse behalten ihre bisherige Flugbahn und prüfen die tatsächliche Höhe des Spielers.

Drei Wellen mit 1, 1 und 2 Gegnern (insgesamt vier statt bisher 21, rund 81 % weniger). Zwischen den Wellen: +20 Gesundheit und volle Waffe.

Gegner laufen mit acht gezeichneten Ganzkörperposen. Geschosse und Mündungsblitze entstehen direkt am Lauf der aktuellen Pose. Nach einem Treffer stürzen Gegner in acht Phasen zu Boden und bleiben kurz liegen; währenddessen können sie nicht mehr angreifen. Wellenwechsel und Sieg warten auf das Ende des Sturzes.

## Entwicklung

```sh
npm run check
npm test
npm run build
```

- `src/engine.js`: Simulation ohne Browser-Abhängigkeiten; Node-Tests möglich.
- `src/enemy-hit-masks.js`: vorberechnete Silhouetten aus dem Alphakanal der Gegnergrafiken, Auflösung etwa ein Spielpixel.
- `src/game.js`: Canvas-Darstellung, Eingaben, HUD, Sound, Asset-Laden.
- `assets/`: Originalgrafiken, Ziel-/Nachladeposen sowie Gegnerfigur mit Lauf- und Fallzeichnungen.
- `docs/`: Grafikstil, Bildprompts und weitere Entwicklung.
- `.github/workflows/checks.yml`: Syntaxprüfung, Simulationstests und statischer Build bei Push/PR.
- `dist/`: Ausgabe für beliebiges statisches Hosting (durch Build erzeugt).

Bei Änderungen an Gegnergrafiken oder Bildausschnitten: `python scripts/prepare-hit-masks.py` erzeugt die Trefferflächen neu. Nur dieser Entwicklungsschritt benötigt Python mit Pillow und Node.js; das Spiel selbst hat keine zusätzlichen Abhängigkeiten. Der Asset-Test erkennt veraltete Masken nach einem Austausch der PNGs. `tests/impact-preview.html` zeigt Flugspur, Hintergrundtreffer, Figurentreffer und einen Fehlschuss zwischen den Beinen mit der echten Spielsimulation.

## Status und Grenzen

Spielbarer Prototyp mit fester Straßenarena. Anlegen und Absenken verwenden acht gezeichnete Posen aus player-aim-study.png. Beim Nachladen werden die acht Posen aus player-hand-study.png über vier Sekunden abgespielt. Die Waffe wird aus der bestehenden Zeichnung darübergelegt; das ist eine stilisierte Kombination der Handstudie mit der Waffe, keine vollständig neu gezeichnete mechanische Nachladesequenz. Laufbewegung, Ducken und Sprünge verwenden weiterhin eine Kombination aus Originalgrafiken und prozeduralen Übergängen. Die Laufbeine werden an die Hüftkontur der jeweiligen Oberkörperpose angepasst, mit gemeinsamer Schnittkante und Fußhöhe. Spielerschüsse haben eine kurze Flugzeit von 0,08 bis 0,22 Sekunden und treffen ausschließlich an ihrem zufälligen Endpunkt. Dies ist eine Spielmechanik ohne Schwerkraft, Durchschläge oder Schrotgarbe; die Parameter sind keine validierten Waffenwerte.

Dieser Stand dient als gemeinsame Arbeitsgrundlage. GitHub Actions prüft bei Push und Pull Request die Syntax, die Tests und den statischen Build. Zum Spielen wird das Projekt lokal gestartet; es gibt noch kein öffentliches Deployment. Es werden keine Nutzerdaten erfasst, und es gibt keine externen Laufzeit-Abhängigkeiten.
