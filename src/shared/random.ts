export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomItem<T>(items: readonly T[]): T {
  if (!items.length) {
    throw new Error('Cannot choose an item from an empty array.');
  }
  return items[getRandomInteger(0, items.length - 1)];
}

export function getRandomItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = getRandomInteger(0, index);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, getRandomInteger(1, shuffled.length));
}
