import { clipToPlate, placement } from "../src/lib/scene-place.js";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

const plate = { width: 1144, height: 2560 };
const anchor = { cx: 0.42, feet: 0.883, h: 0.218 };           // the royal-gold stage groom
const box = { width: 326, height: 1153 };                      // a model's visible outline (groom-3)

const p = placement(anchor, plate, box);
check("the model has the painted figure's height", p.height === Math.round(0.218 * 2560), String(p.height));
check("its width keeps its own proportions", Math.abs(p.width / p.height - 326 / 1153) < 0.005);
check("its feet are on the painted feet line", p.top + p.height === Math.round(0.883 * 2560));
check("it is centred where the painted figure was", Math.abs(p.left + p.width / 2 - 0.42 * 1144) <= 1);
check("a figure wholly on the plate is not clipped", JSON.stringify(clipToPlate(p, plate)) === JSON.stringify({ sx: 0, sy: 0, w: p.width, h: p.height, dx: p.left, dy: p.top }));

// a scene that crops the figure (the glasshouse stage: feet below the picture) or lets a head off the top (the royal-gold aisle)
const low = placement({ cx: 0.343, feet: 1.259, h: 0.7 }, { width: 576, height: 1024 }, box);
const cut = clipToPlate(low, { width: 576, height: 1024 });
check("a figure whose feet lie below the picture is cut at the bottom edge", !!cut && cut.dy + cut.h === 1024 && cut.sy === 0 && cut.h < low.height);
const high = placement({ cx: 0.285, feet: 0.362, h: 0.405 }, plate, box);
const top = clipToPlate(high, plate);
check("a head above the picture is cut at the top edge", high.top < 0 && !!top && top.dy === 0 && top.sy === -high.top);
check("a figure wholly off the plate shows nothing", clipToPlate({ left: 2000, top: 0, width: 10, height: 10 }, plate) === null);
console.log(fails ? `${fails} FAILED` : "all passed");
if (fails) process.exit(1);
