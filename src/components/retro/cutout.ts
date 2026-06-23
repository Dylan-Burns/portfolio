/** Single source of truth for placing the live terminal in the photo's CRT glass,
 * and for the zoom-in framing. All cutout values are % of the chassis image. */
export const CUTOUT = { left: 41.4, top: 35.0, width: 12.5, height: 14.5 } as const;

/** Zoom-in transform: keeps the whole computer (incl. keyboard) in frame. */
export const ZOOM = {
  originX: 50, originY: 46,      // transform-origin %
  translateX: 0, translateY: 4, // %
  scale: 1.8,
} as const;

/** Scene fills the viewport at the image's aspect ratio. */
export const IMAGE_ASPECT = "1536 / 1024";
