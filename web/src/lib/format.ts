import { H } from "./constants";

export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const uid = () => Math.random().toString(36).slice(2, 10);
export const gIdx = (s: number) => Math.min(4, Math.floor(s / 100));

export function ago(t: number, now: number) {
  const d = (now - t) / 1000;
  if (d < 60) return "방금";
  if (d < 3600) return `${Math.floor(d / 60)}분 전`;
  if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
  const x = new Date(t);
  return `${x.getMonth() + 1}월 ${x.getDate()}일`;
}

export function fmtDur(ms: number) {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / H);
  const m = Math.floor((ms % H) / 60e3);
  const s = Math.floor((ms % 60e3) / 1000);
  return `${h}:${pad(m)}:${pad(s)}`;
}

export function money(g: number) {
  const t = Math.floor(g / 20);
  const r = g % 20;
  if (!t) return `${r}그로셴`;
  return r ? `${t}탈러 ${r}그로셴` : `${t}탈러`;
}

export function fmtDate(s: string) {
  const [, m, d] = s.split("-");
  return `${+m}월 ${+d}일`;
}

export function fmtDateLong(s: string) {
  const [y, m, d] = s.split("-");
  return `${y}년 ${+m}월 ${+d}일`;
}

export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");

/** Resize an uploaded image to ≤1080px and return a JPEG data URL. */
export function shrinkImage(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const k = Math.min(1, 1080 / Math.max(im.width, im.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(im.width * k);
        cv.height = Math.round(im.height * k);
        cv.getContext("2d")!.drawImage(im, 0, 0, cv.width, cv.height);
        res(cv.toDataURL("image/jpeg", 0.82));
      };
      im.src = r.result as string;
    };
    r.readAsDataURL(f);
  });
}
