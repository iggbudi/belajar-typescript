// Hello World dengan TypeScript

const greeting: string = "Hello, World!";
console.log(greeting);

// Function dengan type
function greet(name: string): void {
  console.log(`Hello, ${name}!`);
}

greet("TypeScript");

// Interface & Object
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: "Budi",
  age: 25
};

console.log(`My name is ${person.name}, I'm ${person.age} years old`);
