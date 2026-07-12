// ─────────────────────────────────────────────
// LS CUSTOMS WHEELS — Telegram Mini App
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
  view: "cats",          // cats | list | cart  (внутри каталога)
  category: null,
  cart: [],              // [{ id, qty }]
  form: { brand: "", model: "", year: "", phone: "", comment: "" },
  fb:   { topic: "Вопрос", phone: "", city: "", message: "" },
};

const screen = document.getElementById("screen");
const cartBadge = document.getElementById("cartBadge");

const fmt = (n) => n.toLocaleString("ru-RU") + " ₽";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STOCK = {
  in:    { label: "В наличии",          cls: "ok"  },
  last:  { label: "Последний комплект", cls: "hot" },
  order: { label: "Под заказ · 7 дней", cls: "dim" },
};

function haptic(type) {
  if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type || "light");
}

function product(id) { return PRODUCTS.find((p) => p.id === id); }

function cartTotal() {
  return state.cart.reduce((s, i) => s + product(i.id).price * i.qty, 0);
}

function cartCount() {
  return state.cart.reduce((s, i) => s + i.qty, 0);
}

// ── Рендер ───────────────────────────────────

function render() {
  if (state.tab === "catalog") {
    if (state.view === "cats") renderCategories();
    else if (state.view === "list") renderProducts();
    else renderCart();
  } else if (state.tab === "feedback") {
    renderFeedback();
  } else {
    renderTryon();
  }

  const n = cartCount();
  cartBadge.hidden = n === 0;
  cartBadge.textContent = n;

  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === state.tab));

  updateMainButton();
}

function renderCategories() {
  screen.innerHTML = `
    <div class="h1">Каталог</div>
    <div class="sub">Топовый выбор сезона · ограниченные партии</div>
    <div class="banner">🏁 Напишите авто при оформлении — проверим совместимость перед отправкой</div>
    <div class="cat-grid">
      ${CATEGORIES.map((c) => `
        <button class="cat-card" data-action="open-cat" data-id="${c.id}">
          <span class="cat-ico">${c.icon}</span>
          <span class="cat-name">${c.name}</span>
          <span class="cat-note">${c.note}</span>
        </button>`).join("")}
    </div>`;
}

function renderProducts() {
  const cat = CATEGORIES.find((c) => c.id === state.category);
  const items = PRODUCTS.filter((p) => p.cat === state.category);
  screen.innerHTML = `
    <button class="back-link" data-action="back-cats">← Все категории</button>
    <div class="h1">${cat.icon} ${cat.name}</div>
    <div class="sub">${cat.note}</div>
    ${items.map((p) => {
      const st = STOCK[p.stock];
      const inCart = state.cart.some((i) => i.id === p.id);
      return `
      <div class="product">
        <div class="p-img">${p.icon}</div>
        <div class="p-body">
          <div class="p-name">${p.name}</div>
          <div class="p-spec">${p.spec}</div>
          <div class="badges">
            <span class="badge ${st.cls}">${st.label}</span>
            <span class="badge tag">${p.style}</span>
          </div>
          <div class="p-row">
            <span class="p-price">${fmt(p.price)}</span>
            <button class="btn ${inCart ? "added" : "btn-accent"}" data-action="add" data-id="${p.id}">
              ${inCart ? "✓ В корзине" : "В корзину"}
            </button>
          </div>
        </div>
      </div>`;
    }).join("")}`;
}

