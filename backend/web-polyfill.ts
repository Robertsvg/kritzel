/** @file Polyfills functions that common/surveys/ might use but that don't exist on the backend.*/

globalThis.requestAnimationFrame = () => 123456789;
globalThis.cancelAnimationFrame = () => undefined;
