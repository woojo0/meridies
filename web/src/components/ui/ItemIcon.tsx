"use client";

import {
  Bird, Cookie, Egg, FileText, Flower2, FlaskConical, Gift, Key, Lamp, Scroll, Shirt, Stamp, Sparkles, Watch, type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  stamp: Stamp,
  bird: Bird,
  bracelet: Watch,
  lantern: Lamp,
  flower: Flower2,
  scroll: Scroll,
  note: FileText,
  cookie: Cookie,
  egg: Egg,
  bottle: FlaskConical,
  key: Key,
  doll: Sparkles,
  gift: Gift,
  scarf: Shirt,
};

export function ItemIcon({ icon, size = 22, className, strokeWidth = 1.5 }: { icon: string; size?: number; className?: string; strokeWidth?: number }) {
  const I = MAP[icon] ?? Sparkles;
  return <I size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}

/** 상점·인벤토리용 정사각 아트 박스. */
export function ItemArt({ icon, className, size = 34 }: { icon: string; className?: string; size?: number }) {
  return (
    <div className={`grid aspect-square place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--sunk),var(--gold-soft))] text-gold ${className ?? ""}`}>
      <ItemIcon icon={icon} size={size} strokeWidth={1.25} />
    </div>
  );
}
