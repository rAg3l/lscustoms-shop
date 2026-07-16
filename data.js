// ─────────────────────────────────────────────
// Каталог дисков. Чтобы добавить марку:
//  1) положите фото в webapp/img/<папка-марки>/1.jpg, 2.jpg, ...
//  2) добавьте марку в BRANDS (count = сколько фото)
//  3) запустите ./publish.sh
// ─────────────────────────────────────────────

const BRANDS = [
  { id: "lamborghini", name: "Lamborghini", count: 5 },
  { id: "rangerover",  name: "Range Rover", count: 10 },
];

// Список собирается автоматически: по одному «дизайну» на каждое фото
const WHEELS = [];
for (const b of BRANDS) {
  for (let i = 1; i <= b.count; i++) {
    WHEELS.push({
      id: `${b.id}-${i}`,
      brand: b.id,
      name: `${b.name} · дизайн №${i}`,
      img: `img/${b.id}/${i}.jpg`,
    });
  }
}
