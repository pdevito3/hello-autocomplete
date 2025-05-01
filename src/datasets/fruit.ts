export const fruits = [
  { value: "apple", label: "🍎 Apple" },
  { value: "banana", label: "🍌 Banana" },
  { value: "orange", label: "🍊 Orange" },
  { value: "strawberry", label: "🍓 Strawberry" },
  { value: "grape", label: "🍇 Grape" },
  { value: "watermelon", label: "🍉 Watermelon" },
  { value: "pineapple", label: "🍍 Pineapple" },
  { value: "kiwi", label: "🥝 Kiwi" },
  { value: "mango", label: "🥭 Mango" },
  { value: "cherry", label: "🍒 Cherry" },
  { value: "pear", label: "🍐 Pear" },
  { value: "peach", label: "🍑 Peach" },
  { value: "lemon", label: "🍋 Lemon" },
];

export type Fruit = (typeof fruits)[number];
