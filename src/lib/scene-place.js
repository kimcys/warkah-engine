// Where a model picture goes on a scene plate, so the chosen models stand exactly where the painted couple stood (same height, same feet line, same place).
// Pure arithmetic, used by scripts/compose-scenes.mjs and tested on its own.
//
// An anchor is how the painted figure sits in the plate, as fractions of the plate: cx = the middle of the figure across, feet = its feet line down from the top
// (more than 1 when the picture is cropped above the feet), h = its height from the top of the head to the feet. The model is cut to its own visible outline
// (`bbox`, in the model picture's pixels) and scaled so that outline has that height.

/**
 * @param {{ cx: number, feet: number, h: number }} anchor
 * @param {{ width: number, height: number }} plate   pixel size of the plate
 * @param {{ width: number, height: number }} bbox    pixel size of the model's visible outline
 * @returns {{ width: number, height: number, left: number, top: number }} the outline's size and its top-left corner on the plate (may lie partly outside it)
 */
export function placement(anchor, plate, bbox) {
  const height = Math.max(1, Math.round(anchor.h * plate.height));
  const width = Math.max(1, Math.round((bbox.width * height) / bbox.height));
  return {
    width, height,
    left: Math.round(anchor.cx * plate.width - width / 2),
    top: Math.round(anchor.feet * plate.height - height)
  };
}

/** The part of a placed picture that lies on the plate, as { sx, sy, w, h, dx, dy }: what to cut from the picture and where to lay it. Null when none shows. */
export function clipToPlate(p, plate) {
  const x0 = Math.max(0, p.left), y0 = Math.max(0, p.top);
  const x1 = Math.min(plate.width, p.left + p.width), y1 = Math.min(plate.height, p.top + p.height);
  if (x1 <= x0 || y1 <= y0) return null;
  return { sx: x0 - p.left, sy: y0 - p.top, w: x1 - x0, h: y1 - y0, dx: x0, dy: y0 };
}
