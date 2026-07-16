// ─────────────────────────────────────────────
// LS CUSTOMS WHEELS — Telegram Mini App
// Каталог дисков с фотогалереей и заказом в один тап
// ─────────────────────────────────────────────

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
  try {
    if (tg.isVersionAtLeast && tg.isVersionAtLeast("6.1")) {
      tg.setHeaderColor("#0d0d0d");
      tg.setBackgroundColor("#0d0d0d");
    }
  } catch (e) { /* старые клиенты */ }
}

const state = {
  tab: "catalog",        // catalog | feedback | tryon
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
  } else if (state.tab === "feedback") {
    renderFeedback();
  } else {
    renderTryon();
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

function renderTryon() {
  screen.innerHTML = `
    <div class="h1">ИИ-примерка дисков</div>
    <div class="sub">Раздел в разработке</div>
    <div class="stub">
      <span class="s-ico">🔧</span>
      <div class="h1" style="margin-bottom:0">Скоро</div>
      <p>Здесь можно будет загрузить фото своей машины — и ИИ покажет, как она будет выглядеть с новыми дисками.</p>
      <p>Следите за обновлениями 🏁</p>
    </div>`;
}

// ── Отправка данных боту ─────────────────────

function sendToBot(payload) {
  const json = JSON.stringify(payload);
  if (tg && tg.initData) {
    try {
      tg.sendData(json); // работает при запуске через кнопку клавиатуры; закрывает Mini App
      return true;
    } catch (e) {
      tg.showAlert("Не удалось отправить. Откройте магазин через кнопку «🔧 Открыть магазин» в чате бота.");
      return false;
    }
  }
  alert("Демо-режим (вне Telegram). Данные:\n" + json);
  return false;
}

function submitOrder() {
  syncOrderInputs();
  if (!state.form.phone.trim()) {
    if (tg) tg.showAlert("Укажите телефон — менеджер подтвердит заказ, размер и цену.");
    else alert("Укажите телефон");
    return;
  }
  haptic("medium");
  const w = wheel(state.wheelId);
  sendToBot({
    type: "order",
    item: w.name,
    phone: state.form.phone.trim(),
    comment: state.form.comment.trim(),
  });
}

function submitFeedback() {
  syncFeedbackInputs();
  if (!state.fb.phone.trim()) {
    if (tg) tg.showAlert("Укажите телефон для обратного звонка.");
    else alert("Укажите телефон");
    return;
  }
  haptic("medium");
  sendToBot({
    type: "feedback",
    topic: state.fb.topic,
    phone: state.fb.phone.trim(),
    city: state.fb.city.trim(),
    message: state.fb.message.trim(),
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
