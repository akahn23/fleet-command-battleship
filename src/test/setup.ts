import '@testing-library/jest-dom/vitest';

if (!('PointerEvent' in window)) {
  Object.defineProperty(window, 'PointerEvent', { value: MouseEvent });
}
