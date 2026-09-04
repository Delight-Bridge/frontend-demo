import { ChevronDown } from "lucide-react";
import { HERO_IMAGE } from "../../data/brand";

export function HeroSection() {
  return (
    <header
      id="top"
      className="hero-bg relative flex min-h-[calc(100svh-4rem)] w-full flex-col items-center justify-center px-6 py-16 text-center text-white"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />

      <div className="z-10 flex animate-fade-in flex-col items-center">
        <h1 className="mb-6 font-serif text-4xl font-bold leading-tight tracking-normal md:text-6xl">
          어둠 속에 빛을
          <br />
          전하는 생명줄
        </h1>
        <p className="max-w-md text-lg font-light text-gray-300 md:text-xl">
          받은 은혜로부터 출발하는
          <br />
          우리의 작은 디아코니아
        </p>
        <div className="mt-12">
          <span className="mb-12 inline-block rounded-full border border-white/30 px-4 py-1 text-sm uppercase tracking-widest backdrop-blur-sm">
            Delight Bridge
          </span>
        </div>
      </div>

      <a
        href="#attention"
        className="absolute bottom-8 z-10 flex animate-bounce-slow flex-col items-center text-white/70 transition hover:text-white"
        aria-label="우리 곁의 아픔 섹션으로 이동"
      >
        <span className="mb-2 text-xs font-light uppercase tracking-widest">Scroll</span>
        <ChevronDown size={24} aria-hidden="true" />
      </a>
    </header>
  );
}
