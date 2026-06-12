const ANIMALS = ['wolf', 'fox', 'hawk', 'bear', 'lion', 'crow', 'lynx', 'bull', 'elk', 'owl']
const FRUITS = ['lime', 'plum', 'fig', 'kiwi', 'pear', 'mango', 'peach', 'grape', 'lemon', 'melon']
const FOOTBALL = ['goal', 'volley', 'chip', 'cross', 'dribble', 'tackle', 'header', 'assist', 'press', 'trap']

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomUsernamePlaceholder(): string {
  const football = pick(FOOTBALL)
  return Math.random() < 0.5
    ? `${pick(ANIMALS)}-${football}`
    : `${pick(FRUITS)}-${football}`
}
