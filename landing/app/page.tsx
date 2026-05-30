import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { Solution } from "./components/Solution";
import { Architecture } from "./components/Architecture";
import { Install } from "./components/Install";
import { Usage } from "./components/Usage";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <Nav />
      <Hero />
      <Architecture />
      <Usage />
      <Install />
      <Solution />
      <Problem />
      <Footer />
    </main>
  );
}
