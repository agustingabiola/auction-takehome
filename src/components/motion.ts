export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const fast = { duration: 0.12, ease: "easeOut" } as const;
export const base = { duration: 0.24, ease: "easeOut" } as const;
export const roll = { duration: 0.6, ease: EASE_OUT_EXPO } as const;
export const reducedFade = { duration: 0.15, ease: "linear" } as const;

export const STAGGER_S = 0.025;

/** Three cycles of 4 px over 300 ms. */
export const SHAKE_X = [0, -4, 4, -4, 4, 0];
export const shakeTransition = { duration: 0.3, ease: "easeInOut" } as const;
