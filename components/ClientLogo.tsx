"use client";
import { useState } from "react";

type Props = {
  clientKey: string;
  name: string;
  domain: string;
  size?: number;
};

export default function ClientLogo({ clientKey, name, domain, size = 40 }: Props) {
  const [level, setLevel] = useState(0);

  const localSrc = `/logos/${clientKey}.png`;
  const clearbitSrc = domain ? `https://logo.clearbit.com/${domain}` : null;

  const handleError = () => {
    setLevel((prev) => {
      if (prev === 0) return clearbitSrc ? 1 : 2;
      return 2;
    });
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (level === 2) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 text-xs font-semibold text-paper"
      >
        {initials}
      </div>
    );
  }

  const src = level === 0 ? localSrc : clearbitSrc!;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-md bg-white object-contain"
      onError={handleError}
    />
  );
}
