"use client";

import { useState, type AnimationEvent, type CSSProperties } from "react";
import { Leaf } from "@phosphor-icons/react";

type Props = { greeting: string; message: string };

export function SeasonIntro({ greeting, message }: Props) {
  const [done, setDone] = useState(false);
  if (done) return null;

  const finish = () => {
    try {
      sessionStorage.setItem("vs-intro", "1");
    } catch {}
    setDone(true);
  };

  const skip = () => {
    document.documentElement.style.setProperty("--intro-delay", "0ms");
    finish();
  };

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) finish();
  };

  return (
    <div className="intro" onClick={skip} onAnimationEnd={onAnimationEnd}>
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <span className="intro-fade flex items-center gap-2 text-sm font-medium text-leaf-soft">
          <Leaf size={18} weight="light" />
          Centro Vital Salud
        </span>
        <p className="font-display text-5xl font-semibold tracking-tight text-mist sm:text-7xl">
          {greeting.split(" ").map((word, i) => (
            <span
              key={i}
              className="intro-word mx-[0.12em] inline-block"
              style={{ "--i": i } as CSSProperties}
            >
              {word}
            </span>
          ))}
        </p>
        <p className="intro-fade max-w-md text-base text-mist/70 sm:text-lg">
          {message}
        </p>
      </div>
    </div>
  );
}

