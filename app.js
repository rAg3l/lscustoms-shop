// ─────────────────────────────────────────────
// LS CUSTOMS SHOP — Telegram Mini App
// Каталог дисков с фотогалереей и заказом в один тап
// ─────────────────────────────────────────────

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
  try {
    if (tg.isVersionAtLeast && tg.isVersionAtLeast("6.1")) {
      // на время интро — чёрная шапка, после — тёмная тема (см. finishIntro)
      tg.setHeaderColor("#000000");
      tg.setBackgroundColor("#000000");
    }
  } catch (e) { /* старые клиенты */ }
}

const state = {
  tab: "catalog",        // catalog | feedback
  view: "brands",        // brands | gallery | order  (внутри каталога)
  brand: null,           // id выбранной марки
  wheelId: null,         // id выбранных дисков (на экране заказа)
  form: { phone: "", comment: "" },
  fb:   { topic: "Вопрос", phone: "", city: "", message: "" },
};

const screen = document.getElementById("screen");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function haptic(type) {
  if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type || "light");
}

function wheel(id) { return WHEELS.find((w) => w.id === id); }

// ── Рендер ───────────────────────────────────

function render() {
  if (state.tab === "catalog") {
    if (state.view === "brands") renderBrands();
    else if (state.view === "gallery") renderGallery();
    else renderOrder();
  } else {
    renderFeedback();
  }

  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === state.tab));

  window.scrollTo(0, 0);
}

function renderBrands() {
  screen.innerHTML = `
    <div class="h1">Диски</div>
    <div class="sub">Выберите марку · ограниченные партии</div>
    ${BRANDS.map((b) => `
      <button class="brand-card" data-action="open-brand" data-id="${b.id}">
        <img src="img/${b.id}/1.jpg" alt="${b.name}" loading="lazy">
        <span class="brand-foot">
          <span class="brand-name">${b.name}</span>
          <span class="brand-count">${b.count} дизайнов →</span>
        </span>
      </button>`).join("")}`;
}

function renderGallery() {
  const brand = BRANDS.find((b) => b.id === state.brand);
  const items = WHEELS.filter((w) => w.brand === state.brand);
  screen.innerHTML = `
    <button class="back-link" data-action="back-brands">← Все марки</button>
    <div class="h1">${brand.name}</div>
    <div class="sub">Листайте и выбирайте — заказ в один тап</div>
    ${items.map((w) => `
      <div class="wheel-card">
        <img src="${w.img}" alt="${w.name}" loading="lazy">
        <div class="wheel-foot">
          <span class="wheel-name">${w.name}</span>
          <button class="btn btn-accent" data-action="want" data-id="${w.id}">🏁 Хочу эти</button>
        </div>
      </div>`).join("")}`;
}

function renderOrder() {
  const w = wheel(state.wheelId);
  const f = state.form;
  screen.innerHTML = `
    <button class="back-link" data-action="back-gallery">← Назад к ${BRANDS.find((b) => b.id === w.brand).name}</button>
    <div class="h1">Заказ</div>
    <div class="sub">Менеджер подтвердит наличие, размер и цену</div>

    <img class="order-img" src="${w.img}" alt="${w.name}">
    <div class="order-name">${w.name}</div>

    <div class="field"><label>Телефон *</label><input id="f-phone" value="${esc(f.phone)}" placeholder="+7 900 000-00-00" inputmode="tel"></div>
    <div class="field"><label>Комментарий</label><textarea id="f-comment" placeholder="Ваше авто, размер, цвет — всё, что важно">${esc(f.comment)}</textarea></div>

    <button class="btn btn-accent btn-block" data-action="submit-order">🏁 Отправить заявку</button>`;
}

