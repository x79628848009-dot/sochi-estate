/* ══════════════════════════════════════════════════════════════════════
   AURA · манифест системы
   Живое на странице ровно три вещи: журнал печатается, радар считает
   азимут, часы тикают. Всё остальное движение — на CSS. Ноль библиотек.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     ↓↓↓ ЕДИНСТВЕННАЯ НАСТРОЙКА СТРАНИЦЫ ↓↓↓
     Куда ведёт кнопка «Увидеть систему первым».
     Чтобы перевести на Telegram — замените строку ниже на:
        var CTA_LINK = 'https://t.me/ВАШ_НИК';
     Сейчас — временный адрес почты, собранный из кусков, чтобы его не
     выскребли спам-роботы.
     ═══════════════════════════════════════════════════════════════════ */
  var CTA_LINK = 'mailto:' + ['x79628848009', 'gmail.com'].join('@') +
                 '?subject=' + encodeURIComponent('AURA — увидеть систему первым');

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────── CTA ─────────────────────────────── */

  var ctas = document.querySelectorAll('[data-cta]');
  for (var i = 0; i < ctas.length; i++) ctas[i].setAttribute('href', CTA_LINK);

  /* ───────────────────────── ЖУРНАЛ СИСТЕМЫ ────────────────────────
     Строки допечатываются посимвольно, курсор мигает на активной.
     После последней — долгая пауза, затем цикл начинается заново.     */

  var lines = Array.prototype.slice.call(
    document.querySelectorAll('#log .log__line')
  );

  var CHAR_MS      = 38;   // базовая скорость печати
  var CHAR_JITTER  = 26;   // разброс, чтобы печать не звучала механически
  var LINE_PAUSE   = 900;  // пауза между строками
  var HOLD_MS      = 6500; // сколько журнал стоит заполненным
  var RESTART_MS   = 1100; // пауза перед новым циклом

  /* Каждая строка получает невидимого «двойника» с полным текстом. Он
     держит высоту, поэтому терминал не дёргается, пока строка печатается —
     особенно на узком экране, где строки переносятся.                    */
  function prepare(el) {
    var text  = el.getAttribute('data-text') || '';
    var ghost = document.createElement('span');
    var out   = document.createElement('span');
    ghost.className = 'log__ghost';
    ghost.textContent = text;
    out.className = 'log__out';
    el.textContent = '';
    el.appendChild(ghost);
    el.appendChild(out);
    return { text: text, out: out };
  }

  function typeLine(line, done) {
    var text = line.text;
    var out  = line.out;
    var pos  = 0;
    out.textContent = '';
    out.classList.add('is-typing');

    (function step() {
      if (pos >= text.length) {
        out.classList.remove('is-typing');
        setTimeout(done, LINE_PAUSE);
        return;
      }
      // пробелы проскакиваем чуть быстрее — так печать читается живее
      var ch = text.charAt(pos);
      pos += 1;
      out.textContent = text.slice(0, pos);
      setTimeout(step, (ch === ' ' ? CHAR_MS * 0.6 : CHAR_MS) +
                       Math.random() * CHAR_JITTER);
    })();
  }

  if (lines.length) {
    var prepared = lines.map(prepare);

    if (reduced) {
      prepared.forEach(function (l) { l.out.textContent = l.text; });
    } else {
      var runLog = function (index) {
        if (index >= prepared.length) {
          setTimeout(function () {
            prepared.forEach(function (l) { l.out.textContent = ''; });
            setTimeout(function () { runLog(0); }, RESTART_MS);
          }, HOLD_MS);
          return;
        }
        typeLine(prepared[index], function () { runLog(index + 1); });
      };
      setTimeout(function () { runLog(0); }, 700);
    }
  }

  /* ────────────────────────────── ЧАСЫ ─────────────────────────────── */

  var clock = document.getElementById('clock');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tickClock() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  if (clock) {
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ───────────────────────── АЗИМУТ ЛУЧА ───────────────────────────
     Число не выдумано: это реальный угол вращающегося луча радара,
     снятый с той же анимации, которую видит посетитель.               */

  var azimuth = document.getElementById('azimuth');
  var beam    = document.querySelector('.beam');
  var PERIOD  = 12000; // мс на оборот — синхронно с @keyframes sweep
  var started = (window.performance && performance.now) ? performance.now() : Date.now();

  function beamAngle() {
    if (beam && beam.getAnimations) {
      var anims = beam.getAnimations();
      if (anims.length && anims[0].currentTime != null) {
        var t = Number(anims[0].currentTime);
        if (!isNaN(t)) return ((t / PERIOD) * 360) % 360;
      }
    }
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    return (((now - started) / PERIOD) * 360) % 360;
  }

  if (azimuth) {
    if (reduced) {
      azimuth.textContent = '0°';
    } else {
      var lastShown = -1;
      (function frame() {
        var deg = Math.floor(beamAngle());
        if (deg !== lastShown) {
          lastShown = deg;
          azimuth.textContent = (deg < 100 ? (deg < 10 ? '00' : '0') : '') + deg + '°';
        }
        requestAnimationFrame(frame);
      })();
    }
  }
})();