function renderCart() {
  if (state.cart.length === 0) {
    screen.innerHTML = `
      <button class="back-link" data-action="back-cats">← В каталог</button>
      <div class="h1">Корзина</div>
      <div class="empty">Корзина пуста.<br>Соберите свой сетап в каталоге 🔧</div>`;
    return;
  }

  const f = state.form;
  screen.innerHTML = `
    <button class="back-link" data-action="back-cats">← В каталог</button>
    <div class="h1">Корзина</div>
    <div class="sub">Проверьте состав и оставьте контакты</div>

    ${state.cart.map((i) => {
      const p = product(i.id);
      return `
      <div class="cart-item">
        <div class="p-img" style="width:48px;height:48px;font-size:22px;">${p.icon}</div>
        <div class="ci-body">
          <div class="ci-name">${p.name}</div>
          <div class="ci-price">${fmt(p.price)} / шт</div>
        </div>
        <div class="qty">
          <button data-action="qty-minus" data-id="${p.id}">−</button>
          <span>${i.qty}</span>
          <button data-action="qty-plus" data-id="${p.id}">+</button>
        </div>
      </div>`;
    }).join("")}

    <div class="total-row">
      <span class="sub" style="margin:0">Итого</span>
      <span class="p-price">${fmt(cartTotal())}</span>
    </div>

    <div class="h1" style="margin-top:14px">Ваше авто</div>
    <div class="grid-3">
      <div class="field"><label>Марка</label><input id="f-brand" value="${esc(f.brand)}" placeholder="BMW"></div>
      <div class="field"><label>Модель</label><input id="f-model" value="${esc(f.model)}" placeholder="M3 G80"></div>
      <div class="field"><label>Год</label><input id="f-year" value="${esc(f.year)}" placeholder="2022" inputmode="numeric"></div>
    </div>

    <div class="field"><label>Телефон *</label><input id="f-phone" value="${esc(f.phone)}" placeholder="+7 900 000-00-00" inputmode="tel"></div>
    <div class="field"><label>Комментарий</label><textarea id="f-comment" placeholder="Цвет, сроки, вопросы...">${esc(f.comment)}</textarea></div>

    <button class="btn btn-accent btn-block" data-action="submit-order">🏁 Оформить заказ · ${fmt(cartTotal())}</button>`;
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
    <div class="h1">ИИ-примерка обвеса</div>
    <div class="sub">Раздел в разработке</div>
    <div class="stub">
      <span class="s-ico">🔧</span>
      <div class="h1" style="margin-bottom:0">Скоро</div>
      <p>Здесь можно будет загрузить фото своей машины — и ИИ покажет, как она будет выглядеть с новым капотом, дисками или обвесом.</p>
      <p>Следите за обновлениями 🏁</p>
    </div>`;
}

// ── MainButton (нативная кнопка Telegram) ────

let mainBtnBound = false;

function updateMainButton() {
  if (!tg || !tg.MainButton) return;
  const showCheckout =
    state.tab === "catalog" && state.view !== "cart" && cartCount() > 0;

  if (showCheckout) {
    tg.MainButton.setParams({
      text: `КОРЗИНА · ${fmt(cartTotal())}`,
      color: "#e10600",
      text_color: "#ffffff",
      is_visible: true,
    });
    if (!mainBtnBound) {
      tg.MainButton.onClick(() => {
        state.tab = "catalog";
        state.view = "cart";
        render();
      });
      mainBtnBound = true;
    }
  } else {
    tg.MainButton.hide();
  }
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
  syncCartInputs();
  if (!state.form.phone.trim()) {
    if (tg) tg.showAlert("Укажите телефон — менеджер подтвердит заказ и совместимость.");
    else alert("Укажите телефон");
    return;
  }
  haptic("medium");
  sendToBot({
    type: "order",
    items: state.cart.map((i) => {
      const p = product(i.id);
      return { id: p.id, name: p.name, qty: i.qty, price: p.price };
    }),
    total: cartTotal(),
    car: `${state.form.brand} ${state.form.model} ${state.form.year}`.trim(),
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

function syncCartInputs() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
  state.form.brand = get("f-brand");
  state.form.model = get("f-model");
  state.form.year = get("f-year");
  state.form.phone = get("f-phone");
  state.form.comment = get("f-comment");
}

function syncFeedbackInputs() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
  state.fb.topic = get("fb-topic") || state.fb.topic;
  state.fb.phone = get("fb-phone");
  state.fb.city = get("fb-city");
  state.fb.message = get("fb-message");
}

// ── События ──────────────────────────────────

screen.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id, topic } = btn.dataset;

  if (action === "open-cat") {
    haptic();
    state.category = id;
    state.view = "list";
    render();
  } else if (action === "back-cats") {
    state.view = "cats";
    render();
  } else if (action === "add") {
    haptic();
    const item = state.cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else state.cart.push({ id, qty: 1 });
    render();
  } else if (action === "qty-plus" || action === "qty-minus") {
    syncCartInputs();
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += action === "qty-plus" ? 1 : -1;
    if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
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
  if (state.tab === "catalog" && state.view === "cart") syncCartInputs();
  if (state.tab === "feedback") syncFeedbackInputs();
  state.tab = tab.dataset.tab;
  render();
});

document.getElementById("cartBtn").addEventListener("click", () => {
  haptic();
  if (state.tab === "catalog" && state.view === "cart") syncCartInputs();
  if (state.tab === "feedback") syncFeedbackInputs();
  state.tab = "catalog";
  state.view = "cart";
  render();
});

render();
