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
      // на время интро — чёрная шапка, после — белая (см. finishIntro)
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
// Интро: взрыв белых частиц, собирающихся в «LS CUSTOMS»
// Таймлайн: тьма → взрыв → вихрь → сборка текста → затухание
// ─────────────────────────────────────────────

function startIntro() {
  const overlay = document.getElementById("intro");
  const canvas = document.getElementById("intro-canvas");
  if (!overlay || !canvas) return;

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) { finishIntro(overlay, true); return; }

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.scale(DPR, DPR);

  const CX = W / 2, CY = H / 2;

  // Точки-цели: растрируем текст на скрытом канвасе
  function textTargets() {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d");
    const size = Math.min(W * 0.16, 64);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `700 ${size}px "JetBrains Mono", monospace`;
    octx.fillText("LS CUSTOMS", CX, CY - size * 0.45);
    octx.font = `500 ${size * 0.5}px "JetBrains Mono", monospace`;
    octx.fillText("S H O P", CX, CY + size * 0.55);

    const data = octx.getImageData(0, 0, W, H).data;
    const pts = [];
    const step = 2;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    // прореживаем до ~2200 точек, чтобы держать 60 FPS на слабых телефонах
    const MAX = 2200;
    if (pts.length > MAX) {
      const ratio = pts.length / MAX;
      return pts.filter((_, i) => i % Math.ceil(ratio) === 0);
    }
    return pts;
  }

  const targets = textTargets();
  if (!targets.length) { finishIntro(overlay, true); return; }

  const parts = targets.map((t) => {
    const ang = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 12;
    return {
      x: CX, y: CY,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      tx: t.x, ty: t.y,
      r: 0.5 + Math.random() * 1.1,
      glow: 0.35 + Math.random() * 0.65,
    };
  });

  // «Космическая пыль» — частицы, которые не войдут в текст и растворятся
  const dust = Array.from({ length: 220 }, () => {
    const ang = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 14;
    return {
      x: CX, y: CY,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 0.4 + Math.random() * 0.9,
      life: 0.5 + Math.random() * 0.5,
    };
  });

  // Таймлайн (секунды)
  const T_DARK = 0.7, T_BOOM = 1.5, T_SWIRL = 3.2, T_FORM = 5.2, T_HOLD = 6.4;

  let start = null;
  let done = false;

  function frame(now) {
    if (done) return;
    if (start === null) start = now;
    const t = (now - start) / 1000;

    // лёгкий шлейф вместо полной очистки — эффект motion blur
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(0, 0, W, H);

    if (t < T_DARK) { requestAnimationFrame(frame); return; }

    ctx.globalCompositeOperation = "lighter";

    if (t < T_BOOM) {
      // фаза взрыва: разлёт с лёгким торможением
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.985; p.vy *= 0.985;
        draw(p, p.glow);
      }
    } else if (t < T_SWIRL) {
      // фаза вихря: тангенциальная сила вокруг центра + притяжение
      for (const p of parts) {
        const dx = CX - p.x, dy = CY - p.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        p.vx += (dx / d) * 0.10 + (-dy / d) * 0.22;
        p.vy += (dy / d) * 0.10 + (dx / d) * 0.22;
        p.vx *= 0.975; p.vy *= 0.975;
        p.x += p.vx; p.y += p.vy;
        draw(p, p.glow);
      }
    } else if (t < T_FORM) {
      // фаза сборки: пружина к целевой точке буквы
      const k = Math.min((t - T_SWIRL) / (T_FORM - T_SWIRL), 1);
      const spring = 0.012 + k * 0.14;
      for (const p of parts) {
        p.vx += (p.tx - p.x) * spring;
        p.vy += (p.ty - p.y) * spring;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
        draw(p, p.glow + k * 0.5);
      }
    } else {
      // фаза удержания: текст собран, лёгкое мерцание по краям
      for (const p of parts) {
        p.x += (p.tx - p.x) * 0.3;
        p.y += (p.ty - p.y) * 0.3;
        draw(p, 0.9 + Math.sin(t * 6 + p.tx) * 0.1);
      }
    }

    // пыль живёт во всех фазах после взрыва
    for (const d of dust) {
      if (d.life <= 0) continue;
      d.x += d.vx; d.y += d.vy;
      d.vx *= 0.99; d.vy *= 0.99;
      if (t > T_SWIRL) d.life -= 0.006;
      ctx.globalAlpha = Math.max(d.life * 0.5, 0);
      ctx.fillRect(d.x, d.y, d.r, d.r);
    }
    ctx.globalAlpha = 1;

    if (t >= T_HOLD) { finishIntro(overlay); done = true; return; }
    requestAnimationFrame(frame);
  }

  function draw(p, alpha) {
    ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x, p.y, p.r, p.r);
    ctx.globalAlpha = 1;
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
      tg.setHeaderColor("#ffffff");
      tg.setBackgroundColor("#ffffff");
    }
  } catch (e) { /* старые клиенты */ }
  if (instant) { overlay.remove(); return; }
  overlay.classList.add("fade");
  setTimeout(() => overlay.remove(), 950);
}