function renderFeedback() {
  const f = state.fb;
  const topics = ["Вопрос", "Статус заказа", "Возврат / гарантия", "Связаться с менеджером", "Отзыв"];
  screen.innerHTML = `
    <div class="h1">Обратная связь</div>
    <div class="sub">Отвечаем быстро. В рабочее время — в течение 30 минут</div>

    <div class="quick-grid">
      <button class="quick-btn" data-action="fb-quick" data-topic="Статус заказа"><span class="q-ico">📦</span>Статус заказа</button>
      <button class="quick-btn" data-action="fb-quick" data-topic="Возврат / гарантия"><span class="q-ico">🛡️</span>Возврат</button>
      <button class="quick-btn" data-action="fb-quick" data-topic="Связаться с менеджером"><span class="q-ico">📞</span>Менеджер</button>
    </div>

    <div class="field"><label>Тема</label>
      <select id="fb-topic">
        ${topics.map((t) => `<option ${t === f.topic ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </div>
    <div class="field"><label>Телефон *</label><input id="fb-phone" value="${esc(f.phone)}" placeholder="+7 900 000-00-00" inputmode="tel"></div>
    <div class="field"><label>Город</label><input id="fb-city" value="${esc(f.city)}" placeholder="Москва"></div>
    <div class="field"><label>Сообщение</label><textarea id="fb-message" placeholder="Опишите вопрос или проблему...">${esc(f.message)}</textarea></div>

    <div class="banner">📎 Фото или видео проблемы можно отправить прямо в чат бота после заявки — приложим к обращению</div>

    <button class="btn btn-accent btn-block" data-action="submit-feedback">Отправить заявку</button>`;
}

// ── Отправка данных боту ─────────────────────

function sendToBot(payload) {
  const json = JSON.stringify(payload);
  if (tg && tg.initData) {
    try {
      tg.sendData(json); // работает при запуске через кнопку клавиатуры; закрывает Mini App
      return true;
    } catch (e) {
      tg.showAlert("Не удалось отправить. Откройте магазин через кнопку «🏁 Открыть магазин» в чате бота.");
      return false;
    }
  }
  alert("Демо-режим (вне Telegram). Данные:\n" + json);
  return false;
}

function validPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function submitOrder() {
  syncOrderInputs();
  const phone = state.form.phone.trim();
  if (!validPhone(phone)) {
    if (tg) tg.showAlert("Укажите корректный телефон — менеджер подтвердит заказ, размер и цену.");
    else alert("Укажите корректный телефон");
    return;
  }
  haptic("medium");
  const w = wheel(state.wheelId);
  sendToBot({
    type: "order",
    item: w.name,
    phone,
    comment: state.form.comment.trim().slice(0, 500),
  });
}

function submitFeedback() {
  syncFeedbackInputs();
  const phone = state.fb.phone.trim();
  if (!validPhone(phone)) {
    if (tg) tg.showAlert("Укажите корректный телефон для обратного звонка.");
    else alert("Укажите корректный телефон");
    return;
  }
  haptic("medium");
  sendToBot({
    type: "feedback",
    topic: state.fb.topic,
    phone,
    city: state.fb.city.trim().slice(0, 64),
    message: state.fb.message.trim().slice(0, 800),
  });
}

function syncOrderInputs() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
  if (document.getElementById("f-phone")) {
    state.form.phone = get("f-phone");
    state.form.comment = get("f-comment");
  }
}

function syncFeedbackInputs() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
  if (document.getElementById("fb-phone")) {
    state.fb.topic = get("fb-topic") || state.fb.topic;
    state.fb.phone = get("fb-phone");
    state.fb.city = get("fb-city");
    state.fb.message = get("fb-message");
  }
}

function syncAll() {
  syncOrderInputs();
  syncFeedbackInputs();
}

// ── События ──────────────────────────────────

screen.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id, topic } = btn.dataset;

  if (action === "open-brand") {
    haptic();
    state.brand = id;
    state.view = "gallery";
    render();
  } else if (action === "back-brands") {
    state.view = "brands";
    render();
  } else if (action === "want") {
    haptic();
    state.wheelId = id;
    state.view = "order";
    render();
  } else if (action === "back-gallery") {
    syncOrderInputs();
    state.view = "gallery";
    render();
  } else if (action === "submit-order") {
    submitOrder();
  } else if (action === "fb-quick") {
    syncFeedbackInputs();
    state.fb.topic = topic;
    render();
  } else if (action === "submit-feedback") {
    submitFeedback();
  }
});

document.querySelector(".tabbar").addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab || tab.dataset.tab === state.tab) return;
  haptic();
  syncAll();
  state.tab = tab.dataset.tab;
  render();
});

render();

// ─────────────────────────────────────────────
// Интро: Porsche 911 (техно-чертёж) разгоняется, разбирается
// на детали, частицы собираются в логотип «LS CUSTOMS SHOP»
// Таймлайн: выезд → разгон → разборка → вихрь-сборка → чёткий логотип
// ─────────────────────────────────────────────

function startIntro() {
  const overlay = document.getElementById("intro");
  const canvas = document.getElementById("intro-canvas");
  if (!overlay || !canvas) return;

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) { finishIntro(overlay, true); return; }

  // webview мог ещё не отдать размеры — пробуем чуть позже, потом пропускаем интро
  if (!window.innerWidth || !window.innerHeight) {
    if (!startIntro._retried) {
      startIntro._retried = true;
      setTimeout(startIntro, 300);
    } else {
      finishIntro(overlay, true);
    }
    return;
  }

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.scale(DPR, DPR);

  const CX = W / 2, CY = H / 2;

  // ── Финальный текст: авто-подгонка под 88% ширины экрана ──
  function fitLayout() {
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = '700 100px "JetBrains Mono", monospace';
    const w100 = probe.measureText("LS CUSTOMS").width || 600;
    const size = Math.min((W * 0.88 / w100) * 100, 150);
    return {
      size,
      line1: { text: "LS CUSTOMS", font: `700 ${size}px "JetBrains Mono", monospace`, y: CY - size * 0.5 },
      line2: { text: "S H O P",    font: `500 ${size * 0.52}px "JetBrains Mono", monospace`, y: CY + size * 0.62 },
    };
  }

  const layout = fitLayout();

  function drawSolidText(c, alpha) {
    c.globalAlpha = alpha;
    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = layout.line1.font;
    c.fillText(layout.line1.text, CX, layout.line1.y);
    c.font = layout.line2.font;
    c.fillText(layout.line2.text, CX, layout.line2.y);
    c.globalAlpha = 1;
  }

  // Чёткий логотип с тонким оранжевым свечением — рендерим один раз
  const solidCv = document.createElement("canvas");
  solidCv.width = W * DPR; solidCv.height = H * DPR;
  {
    const sc = solidCv.getContext("2d");
    sc.scale(DPR, DPR);
    sc.shadowColor = "rgba(255, 122, 26, 0.38)";
    sc.shadowBlur = 14;
    drawSolidText(sc, 1);
    sc.shadowBlur = 0;
    drawSolidText(sc, 1);
    drawSolidText(sc, 1);
  }

  // Точки-цели: растрируем текст на скрытом канвасе
  function textTargets() {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d");
    drawSolidText(octx, 1);

    const data = octx.getImageData(0, 0, W, H).data;
    const pts = [];
    const step = 2;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    const MAX = 2600;
    if (pts.length > MAX) {
      const ratio = pts.length / MAX;
      return pts.filter((_, i) => i % Math.ceil(ratio) === 0);
    }
    return pts;
  }

  const targets = textTargets();
  if (!targets.length) { finishIntro(overlay, true); return; }

  // ── Машина: контурный Porsche 911 в локальных координатах 200×61 ──
  const CARL = Math.min(W * 0.62, 340);
  const s = CARL / 200;                       // масштаб локальных единиц
  const GY = CY + Math.min(H * 0.16, 120);    // линия дороги

  // Детали: t — момент отрыва (сек), v — [vx, vy, вращение], q — доля частиц
  const PARTS_DEF = [
    { name: "hood", pivot: [33, 28], t: 3.0, v: [2.2, -3.4, -0.055], q: 0.07,
      strokes: [[[10, 29], [30, 26], [52, 25]], [[52, 25], [55, 31], [56, 38]]] },
    { name: "glass", pivot: [87, 18], t: 3.25, v: [1.6, -2.6, 0.05], q: 0.07,
      strokes: [[[64, 24], [79, 12]], [[67, 24], [81, 13], [100, 12], [107, 23], [67, 24]]] },
    { name: "door", pivot: [85, 36], t: 3.5, v: [0.6, 1.4, 0.09], q: 0.14, text: true,
      strokes: [[[63, 24], [62.5, 47]], [[62.5, 47], [106, 47]], [[106, 47], [107, 24]], [[68, 30], [77, 30]]] },
    { name: "spoiler", pivot: [183, 24], t: 3.75, v: [3.0, -2.4, -0.09], q: 0.07,
      strokes: [[[150, 20], [166, 25], [182, 28.5]], [[176, 23], [197, 20]], [[197, 20], [199, 25]], [[189, 27.5], [191, 21.5]]] },
    { name: "trim", pivot: [100, 46], t: 4.0, v: [0.5, 1.8, 0.11], q: 0.08,
      strokes: [[[2, 44], [14, 44]], [[186, 44], [198, 44]], [[58, 50], [146, 50]]] },
    { name: "shell", pivot: [100, 30], t: 4.3, v: [1.6, -1.4, -0.028], q: 0.32,
      strokes: [[[0, 40], [3, 33], [10, 29], [30, 26], [52, 25], [62, 23], [78, 10], [95, 6], [112, 6], [128, 10], [143, 17], [158, 24], [172, 28], [185, 31], [196, 34], [199, 38], [200, 42], [197, 49], [190, 52], [175, 52], [172, 42], [165, 34.5], [156, 33], [148, 37], [144.5, 45], [144, 52], [56, 52], [52.5, 42], [45.5, 34.5], [36.5, 33], [28.5, 37], [25, 45], [24.5, 52], [16, 52], [6, 48], [2, 44], [0, 40]]] },
  ];

  const wheelObjs = [
    { cx: 160, r: 13, t: 4.7,  q: 0.13, x: 0, y: GY - 13 * s, vx: 0, ang: 0, alive: true, free: false },
    { cx: 40,  r: 13, t: 4.85, q: 0.12, x: 0, y: GY - 13 * s, vx: 0, ang: 0, alive: true, free: false },
  ];

  // Предрасчёт сегментов для сэмплинга случайных точек на контурах
  for (const def of PARTS_DEF) {
    const segs = []; let total = 0;
    for (const line of def.strokes) {
      for (let i = 1; i < line.length; i++) {
        const dx = line[i][0] - line[i - 1][0], dy = line[i][1] - line[i - 1][1];
        const len = Math.hypot(dx, dy);
        if (!len) continue;
        segs.push({ x: line[i - 1][0], y: line[i - 1][1], dx, dy, len });
        total += len;
      }
    }
    def.segs = segs; def.total = total;
    def.flying = false; def.spawned = 0;
  }

  function samplePt(def) {
    let r = Math.random() * def.total;
    for (const g of def.segs) {
      if (r <= g.len) { const u = r / g.len; return [g.x + g.dx * u, g.y + g.dy * u]; }
      r -= g.len;
    }
    const g = def.segs[def.segs.length - 1];
    return [g.x + g.dx, g.y + g.dy];
  }

  // Квоты частиц: суммарно ровно targets.length
  let acc = 0;
  for (const def of PARTS_DEF) { def.quota = Math.floor(targets.length * def.q); acc += def.quota; }
  for (const w of wheelObjs)   { w.quota = Math.floor(targets.length * w.q); acc += w.quota; }
  PARTS_DEF[5].quota += targets.length - acc; // остаток — кузову

  // ── Пулы ──
  const parts = [];    // частицы, летящие в текст
  const sparks = [];   // оранжевые искры
  const lines = [];    // скоростные штрихи
  const dashes = Array.from({ length: 5 }, (_, i) => ({ x: i * W / 4 }));
  let tIndex = 0;

  function spawnParticle(x, y, vx, vy) {
    if (tIndex >= targets.length) return;
    const tgp = targets[tIndex++];
    parts.push({
      x, y, vx, vy, tx: tgp.x, ty: tgp.y,
      r: 0.6 + Math.random() * 1.1,
      glow: 0.35 + Math.random() * 0.65,
      orange: Math.random() < 0.14,
    });
  }

  function sparkBurst(x, y, n) {
    if (sparks.length > 380) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 2.2;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8, life: 0.6 + Math.random() * 0.4 });
    }
  }

  // Тёплое свечение (спрайт, рендерим один раз)
  const glowSprite = document.createElement("canvas");
  glowSprite.width = glowSprite.height = 128;
  {
    const g = glowSprite.getContext("2d");
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, "rgba(255, 130, 40, 0.55)");
    rg.addColorStop(0.5, "rgba(255, 110, 30, 0.18)");
    rg.addColorStop(1, "rgba(255, 110, 30, 0)");
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  }

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#000000");
  bgGrad.addColorStop(1, "#120c07");

  // ── Траектория машины ──
  const X0 = -CARL - 20, X1 = W * 0.16 - CARL / 2, X2 = W * 0.56 - CARL / 2, X3 = X2 + W * 0.09;
  function carXAt(t) {
    if (t < 1) { const u = t, e = u * u * (3 - 2 * u); return X0 + (X1 - X0) * e; }
    if (t < 3) { const u = (t - 1) / 2; return X1 + (X2 - X1) * u * u * u; }
    const u = Math.min((t - 3) / 1.5, 1);
    return X2 + (X3 - X2) * (1 - (1 - u) * (1 - u));
  }

  // Таймлайн (секунды)
  const T_GATHER = 5.0, T_TEXT = 8.0, T_SOLID = 9.0, T_END = 9.6;

  let start = null, done = false, prevX = null, leftoverDone = false, fallSparksDone = false;

  function drawStrokes(strokes, alpha) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#f8f5f0";
    ctx.beginPath();
    for (const line of strokes) {
      ctx.moveTo(line[0][0], line[0][1]);
      for (let i = 1; i < line.length; i++) ctx.lineTo(line[i][0], line[i][1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawDoorText(alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '700 7px "JetBrains Mono", monospace';
    ctx.fillText("LS CUSTOMS", 85, 38);
    ctx.globalAlpha = 1;
  }

  function drawWheel(w) {
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.ang);
    ctx.strokeStyle = "#f8f5f0";
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.95;
    const R = w.r * s;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.32, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566;
      ctx.moveTo(Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32);
      ctx.lineTo(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function sceneCar(t) {
    const x = carXAt(t);
    const speed = prevX === null ? 0 : x - prevX;
    prevX = x;
    const sn = Math.min(speed / (W * 0.016), 1); // нормированная скорость

    // свечение от асфальта под машиной
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.25 + sn * 0.55;
    ctx.drawImage(glowSprite, x + CARL / 2 - CARL * 0.7, GY - CARL * 0.14, CARL * 1.4, CARL * 0.4);
    ctx.globalAlpha = 1;

    // дорожная разметка бежит навстречу
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 140, 60, 0.10)";
    for (const d of dashes) {
      d.x -= speed * 1.1;
      if (d.x < -40) d.x += W + 40;
      ctx.fillRect(d.x, GY + 8, 26, 2);
    }

    // скоростные штрихи за машиной
    if (sn > 0.3 && lines.length < 26) {
      lines.push({
        x: x + Math.random() * CARL * 0.4,
        y: GY - (6 + Math.random() * 48) * s,
        len: speed * (2 + Math.random() * 2),
        a: 0.5,
      });
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      l.a -= 0.06;
      if (l.a <= 0) { lines.splice(i, 1); continue; }
      ctx.globalAlpha = l.a * 0.45;
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x - l.len, l.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // искры из-под задних колёс на разгоне
    if (t > 1.2 && t < 3.3 && sn > 0.25 && sparks.length < 300) {
      const rw = wheelObjs[0];
      for (let i = 0; i < 2; i++) {
        sparks.push({
          x: rw.x - rw.r * s * 0.5, y: GY - 2,
          vx: -speed * (0.35 + Math.random() * 0.4),
          vy: -(0.4 + Math.random() * 1.4),
          life: 0.5 + Math.random() * 0.4,
        });
      }
    }

    // отрыв деталей
    for (const def of PARTS_DEF) {
      if (!def.flying && t >= def.t) {
        def.flying = true;
        def.detachedAt = t;
        def.x = x + def.pivot[0] * s;
        def.y = GY + (def.pivot[1] - 61) * s;
        def.vx = def.v[0] * s * 0.55 + speed * 0.5;
        def.vy = def.v[1] * s * 0.55;
        def.vr = def.v[2];
        def.rot = 0;
        sparkBurst(def.x, def.y, 8);
      }
    }

    // привязанные детали (кузов едет, слегка задирая нос на разгоне)
    const pitch = (t > 1 && t < 3.2)
      ? -0.035 * Math.min((t - 1) * 2, 1) * Math.max(0, Math.min(1, (3.2 - t) * 1.6))
      : 0;
    ctx.save();
    ctx.translate(x, GY);
    ctx.scale(s, s);
    ctx.translate(0, -61);
    if (pitch) { ctx.translate(160, 48); ctx.rotate(pitch); ctx.translate(-160, -48); }
    ctx.lineWidth = 1.8 / s * Math.min(s, 1.6);
    ctx.lineJoin = "round";
    for (const def of PARTS_DEF) {
      if (!def.flying) {
        drawStrokes(def.strokes, 0.95);
        if (def.text) drawDoorText(0.9);
      }
    }
    ctx.restore();

    // летящие детали: физика, распад на частицы, отрисовка
    for (const def of PARTS_DEF) {
      if (!def.flying || def.spawned >= def.quota && def.doneDrawn) continue;
      if (def.detachedAt === undefined) continue;
      def.x += def.vx; def.y += def.vy;
      def.vy += 0.05 * s;
      def.rot += def.vr;
      const age = t - def.detachedAt;
      const prog = Math.min(Math.max((age - 0.12) / 0.5, 0), 1);
      const want = Math.round(def.quota * prog);
      const cos = Math.cos(def.rot), sin = Math.sin(def.rot);
      while (def.spawned < want) {
        const [lx0, ly0] = samplePt(def);
        const lx = lx0 - def.pivot[0], ly = ly0 - def.pivot[1];
        spawnParticle(
          def.x + (cos * lx - sin * ly) * s,
          def.y + (sin * lx + cos * ly) * s,
          def.vx * 0.35 + (Math.random() - 0.5) * 1.6,
          def.vy * 0.35 + (Math.random() - 0.5) * 1.6
        );
        def.spawned++;
      }
      const alpha = 1 - prog;
      if (alpha > 0.03) {
        ctx.save();
        ctx.translate(def.x, def.y);
        ctx.rotate(def.rot);
        ctx.scale(s, s);
        ctx.translate(-def.pivot[0], -def.pivot[1]);
        ctx.lineWidth = 1.8 / s * Math.min(s, 1.6);
        ctx.lineJoin = "round";
        drawStrokes(def.strokes, alpha * 0.95);
        if (def.text) drawDoorText(alpha * 0.9);
        ctx.restore();
      } else {
        def.doneDrawn = true;
      }
    }

    // колёса: с кузовом до его отрыва, дальше катятся сами и распадаются
    const shellFlying = PARTS_DEF[5].flying;
    for (const w of wheelObjs) {
      if (!w.alive) continue;
      const R = w.r * s;
      if (!shellFlying) {
        w.x = x + w.cx * s;
        w.ang += speed / R;
      } else {
        if (!w.free) { w.free = true; w.vx = Math.max(speed * 1.4, 2.4 * s); }
        w.x += w.vx;
        w.vx *= 0.99;
        w.ang += w.vx / R;
      }
      if (t >= w.t) {
        // распад колеса: частицы по ободу + сноп искр
        for (let i = 0; i < w.quota; i++) {
          const a = Math.random() * Math.PI * 2;
          const rr = R * (0.35 + Math.random() * 0.65);
          spawnParticle(
            w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr,
            w.vx * 0.4 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2
          );
        }
        sparkBurst(w.x, w.y, 16);
        w.alive = false;
        continue;
      }
      drawWheel(w);
    }
  }

  function updateSparks() {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#ff8c3a";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx; sp.y += sp.vy;
      sp.vy += 0.11;
      sp.life -= 0.018;
      if (sp.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(sp.life, 1) * 0.85;
      ctx.fillRect(sp.x, sp.y, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
  }

  function updateParticles(t) {
    ctx.globalCompositeOperation = "lighter";
    if (t < T_GATHER) {
      // свободный полёт после распада деталей
      for (const p of parts) {
        p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.02;
        p.x += p.vx; p.y += p.vy;
        drawP(p, p.glow * 0.85);
      }
    } else if (t < T_TEXT) {
      // вихрь → пружина к букве (плавная долгая сборка)
      const k = Math.min((t - T_GATHER) / (T_TEXT - T_GATHER), 1);
      const ease = k * k * (3 - 2 * k);
      const spring = 0.008 + ease * 0.10;
      const damp = 0.90 - ease * 0.08;
      const swirl = (1 - ease) * 0.28;
      for (const p of parts) {
        const dx = CX - p.x, dy = CY - p.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        p.vx += (-dy / d) * swirl + (p.tx - p.x) * spring;
        p.vy += (dx / d) * swirl + (p.ty - p.y) * spring;
        p.vx *= damp; p.vy *= damp;
        p.x += p.vx; p.y += p.vy;
        drawP(p, p.glow + ease * 0.5);
      }
    } else if (t < T_SOLID) {
      // сплавление: частицы дожимаются, поверх проступает чёткий логотип
      const k = Math.min((t - T_TEXT) / (T_SOLID - T_TEXT), 1);
      for (const p of parts) {
        p.x += (p.tx - p.x) * 0.25;
        p.y += (p.ty - p.y) * 0.25;
        drawP(p, (1 - k) * 0.9 + 0.1);
      }
    }
  }

  function drawP(p, alpha) {
    ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
    ctx.fillStyle = p.orange ? "#ffb066" : "#fff";
    ctx.fillRect(p.x, p.y, p.r, p.r);
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (done) return;
    if (start === null) {
      start = now;
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }
    const t = (now - start) / 1000;

    // лёгкий шлейф вместо полной очистки — эффект motion blur
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // линия дороги
    ctx.strokeStyle = "rgba(255, 160, 80, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, GY + 2); ctx.lineTo(W, GY + 2); ctx.stroke();

    if (t < T_GATHER) sceneCar(t);

    // страховка: если какие-то частицы не заспавнились — добираем
    if (t >= 4.95 && !leftoverDone) {
      leftoverDone = true;
      while (tIndex < targets.length) {
        spawnParticle(
          W * (0.4 + Math.random() * 0.4), GY - Math.random() * 60 * s,
          (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2
        );
      }
    }

    updateParticles(t);
    updateSparks();

    // чёткий сплошной логотип с оранжевым свечением
    if (t >= T_TEXT) {
      const k = Math.min(t - T_TEXT, 1);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = k;
      ctx.drawImage(solidCv, 0, 0, W, H);
      ctx.globalAlpha = 1;
      if (!fallSparksDone && t >= T_TEXT + 0.1) {
        fallSparksDone = true;
        // пара искр падает вниз, как остывающий металл
        for (let i = 0; i < 6; i++) {
          sparks.push({
            x: CX + (Math.random() - 0.5) * layout.size * 4,
            y: CY + layout.size * 0.9,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.4 + Math.random() * 0.8,
            life: 0.9,
          });
        }
      }
    }

    if (t >= T_END) { finishIntro(overlay); done = true; return; }
    requestAnimationFrame(frame);
  }

  overlay.addEventListener("click", () => {
    if (!done) { done = true; finishIntro(overlay); }
  }, { once: true });

  requestAnimationFrame(frame);
}

// Ждём загрузку шрифта (не дольше 600 мс), чтобы буквы растрировались правильно
if (document.fonts && document.fonts.load) {
  Promise.race([
    document.fonts.load('700 64px "JetBrains Mono"'),
    new Promise((r) => setTimeout(r, 600)),
  ]).then(startIntro, startIntro);
} else {
  startIntro();
}

function finishIntro(overlay, instant) {
  try {
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast("6.1")) {
      tg.setHeaderColor("#120c07");
      tg.setBackgroundColor("#120c07");
    }
  } catch (e) { /* старые клиенты */ }
  if (instant) { overlay.remove(); return; }
  overlay.classList.add("fade");
  setTimeout(() => overlay.remove(), 1150);
}
