"use client";
import { useState } from "react";
import { RollingNumber } from "@/components/RollingNumber";
import { formatMoney, secondsToClock } from "@/lib/format";

export default function RollingHarness() {
  const [price, setPrice] = useState(950);
  const [secs, setSecs] = useState(180);
  return (
    <main className="p-8 space-y-6">
      <RollingNumber value={price} format={formatMoney} className="text-7xl font-semibold" />
      <div className="space-x-2">
        <button className="border px-3 py-1" onClick={() => setPrice((p) => p + 50)}>
          +50
        </button>
        <button className="border px-3 py-1" onClick={() => setPrice((p) => p - 50)}>
          -50
        </button>
        <button className="border px-3 py-1" onClick={() => setPrice(950)}>
          reset
        </button>
      </div>
      <RollingNumber value={secs} format={secondsToClock} className="text-5xl" />
      <div className="space-x-2">
        <button className="border px-3 py-1" onClick={() => setSecs((s) => s - 1)}>
          tick
        </button>
        <button className="border px-3 py-1" onClick={() => setSecs((s) => s + 30)}>
          +30
        </button>
      </div>
    </main>
  );
}
