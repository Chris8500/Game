# Grafik und nächste Schritte

Referenz: „Spielfiguren und Animationen zeichnen“, Demo „Nachtschicht“ vom 31.10.2026.

## Verbindlicher Stil

Seitliche Ansicht, realistische menschliche Proportionen, sichtbare Tusche-/Kohle-Konturen und gedeckte Gouache-Texturen. 1920er-Kleidung, Braun, Anthrazit und kühles Graublau. Warmes Laternenlicht, feuchte Pflastersteine und Backstein. Kein Pixel-Art-Stil und keine Comic-Proportionen.

Hauptfigur: langer brauner Trenchcoat, Fedora und Holzschaft-Schrotflinte. Originales Sprite-Sheet: 1536 × 1024, Raster 4 × 2 mit 384 × 512 Pixeln je Pose. Individuelle Fuß-/Körperanker aus der Demo vermeiden einen Teil des Zitterns.

Straße: unverändertes originales Hintergrundbild, 1536 × 1024. Gegner: Profilfigur mit dunklem Mantel, Schiebermütze und bordeauxrotem Schal, optisch vom Spieler unterscheidbar; eigene gezeichnete Lauf- und Fallsequenzen ergänzen die Standpose. Grafiken wurden mit dem integrierten Imagegen-Tool erstellt; Prompts liegen hier bei.

## Nächste sinnvolle Arbeitspakete

1. Zusätzliche gezeichnete Rückstoß- und mechanisch zusammenhängende Nachladeposen.
2. Zweiter Straßenabschnitt mit Deckungsobjekten und Scrollkamera.
3. Schwierigkeitsgrad nach Spieltests feinjustieren, Touch-Steuerung auf echten Mobilgeräten prüfen.

Keine dieser Erweiterungen ist Voraussetzung, um den aktuellen Prototyp zu spielen.

## Eingebaute Zielstudie

player-aim-study.png: acht gezeichnete Posen, 4 × 2 Felder à 384 × 512 Pixel. Rechtsklick spielt die ersten vier Posen in 0,55 Sekunden bis zum Halten ab; Loslassen verwendet die vier Absenkposen. Arme und Waffe werden aus den gezeichneten Posen als gemeinsame Ebene um die Schulter gedreht. Kopf und Körper bleiben aufrecht. Fußanker gleichen die unterschiedlichen Zellpositionen aus. Laufbewegung verwendet weiterhin die ursprünglichen Beine; Ducken passt die Körperhöhe an. Schussursprung und Laufwinkel verwenden dieselben Anker wie die Darstellung.

## Eingebaute Handstudie beim Nachladen

player-hand-study.png wird als achtteilige Nachladeanimation verwendet: je eine halbe Sekunde pro Pose. Die Phasen richten sich nach der verbleibenden Simulationszeit, nicht nach einer eigenen Uhr. Pause und Spielende halten die Pose an; nach vier Sekunden werden zwei Patronen bereitgestellt und die normale Zielpose wieder angezeigt. Wiederholtes R setzt die laufende Animation nicht zurück.

Die waffenfreie Handstudie liefert Kopf, Oberkörper, Arme und Hände. Die Waffe stammt als zusätzliche Bildebene aus der bestehenden Zielstudie; die gezeichneten Finger werden davor gerendert. Ihre vordere Hälfte wird in den mittleren Phasen abgekippt. Diese Komposition ist eine stilisierte Nachladedarstellung, keine neue Bildfolge mit exakt gezeichnetem Einsetzen von Patronen. Laufen und Springen behalten die vorhandenen Beinposen; Ducken und Blickrichtungswechsel bleiben möglich.

## Gemeinsame Körperkante beim Laufen

Oberkörper und Laufbeine werden über die tatsächliche Mantelkontur an der Hüfte verbunden. Für jede Pose sind linke/rechte Kante und Schnitthöhe kalibriert. Der Unterkörper wird an dieselbe Kante angepasst und endet weiterhin auf der gemeinsamen Bodenlinie. Ein kurzer überlappender Verlauf verbindet die gezeichneten Texturen. Anlegen und Nachladen verwenden dieselbe Zeichenfunktion; Spiegelung erfolgt erst für die ganze Figur. Die Kalibrierwerte liegen im Code, damit auch die Standalone-Datei ohne Canvas-Pixelauslesen funktioniert.

Die Entwickleransicht tests/animation-preview.html zeigt alle acht Laufphasen beim Hüftanschlag, Anlegen und Nachladen sowie beide Blickrichtungen.

## Gegner: Laufen, Mündung und Sturz

enemy-walk.png und enemy-fall.png enthalten je acht Ganzkörperzeichnungen auf transparentem Hintergrund (1536 × 1024). Beide wurden mit dem integrierten Imagegen-Tool im Tusche-/Gouache-Stil der Gegnerreferenz erzeugt. Die vollständigen Prompts stehen in enemy-walk-prompt.txt und enemy-fall-prompt.txt.

Individuelle Bildausschnitte und Bodenanker gleichen die unregelmäßigen Abstände der generierten Sprite-Sheets aus. Masken trennen überlappende Begrenzungsrechtecke benachbarter Posen. Die Laufphase folgt der zurückgelegten Strecke; bei Stillstand wird die bestehende Standzeichnung verwendet. Ganze Figuren werden gespiegelt, ohne getrennte Ober-/Unterkörperteile.

Darstellung und Simulation verwenden dieselben Geometriedaten aus enemyPose. Jede Laufpose und die Standpose haben einen gemessenen Mündungspunkt. Dort beginnen Geschossbahn und Mündungsblitz; die erste sichtbare Geschossspur schließt direkt am Lauf an.

Ein besiegter Gegner wird sofort aus der aktiven Gegnerliste entfernt. Die separate Fallsequenz dauert 1,05 Sekunden und zeigt den Sturz ohne Blut oder Wunden. Der Körper bleibt kurz liegen und blendet nach insgesamt 3,5 Sekunden aus. Pause hält die Animation an; ein Wellenwechsel oder die Sieganzeige wartet bis zum Ende des Sturzes. tests/enemy-preview.html zeigt alle Lauf-/Fallposen und markiert die Mündungspunkte in beiden Blickrichtungen.

## Einschläge im Fadenkreis · 01.11.2026

Die Spielerschüsse haben eine sichtbare, kürzer und dünner werdende Flugspur von der Mündung bis zu einem festen Zufallspunkt im Fadenkreis. Erst an diesem Punkt werden die Alphasilhouetten der aktuellen Gegnerposen geprüft. Die Trefferflächen werden aus den bestehenden PNGs abgeleitet; Zeichnungen und Masken verwenden dieselben Ausschnitte, Bodenanker, Skalierungen und Spiegelungen.

Fehlschüsse: graubeiger Staub, kleine Splitter und eine dunkle Einschlagspur auf der Hintergrundebene. Treffer: kurz aufleuchtende goldene Kreuzmarkierung am Einschlagspunkt und anschließender gezeichneter Sturz. Form, Ebene und Statusmeldung unterscheiden die Ergebnisse zusätzlich zur Farbe. Die Effekte werden im Canvas animiert und benötigen keine neuen Rastergrafiken.
