# Prüfung · 31.10.2026

- 13 Tests bestanden: Assets, Bewegung/Pause, Treffer, vier Sekunden Nachladen, Geschossüberschneidung, Wellen/Neustart, Ducken mit Bewegungssperre, Sprung/Landung, Zielberuhigung/Rückstoß, Mauszielrichtung, Unterducken und Schussstreuung.
- Syntaxprüfung von Engine und Browsercode bestanden; statischer Build erzeugt.
- Browserstart und Darstellung von Figur, Gewehr und Fadenkreuz auf localhost:4174 visuell geprüft. Port 4173 war aus dem Prüf-Browser nicht erreichbar; separat gestarteter lokaler Server außerhalb der Sandbox funktioniert.
- Vollständige Spielrunde und gleichzeitige Maus-/Tastatureingaben müssen noch im Spieltest beurteilt werden. Die prozeduralen Posen bleiben Prototypqualität.

Zielstudie eingebaut: 15 Tests inklusive Pose-Reihenfolge und Mündung/Ziellinie über beide Blickrichtungen bestanden. Neues Atlas-Asset auf PNG-Format und 1536 × 1024 geprüft. Neue Figur und Mausausrichtung im Browser auf Port 4174 kontrolliert.

Handstudie als Nachladeanimation eingebaut: 17 Tests bestanden, einschließlich vollständiger Posefolge, Pausieren, Munitionsfreigabe am Ende, Bewegung, Ducken, Blickrichtungswechsel und Neustart. Syntaxprüfung und statischer Build bestanden. Browserprüfung auf Port 4174: Nachladestart per R, gezeichnete Figur mit sichtbarer Waffe, laufende Restzeit und Bewegung nach rechts kontrolliert. Asset-Lader, Build und Standalone-Skript berücksichtigen beide neuen Sprite-Sheets.

Gegnerzahl und Laufkorrektur: 1/1/2 Gegner pro Welle statt 5/7/9 (vier statt 21, rund 81 % weniger). 18 Tests einschließlich tatsächlichem Spawn-Limit aller Wellen, Wellenübergängen und Sieg bestanden; Syntaxprüfung und Build erfolgreich. Die vergrößerte Entwickleransicht zeigt die korrigierte Hüftkante in allen acht Laufphasen, mit angelegter Waffe und beim Nachladen; gespiegelter Hüftanschlag ebenfalls visuell geprüft.

Gegneranimationen: 23 Tests bestanden. Zusätzliche Prüfungen decken den tatsächlichen Geschoss-/Blitzursprung in allen acht Laufposen, im Stand und in beiden Blickrichtungen ab, außerdem Bewegungsphasen, die vollständige Fallfolge, sofortiges Ende gegnerischer Angriffe, keine doppelten Punkte, Pause, Neustart, Ausblenden und verzögerten Wellenabschluss/Sieg. Beide neuen RGBA-Assets sind 1536 × 1024 groß. Syntaxprüfung und statischer Build erfolgreich. Die Entwickleransicht zeigt vollständige Figuren mit gemeinsamer Bodenlinie, bereinigten Sprite-Ausschnitten und korrekt markierten Mündungen.

Zusätzlich im normalen Spiel auf Port 4174 geprüft: Gegner läuft in die Straße; ein gezielter Mausklick erzielt 100 Punkte und löst sichtbar die gezeichnete Knie-/Fallpose aus. Vorschau der acht Fallphasen: enemy-fall-preview.jpg. Spiel anschließend wieder auf die Startansicht gesetzt.

## Einschlagmechanik · 01.11.2026

34 Tests bestanden; Syntaxprüfungen aller drei Laufzeitdateien und statischer Build erfolgreich. Neu geprüft: gleichmäßige Flächenverteilung im Kreis (einschließlich Rand), gemeinsame Geometrie für Fadenkreuz und Zufallsauswahl vor dem Rückstoß, fester Endpunkt trotz nachträglicher Mausbewegung, Flugbeginn an der Mündung, keine Treffer beim bloßen Kreuzen einer Figur, Lücken zwischen den Beinen, Spiegelung und alle Laufposen, Position der Figur bei der Ankunft, nur ein Treffer bei überlappenden Figuren, deutlich höhere Trefferchance beim ruhigen Anlegen/Ducken, Pause/Neustart und ausstehende Fluganimation beim Sieg. Hash-Prüfung bindet die vorberechneten Silhouetten an die aktuellen PNGs.

Browserprüfung: tests/impact-preview.html verwendet die echte Engine und Darstellung für Flugspur, Hintergrund-Einschlag, Figurentreffer und einen Fehlschuss zwischen den Beinen. Goldene Kreuzmarkierung, Sturz sowie grauer Staub hinter den Figuren visuell geprüft; Vergleich in impact-preview.jpg. Zusätzlich in der normalen Demo per Mausklick geschossen: ein zufälliger Hintergrund-Einschlag, Munitionsverbrauch und die Statusmeldung „FEHLSCHUSS · HINTERGRUND“ sichtbar. Keine Browserwarnungen oder -fehler protokolliert. Demo auf Port 4174 wieder auf die Startansicht gesetzt.

Die Tests prüfen die Spielmechanik; der längerfristige Schwierigkeitsgrad bleibt eine Frage des Spielgefühls. Die Trefferflächen approximieren die PNG-Alphakontur mit etwa einem Spielpixel Auflösung.
