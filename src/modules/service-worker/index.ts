/** @internal Service Worker module — registry + message protocol. */
export { registerServiceWorker, unregisterServiceWorker, updateServiceWorker, getActiveRegistration } from "./registry";
export type { RegistrationOptions } from "./registry";
export { SW_MESSAGE_TYPES } from "./messages";
export type { SWMessageType, SWMessage } from "./messages";
