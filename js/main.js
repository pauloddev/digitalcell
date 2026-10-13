(function () {
  'use strict';

  // Cada loja tem o seu WhatsApp; sem data-store o link vai para a loja principal
  var WA = { nassau: 'https://wa.me/5581986239847', indianopolis: 'https://wa.me/5581973016294' };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function waLink(text, store) { return (WA[store] || WA.nassau) + '?text=' + encodeURIComponent(text); }

  /* ---------- Links de WhatsApp com mensagem pronta ---------- */
  $$('[data-wa]').forEach(function (a) { a.href = waLink(a.getAttribute('data-wa'), a.getAttribute('data-store')); });

  /* ---------- Conteúdo dos carrosséis ---------- */
  var PRODUTOS = [
    'iPad saindo da caixa', 'Caixas de iPhone laranja, branco e azul', 'iPhones lacrados na vitrine da loja', 'iPhone laranja saindo da caixa',
    'iPad prateado com a caixa ao fundo', 'Fones Echo Buds', 'iPhone azul-escuro na caixa', 'iPhone branco na caixa',
    'Pilha de caixas de relógios Garmin Vívoactive', 'iPhone preto saindo da caixa', 'iPhone vinho saindo da caixa', 'iPhone azul-claro diante do letreiro da loja',
    'Caixa de iPhone preto lacrada', 'Caixa de iPhone vinho lacrada', 'MacBook prateado', 'MacBook cinza-espacial',
    'MacBook entreaberto', 'MacBook aberto, visto de lado', 'Caixa de MacBook Air lacrada', 'MacBook Air lacrado, a pronta entrega',
    'Caixa de relógio Garmin Forerunner', 'Caixas de relógios Garmin', 'Relógio Garmin preto ligado', 'Relógio Garmin preto com mostrador colorido',
    'Relógio Garmin branco', 'iPhone na mão, diante da loja', 'Três caixas de iPhone em cores diferentes', 'Microfone Hollyland Lark ao lado da sacola da Digital Cell'
  ];
  var track = $('#produtos-track');
  if (track) {
    track.innerHTML = PRODUTOS.map(function (alt, k) {
      var n = ('0' + (k + 1)).slice(-2);
      var msg = 'Olá! Vi no site da Digital Cell: ' + alt + '. Ainda tem disponível?';
      return '<li><div class="shot">' +
        '<div class="shot__img"><img src="assets/img/produto-' + n + '.jpg" alt="' + alt + '" width="720" height="1280" loading="lazy" decoding="async"></div>' +
        '<p class="shot__name">' + alt + '</p>' +
        '<a class="shot__cta" href="' + waLink(msg) + '" target="_blank" rel="noopener">Perguntar no WhatsApp <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>' +
        '</div></li>';
    }).join('');
  }

  /* ---------- Garmin: troca de cor nos modelos ---------- */
  $$('[data-model]').forEach(function (m) {
    var img = $('[data-photo]', m), label = $('[data-color]', m), cta = $('[data-wa-base]', m);
    var sw = $$('.swatch', m);
    sw.forEach(function (b) {
      b.addEventListener('click', function () {
        sw.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        var name = b.getAttribute('data-name');
        if (label) label.textContent = name;
        if (cta) cta.href = waLink(cta.getAttribute('data-wa-base') + ' na cor ' + name + '.');
        var src = b.getAttribute('data-src');
        if (img && img.getAttribute('src') !== src) {
          img.classList.add('is-swapping');
          var pre = new Image();
          pre.onload = pre.onerror = function () { img.src = src; img.alt = img.alt.replace(/(Forerunner \d+( Music)?).*/, '$1') + ' ' + name.toLowerCase(); img.classList.remove('is-swapping'); };
          pre.src = src;
        }
      });
    });
    // Setas do teclado entre as cores
    m.addEventListener('keydown', function (e) {
      var k = sw.indexOf(document.activeElement);
      if (k < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      e.preventDefault();
      var n = sw[(k + (e.key === 'ArrowRight' ? 1 : -1) + sw.length) % sw.length];
      n.focus(); n.click();
    });
  });

  /* ---------- Abertura ---------- */
  function start() {
    root.classList.add('is-ready');
    observe();
  }
  var intro = $('#intro');
  if (intro && root.classList.contains('intro-on')) {
    try { sessionStorage.setItem('dc-intro', '1'); } catch (e) {}
    setTimeout(function () { intro.classList.add('is-out'); }, 1900);
    setTimeout(start, 2350);
    setTimeout(function () { root.classList.remove('intro-on'); }, 2900);
  } else {
    start();
  }

  /* ---------- Títulos por palavra + entradas ---------- */
  $$('[data-words]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  // Ordem de cada item nas grades, para a entrada em cascata
  $$('.devices, .gallery, .acc__list, .duo, .models').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--n', Math.min(i, 8)); });
  });

  function observe() {
    var els = $$('[data-reveal], [data-words]');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Carrosséis de fotos e depoimentos: um por vez, com destaque no atual ---------- */
  $$('[data-carousel]').forEach(function (c) {
    var t = $('.carousel__track', c);
    var thumb = $('.carousel__bar span', c);
    if (!t) return;
    var items = Array.prototype.slice.call(t.children);
    var n = items.length, active = 0, pending = false, timer = null;
    if (!n) return;

    function paint() {
      items.forEach(function (it, k) {
        it.classList.toggle('is-active', k === active);
        if (k === active) it.setAttribute('aria-current', 'true'); else it.removeAttribute('aria-current');
      });
      if (thumb) {
        thumb.style.width = (100 / n) + '%';
        thumb.style.transform = 'translateX(' + (active * 100) + '%)';
      }
    }
    function go(k) {
      active = (k + n) % n;
      paint();
      var max = t.scrollWidth - t.clientWidth;
      var left = Math.max(0, Math.min(items[active].offsetLeft - items[0].offsetLeft, max));
      // "pending" marca que a próxima parada de rolagem foi causada pelas setas, não pelo dedo
      pending = Math.abs(left - t.scrollLeft) > 1;
      t.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    }
    function nearest() {
      var best = 0, d = Infinity;
      items.forEach(function (it, k) {
        var dd = Math.abs(it.offsetLeft - items[0].offsetLeft - t.scrollLeft);
        if (dd < d) { d = dd; best = k; }
      });
      return best;
    }
    var prev = $('[data-prev]', c), next = $('[data-next]', c);
    if (prev) prev.addEventListener('click', function () { go(active - 1); });
    if (next) next.addEventListener('click', function () { go(active + 1); });
    items.forEach(function (it, k) { it.addEventListener('click', function () { if (k !== active) go(k); }); });
    // Arraste manual: o item mais à esquerda passa a ser o atual
    t.addEventListener('scroll', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (pending) { pending = false; return; }
        var k = nearest();
        // No fim da trilha a rolagem não avança mais, mas o destaque segue pelos itens visíveis
        if (t.scrollLeft >= t.scrollWidth - t.clientWidth - 2 && active >= k) return;
        if (k !== active) { active = k; paint(); }
      }, 160);
    }, { passive: true });
    paint();
  });

  /* ---------- Carrossel de vídeos ---------- */
  (function () {
    var reel = $('[data-reel]');
    if (!reel) return;
    var t = $('#reel-track'), segs = $('#reel-segments');
    var TOTAL = 7, active = 0, inView = false, timer = null;
    // Ordem visual: o último vídeo fica à esquerda do primeiro, para o carrossel abrir equilibrado.
    // "active" é sempre a posição na sequência (0 = vídeo 1).
    var html = [], shtml = '';
    for (var i = 1; i <= TOTAL; i++) {
      var n = ('0' + i).slice(-2);
      html.push('<li class="reel__item" data-i="' + (i - 1) + '"><video muted playsinline preload="none" data-src="assets/video/video-' + n + '.mp4" aria-label="Vídeo ' + i + ' de ' + TOTAL + '"></video></li>');
      shtml += '<li><button type="button" aria-label="Ir para o vídeo ' + i + '"><i></i></button></li>';
    }
    t.innerHTML = html[TOTAL - 1] + html.slice(0, TOTAL - 1).join('');
    segs.innerHTML = shtml;
    $('#reel-total').textContent = TOTAL;
    var items = $$('.reel__item', t).sort(function (x, y) { return x.getAttribute('data-i') - y.getAttribute('data-i'); });
    var bars = $$('i', segs), buttons = $$('button', segs);
    var vids = items.map(function (it) { return $('video', it); });

    function load(i, mode) {
      var v = vids[i];
      if (!v) return;
      if (!v.getAttribute('src')) { v.preload = mode; v.src = v.getAttribute('data-src') + '#t=0.1'; }
      else if (mode === 'auto') v.preload = 'auto';
    }
    function paint() {
      bars.forEach(function (b, i) {
        var p = i < active ? 1 : 0;
        if (i === active) { var v = vids[i]; p = v.duration ? Math.min(1, v.currentTime / v.duration) : 0; }
        b.style.setProperty('--p', p);
      });
    }
    function play() {
      vids.forEach(function (v, i) { if (i !== active && !v.paused) v.pause(); });
      var v = vids[active];
      if (!inView) { v.pause(); return; }
      load(active, 'auto');
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    function setActive(i, restart) {
      active = (i + TOTAL) % TOTAL;
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === active); });
      buttons.forEach(function (b, k) { if (k === active) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      $('#reel-current').textContent = active + 1;
      load((active + 1) % TOTAL, 'metadata');
      load((active - 1 + TOTAL) % TOTAL, 'metadata');
      if (restart) { try { vids[active].currentTime = 0; } catch (e) {} }
      paint();
      play();
    }
    function go(i) {
      var k = (i + TOTAL) % TOTAL, it = items[k];
      var left = it.offsetLeft - (t.clientWidth - it.offsetWidth) / 2;
      t.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      setActive(k, true);
    }
    function nearest() {
      var mid = t.scrollLeft + t.clientWidth / 2, best = 0, d = Infinity;
      items.forEach(function (it, k) {
        var c = it.offsetLeft + it.offsetWidth / 2, dd = Math.abs(c - mid);
        if (dd < d) { d = dd; best = k; }
      });
      return best;
    }
    t.addEventListener('scroll', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { var k = nearest(); if (k !== active) setActive(k, true); }, 140);
    }, { passive: true });
    items.forEach(function (it, k) { it.addEventListener('click', function () { if (k !== active) go(k); }); });
    buttons.forEach(function (b, k) { b.addEventListener('click', function () { go(k); }); });
    $('[data-prev]', reel).addEventListener('click', function () { go(active - 1); });
    $('[data-next]', reel).addEventListener('click', function () { go(active + 1); });
    vids.forEach(function (v, k) {
      v.addEventListener('timeupdate', function () { if (k === active) paint(); });
      v.addEventListener('ended', function () { if (k === active) go(active + 1); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView) { load(active, 'auto'); }
        play();
      }, { threshold: 0.35 }).observe(reel);
      new IntersectionObserver(function (es, io) {
        if (es[0].isIntersecting) { load(0, 'metadata'); load(1, 'metadata'); load(TOTAL - 1, 'metadata'); io.disconnect(); }
      }, { rootMargin: '600px 0px' }).observe(reel);
    } else { inView = true; }
    function center(k) { var it = items[k]; t.scrollLeft = it.offsetLeft - (t.clientWidth - it.offsetWidth) / 2; }
    setActive(0, false);
    center(0);
    window.addEventListener('resize', function () { center(active); });
  })();

  /* ---------- Horário: hoje e aberto agora ---------- */
  (function () {
    var el = $('#status');
    if (!el) return;
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Recife', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    } catch (e) { return; }
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(map.weekday);
    var mins = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);
    var close = day === 0 ? 0 : day === 6 ? 16 * 60 : 19 * 60 + 30;
    var open = day !== 0 && mins >= 9 * 60 && mins < close;
    el.textContent = open ? 'Aberto agora' : 'Fechado agora';
    el.classList.toggle('is-open', open);
    el.hidden = false;
    var row = $('.hours tr[data-day="' + day + '"]');
    if (row) row.classList.add('is-today');
  })();

  /* ---------- Dúvidas | Sugestões ---------- */
  (function () {
    var f = $('#suggest');
    if (!f) return;
    var err = $('#suggest-error');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = f.nome.value.trim(), msg = f.mensagem.value.trim();
      if (!nome || !msg) {
        err.hidden = false;
        (nome ? f.mensagem : f.nome).focus();
        return;
      }
      err.hidden = true;
      window.open(waLink('Olá! Sou ' + nome + ' e tenho uma dúvida ou sugestão para a Digital Cell:\n\n' + msg, f.loja.value), '_blank', 'noopener');
    });
  })();

  /* ---------- Logo lateral: reserva no celular a largura que ele ocupa ---------- */
  (function () {
    var rail = $('.rail');
    if (!rail || !('ResizeObserver' in window)) return;
    var sec = rail.parentNode, last = 0;
    function fit() {
      var w = Math.round(rail.getBoundingClientRect().width);
      if (Math.abs(w - last) > 1) { last = w; sec.style.setProperty('--rail-w', w + 'px'); }
    }
    new ResizeObserver(fit).observe(sec);
    rail.addEventListener('load', fit);
  })();

  /* ---------- WhatsApp flutuante ---------- */
  (function () {
    var fab = $('#fab'), hero = $('#hero');
    if (!fab || !hero || !('IntersectionObserver' in window)) { if (fab) fab.classList.add('is-visible'); return; }
    new IntersectionObserver(function (es) {
      fab.classList.toggle('is-visible', !es[0].isIntersecting);
    }, { threshold: 0.25 }).observe(hero);
  })();
})();
