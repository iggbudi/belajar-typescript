import { logout } from '../auth';
import { navigate } from '../router';

export function dashboardPage(): string {
  return `
    <header>
      <div class="header-row">
        <h1 id="greeting">Hello, World!</h1>
        <button id="logout-btn" class="btn-outline">Logout</button>
      </div>
      <p>Belajar TypeScript <span class="badge">PWA</span></p>
    </header>

    <section class="card">
      <h2>Function</h2>
      <button id="greet-btn">Greet TypeScript</button>
      <p id="greet-output" class="output"></p>
    </section>

    <section class="card">
      <h2>Interface &amp; Object</h2>
      <pre id="person-output" class="output"></pre>
    </section>

    <footer>
      <p>Check console for <code>console.log</code> output</p>
    </footer>
  `;
}

export function mountDashboard(): void {
  const greeting: string = "Hello, World!";
  console.log(greeting);
  document.querySelector<HTMLHeadingElement>('#greeting')!.textContent = greeting;

  function greet(name: string): void {
    const msg = `Hello, ${name}!`;
    console.log(msg);
    document.querySelector<HTMLParagraphElement>('#greet-output')!.textContent = msg;
  }

  document.querySelector<HTMLButtonElement>('#greet-btn')
    ?.addEventListener('click', () => greet('TypeScript'));

  interface Person {
    name: string;
    age: number;
  }

  const person: Person = { name: "Budi", age: 25 };
  console.log(`My name is ${person.name}, I'm ${person.age} years old`);
  document.querySelector<HTMLPreElement>('#person-output')!.textContent =
    JSON.stringify(person, null, 2);

  document.querySelector<HTMLButtonElement>('#logout-btn')
    ?.addEventListener('click', () => {
      logout();
      navigate('/login');
    });
}
