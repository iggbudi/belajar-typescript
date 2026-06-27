import './style.css';

// ── Hello World ──
const greeting: string = "Hello, World!";
console.log(greeting);
document.querySelector<HTMLHeadingElement>('#greeting')!.textContent = greeting;

// ── Function ──
function greet(name: string): void {
  const msg = `Hello, ${name}!`;
  console.log(msg);
  document.querySelector<HTMLParagraphElement>('#greet-output')!.textContent = msg;
}

document.querySelector<HTMLButtonElement>('#greet-btn')
  ?.addEventListener('click', () => greet('TypeScript'));

// ── Interface & Object ──
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: "Budi",
  age: 25,
};

console.log(`My name is ${person.name}, I'm ${person.age} years old`);
document.querySelector<HTMLPreElement>('#person-output')!.textContent =
  JSON.stringify(person, null, 2);
