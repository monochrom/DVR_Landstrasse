# DVR Landstraße · Fahrrad-Modul · Prototyp

Nachbau des Figma-Frames „Fahrrad-Module“ in HTML/CSS/JS.
Zweck: Kundenabstimmung und Übergabe an die Entwicklung. Fokus liegt auf dem Tipps-Slider.

## Öffnen

`index.html` direkt im Browser öffnen. Keine Build-Tools, keine Abhängigkeiten.

Bedienung: Desktop Button „Nächster Tipp“ oder Pfeiltasten ←/→. Mobile: Wischen (rückwärts geht bis Tipp 1, vorwärts loopt nach Tipp 4 zurück zu Tipp 1).

## Struktur

```
01_prototype/
├── index.html        Markup des Moduls
├── css/styles.css    Tokens, Layout (fluid), Motion
├── js/slider.js      Slider-Logik (Index, Loop, Swipe, Tastatur)
└── assets/           Bilder aus Figma exportiert
```

## Responsive-Konzept

Schriften: FatFrank und Roboto sind nicht enthalten, im Prototyp steht Helvetica.

**Typografie** ist fluid über `clamp()` in `:root`, linear von 390 px bis 1920 px:

| Token | 390 px | 1920 px (Figma) |
|---|---|---|
| headline-1 | 44 | 100 |
| headline-2 (Nummer) | 40 | 64 |
| headline-3 (CTA) | 28 | 40 |
| headline-4 (Tipp) | 24 | 32 |
| body-1 | 18 | 24 |
| body-2 | 16 | 18 |
| label | 15 | 15 |

**Desktop (≥ 1100 px):** Die Slider-Geometrie aus Figma bleibt 1:1 erhalten, aber in „Design-Pixeln“ (`--px`). 1 Design-Pixel = 1 px bei 1920 px Modulbreite, darunter proportional kleiner (Container-Query-Einheit `cqw`). Kreis, Pille, Abstände und Button-Position schrumpfen also mit dem Viewport, die Schrift folgt ihrer eigenen clamp-Kurve und bleibt lesbar. Wird der Text dadurch höher als die Pille, wächst die Pille mit (`min-height` statt `height`), der Kreis bleibt vertikal zentriert.

**Zwischengrößen (1100–1439 px):** Desktop-Geometrie, aber Nummer und Linie rücken über den Text. Der Lauftext bekommt so die volle Content-Breite der Pille, sonst würde die Textspalte zu schmal und die Pille zu hoch.

**Mobile / Tablet (< 1100 px):** Gestapeltes Layout, dieselbe Idee wie auf Desktop, nur vertikal: Der Kreis sitzt oben und liegt zu 45 % auf der Karte (hier über der Karte, nicht darunter), die Pille wird zur Karte mit 40 px Radius. Ein Slide nimmt die ganze Innenbreite ein (auf Tablets auf 600 px gedeckelt und zentriert), der Schritt entspricht der ganzen Innenbreite plus 24 px, es lugt nichts herein. Kein Button, nur Indikator. Navigation per Wischen. Kreis-Größe: 72 % der Modulbreite, maximal 320 px. Nummer und Linie stehen in einer Zeile, Headline und Text darunter. Die Linie hat auf allen Breakpoints feste 128 px.

**CTA-Box** auf Mobile einspaltig: Text, Bild, Button.

Die gesamte Geometrie steht in CSS-Variablen auf `.tips-slider` (Desktop) bzw. in der Media-Query. JS rechnet keine Pixel, es setzt nur `--index`, deshalb ist Resize unkritisch.

## Slider-Konzept

Geometrie (CSS-Variablen in `:root`):

| Element | Wert |
|---|---|
| Bildkreis | 581 × 580 px |
| Pille | 1066 × 580 px, beginnt bei x = 423 px |
| Slide-Breite | 1489 px |
| Abstand zwischen Slides | 232 px |
| Schrittweite | 1721 px |
| Inaktive Slides | Opacity 0.1 |

Bewegung beim Klick auf „Nächster Tipp“:

1. Der Track erhält `--index`. Kreis und Pille verschieben sich um `−index × slide-step` (Desktop: 1721 Design-Pixel, Mobile: Innenbreite + 24 px).
2. Bildkreis und Pille lesen `--index` unabhängig voneinander und animieren mit eigener Dauer und eigenem Easing. Der Kreis ist schneller (1400 ms), die Pille langsamer und mit kleinem Delay (1700 ms + 150 ms), beide ease-out-quint. Daraus entsteht der Parallax-Effekt: Der Kreis eilt voraus, die Pille zieht nach.
   Ebenen: Alle Pillen liegen über allen Kreisen (z-index 2 vs. 1). Der schnellere Kreis gleitet dadurch unter der alten Pille hindurch statt darüber. Deshalb sitzt die Opacity auf Kreis und Pille und nicht auf dem Slide-Container, sonst würde ein Stacking-Context die Ebenen trennen.
   Der alte Slide bleibt sichtbar, solange er fährt: Sein Ausblenden dauert so lang wie seine Fahrt und läuft mit Ease-in, er geistert also erst kurz vor dem Stillstand auf 10 % ab. Sein Text blendet ruhig über 600 ms aus. Der neue Slide blendet über 700 ms ein. Auf Mobile gibt es kein Geistern, dort fahren alte und neue Karte voll sichtbar raus und rein.
3. Der Bildkreis rollt leicht ab (Amplitude 7°, `--wheel-roll`, Richtung je nach Wischrichtung). Die Rotation ist als Transition der `rotate`-Eigenschaft umgesetzt, nicht als Keyframe-Animation: Phase 1 zur Amplitude (1100 ms), Phase 2 zurück auf 0 (1700 ms). Sie läuft also noch, wenn die Pille schon steht. Eine Transition lässt sich mitten in der Bewegung neu anzielen, deshalb springt nichts, wenn der nächste Klick kommt, bevor die Rotation zu Ende ist. Alle Kreise rollen synchron, deshalb bleibt auch der Loop-Sprung unsichtbar.
4. Der Content der neuen Pille blendet gestaffelt ein: Nummer, Linie (zeichnet sich von links), Headline, Text.
5. Der Indikator wechselt den aktiven Punkt.

Alle Zeiten und Easings sind als CSS-Variablen in `css/styles.css` unter „Motion“ gebündelt und können dort zentral angepasst werden.

Loop: Nach Tipp 4 folgt ein Klon von Tipp 1. Nach der Animation springt der Slider ohne Transition auf das Original zurück, die Position ist optisch identisch.

## Barrierefreiheit

- `prefers-reduced-motion` verkürzt alle Animationen und deaktiviert die Rotation.
- Slide-Wechsel wird über eine `aria-live`-Region angesagt („Tipp 2 von 4“).
- Der Button ist per Tastatur erreichbar, Fokus-Ring sichtbar.

## Offene Punkte für die Entwicklung

- Echte Webfonts (FatFrank, Roboto) einbinden und die clamp-Kurven danach prüfen.
- Swipe ist bewusst simpel (ein Wisch = ein Schritt, kein Mitziehen des Sliders).
- Bilder sind als PNG mit transparenten Ecken exportiert; für Produktion als JPEG/WebP mit CSS-Rundung ausliefern.
