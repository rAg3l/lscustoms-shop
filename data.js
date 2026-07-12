// ─────────────────────────────────────────────
// Каталог магазина. Редактируйте под свой ассортимент.
// stock: "in" — в наличии, "last" — последний комплект, "order" — под заказ
// style: "спорт" | "люкс" | "офф-роуд"
// ─────────────────────────────────────────────

const CATEGORIES = [
  { id: "wheels",      name: "Диски",      icon: "🛞", note: "Литые и кованые · R15–R22" },
  { id: "hoods",       name: "Капоты",     icon: "🏎️", note: "Сток · карбон · воздухозаборник" },
  { id: "bodykits",    name: "Обвесы",     icon: "🧩", note: "Бампера · пороги · спойлеры" },
  { id: "accessories", name: "Аксессуары", icon: "⚡", note: "Решётки · тонировка · свет" },
];

const PRODUCTS = [
  // Диски
  { id: "w1", cat: "wheels", name: "Vossen HF-3",        spec: "R20 · 5x112 · кованые",        price: 185000, style: "люкс",     stock: "last",  icon: "🛞" },
  { id: "w2", cat: "wheels", name: "BBS CH-R",           spec: "R19 · 5x120 · литые",          price: 148000, style: "спорт",    stock: "in",    icon: "🛞" },
  { id: "w3", cat: "wheels", name: "Enkei RPF1",         spec: "R18 · 5x114.3 · литые",        price: 96000,  style: "спорт",    stock: "in",    icon: "🛞" },
  { id: "w4", cat: "wheels", name: "Black Rhino Warlord", spec: "R17 · 6x139.7 · офф-роуд",    price: 112000, style: "офф-роуд", stock: "order", icon: "🛞" },

  // Капоты
  { id: "h1", cat: "hoods", name: "Карбоновый капот TS-style", spec: "Full carbon · вес −8 кг",       price: 78000, style: "спорт", stock: "in",    icon: "🏎️" },
  { id: "h2", cat: "hoods", name: "Капот GT с воздухозаборником", spec: "Стеклопластик · грунт",      price: 54000, style: "спорт", stock: "last",  icon: "🏎️" },
  { id: "h3", cat: "hoods", name: "Капот сток (оцинковка)",    spec: "OEM-геометрия · под окрас",     price: 32000, style: "люкс",  stock: "order", icon: "🏎️" },

  // Обвесы
  { id: "b1", cat: "bodykits", name: "Обвес M-Performance style", spec: "Бампер + пороги + диффузор", price: 88000, style: "спорт", stock: "in",   icon: "🧩" },
  { id: "b2", cat: "bodykits", name: "Спойлер-утка carbon",       spec: "Full carbon · 3M-крепёж",    price: 21000, style: "спорт", stock: "in",   icon: "🧩" },
  { id: "b3", cat: "bodykits", name: "Диффузор задний V2",        spec: "ABS-пластик · gloss black",  price: 18500, style: "люкс",  stock: "last", icon: "🧩" },

  // Аксессуары
  { id: "a1", cat: "accessories", name: "Решётка радиатора gloss black", spec: "Без эмблемы · ABS",   price: 12000, style: "люкс",  stock: "in",    icon: "⚡" },
  { id: "a2", cat: "accessories", name: "LED-оптика с ДХО",              spec: "Пара · ходовые огни", price: 45000, style: "спорт", stock: "in",    icon: "⚡" },
  { id: "a3", cat: "accessories", name: "Тонировка premium (комплект)",  spec: "Плёнка 5% / 15% / 35%", price: 8900, style: "люкс", stock: "order", icon: "⚡" },
];
