/* ==========================================================================
   DVR Landstraße · Fahrrad-Modul · Tipps-Slider
   --------------------------------------------------------------------------
   Prinzip:
   - Alle Slides liegen in derselben Grid-Zelle und werden per CSS um
     --i × slide-step nach rechts versetzt.
   - Der Track bekommt --index; Bildkreis und Pille lesen daraus ihre
     Verschiebung (−index × slide-step) und animieren mit unterschiedlicher
     Dauer/Easing → Parallax (Kreis kommt zuerst an).
   - Die Schrittweite steht nur im CSS (Desktop: Design-Pixel, Mobile: volle
     Breite). JS rechnet keine Pixel, dadurch ist Resize unkritisch.
   - Nach dem letzten Tipp geht es nahtlos zurück zum ersten: Slide 1 hängt
     als Klon am Ende; nach der Animation wird ohne Transition auf das
     Original zurückgesprungen.
   - Navigation: Button „Nächster Tipp“ (Desktop), Wischen (Touch),
     Pfeiltasten ←/→.
   ========================================================================== */

(function () {
  'use strict';

  var slider = document.querySelector('[data-slider]');
  if (!slider) return;

  var viewport = slider.querySelector('[data-viewport]');
  var track = slider.querySelector('[data-track]');
  var nextBtn = slider.querySelector('[data-next]');
  var dots = Array.prototype.slice.call(slider.querySelector('[data-dots]').children);
  var status = slider.querySelector('[data-status]');
  var tips = Array.prototype.slice.call(track.querySelectorAll('[data-tip]'));
  var count = tips.length;

  function toMs(value) {
    value = value.trim();
    return parseFloat(value) * (value.slice(-2) === 'ms' ? 1 : 1000);
  }

  function slideDuration() {
    // Längste Slide-Bewegung = Pille (Dauer + Delay). Wird bei jedem Wechsel neu
    // gelesen, damit Breakpoint- und prefers-reduced-motion-Werte greifen.
    var c = getComputedStyle(track);
    return toMs(c.getPropertyValue('--t-pill')) + toMs(c.getPropertyValue('--t-pill-delay'));
  }

  function rollOutDuration() {
    return toMs(getComputedStyle(track).getPropertyValue('--t-roll-out'));
  }

  function settleDuration() {
    // Bis Slide UND Text-Choreografie fertig sind – erst dann Loop-Sprung/Entsperren
    var c = getComputedStyle(track);
    var textEnd = toMs(c.getPropertyValue('--text-delay'))
      + 3 * toMs(c.getPropertyValue('--text-stagger'))
      + toMs(c.getPropertyValue('--t-text'));
    return Math.max(slideDuration(), textEnd) + 50;
  }

  // Klon von Slide 1 ans Ende für den nahtlosen Loop
  var clone = tips[0].cloneNode(true);
  clone.classList.remove('is-active');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('data-clone', '');
  track.appendChild(clone);

  var all = tips.concat([clone]);
  all.forEach(function (el, i) {
    el.style.setProperty('--i', i);
  });

  var index = 0;
  var locked = false;
  var slideTimer = null;
  var rollTimer = null;

  function render(i, instant) {
    if (instant) track.classList.add('no-transition');

    track.style.setProperty('--index', i);

    all.forEach(function (el, j) {
      el.classList.toggle('is-active', j === i);
    });

    var dotIndex = i % count;
    dots.forEach(function (dot, j) {
      dot.classList.toggle('is-active', j === dotIndex);
    });

    if (status) status.textContent = 'Tipp ' + (dotIndex + 1) + ' von ' + count;

    if (instant) {
      void track.offsetHeight; // Reflow erzwingen, damit der Sprung ohne Transition passiert
      track.classList.remove('no-transition');
    }
  }

  /* dir = 1 (weiter) | -1 (zurück). Rückwärts gibt es keinen Loop. */
  function go(dir) {
    if (locked) return;
    var target = index + dir;
    if (target < 0 || target > count) return;

    locked = true;
    index = target;

    // Kreis-Rotation: Phase 1 zur Amplitude (Vorzeichen = Richtung), Phase 2 zurück.
    // Als Transition retargetbar → kein Sprung, falls noch eine Rotation läuft.
    track.classList.add('is-rolling');
    track.style.setProperty('--roll', (dir > 0 ? 'calc(-1 * var(--wheel-roll))' : 'var(--wheel-roll)'));
    clearTimeout(rollTimer);
    rollTimer = setTimeout(function () {
      track.classList.remove('is-rolling');
      track.style.setProperty('--roll', '0deg');
    }, rollOutDuration());

    render(index);

    clearTimeout(slideTimer);
    slideTimer = setTimeout(function () {
      if (index === count) {
        // Wir stehen auf dem Klon von Slide 1 → unsichtbar aufs Original springen.
        // Die Rotation läuft auf allen Kreisen synchron weiter.
        index = 0;
        render(0, true);
      }
      locked = false;
    }, settleDuration());
  }

  /* Button */
  nextBtn.addEventListener('click', function () { go(1); });

  /* Tastatur */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
  });

  /* Wischen (Touch / Maus) – ein Swipe = ein Schritt */
  var SWIPE_MIN = 40;
  var startX = null;
  var startY = null;

  viewport.addEventListener('pointerdown', function (e) {
    startX = e.clientX;
    startY = e.clientY;
  });

  viewport.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  });

  viewport.addEventListener('pointercancel', function () {
    startX = startY = null;
  });

  render(0, true);
})();
