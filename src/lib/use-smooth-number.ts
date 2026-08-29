import { useEffect, useRef, useState } from "react";

/** Smoothly tweens a number toward its target so the score "reacts" instead of jumping. */
export function useSmoothNumber(target: number, stiffness = 0.12) {
  const [value, setValue] = useState(target);
  const raf = useRef<number | null>(null);
  const current = useRef(target);

  useEffect(() => {
    const tick = () => {
      const diff = target - current.current;
      if (Math.abs(diff) < 0.05) {
        current.current = target;
        setValue(target);
        raf.current = null;
        return;
      }
      current.current += diff * stiffness;
      setValue(current.current);
      raf.current = requestAnimationFrame(tick);
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, stiffness]);

  return value;
}
