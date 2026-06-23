/** Single source of truth for placing the live terminal in the photo's CRT glass,
 * and for the zoom-in framing. All cutout values are % of the chassis image. */
export const CUTOUT = { left: 45.4, top: 35.0, width: 12.5, height: 14.5 } as const;

/** Desktop uses the pulled-back room photo (machineLarge.png, 1672×941) so the whole room shows
 * un-zoomed; the computer (and its CRT glass) sits small and centered. */
export const CUTOUT_LARGE = { left: 46.8, top: 47.1, width: 4.38, height: 6.8 } as const;

/** Desktop tap/space-to-zoom: dive in from the wide room shot so the file list reads. */
export const ZOOM_LARGE = {
  originX: 49, originY: 50.3,
  translateX: 0, translateY: 0,
  scale: 4.3,
} as const;

/** Wide room photo aspect (machineLarge.png). */
export const IMAGE_ASPECT_LARGE = "1672 / 941";

/** Same, but for the portrait phone photo (machineMobile.png, 941×1672). The cutout is applied via
 * the `.machine-frame .crt-glass` media query in globals.css; the zoom framing is used from JS. */
export const CUTOUT_MOBILE = { left: 42.5, top: 46.0, width: 12.0, height: 6.0 } as const;

/** Phone tap-to-zoom: from the full portrait photo, dive into the computer so the file list reads. */
export const ZOOM_MOBILE = {
  originX: 48.4, originY: 49,
  translateX: 0, translateY: 0,
  scale: 3.4,
} as const;

/** Zoom-in transform: keeps the whole computer (incl. keyboard) in frame. */
export const ZOOM = {
  originX: 50, originY: 46,      // transform-origin %
  translateX: 0, translateY: 4, // %
  scale: 1.8,
} as const;

/** Scene fills the viewport at the image's aspect ratio. */
export const IMAGE_ASPECT = "1536 / 1024";
