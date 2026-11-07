import { OUTFIT_COLOURS, parseHex, recolourOptionsFor, recolourOutfit } from "../src/lib/recolour.js";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

// A 10 x 10 picture, row by row: rows 0-1 face (skin), rows 2-5 white garment, rows 6-7 gold, row 8 black shoes, row 9 transparent.
const W = 10, H = 10;
const SKIN = [236, 200, 178], WHITE = [246, 246, 246], SHADE = [150, 150, 150], GOLD = [200, 150, 30], BLACK = [20, 20, 20];
function picture() {
  const px = new Uint8ClampedArray(W * H * 4);
  const put = (row: number, c: number[], a = 255) => { for (let x = 0; x < W; x++) { const i = (row * W + x) * 4; px.set([...c, a], i); } };
  put(0, SKIN); put(1, SKIN); put(2, WHITE); put(3, WHITE); put(4, SHADE); put(5, SHADE); put(6, GOLD); put(7, GOLD); put(8, BLACK); put(9, [0, 0, 0], 0);
  return px;
}
const at = (px: Uint8ClampedArray, row: number) => [...px.slice(row * W * 4, row * W * 4 + 4)];
const opts = { width: W, height: H, keepDarkFeet: 0.2 };

check("a colour is parsed, and a non-colour is not", JSON.stringify(parseHex("#1F6B4F")) === "[31,107,79]" && parseHex("green") === null && parseHex("#fff") === null && parseHex(null) === null);
check("the palette starts with 'as it is' and every other entry is a colour", OUTFIT_COLOURS[0].hex === null && OUTFIT_COLOURS.slice(1).every((c) => parseHex(c.hex) && c.label && c.labelEn));

{
  const px = picture(); const before = [...px];
  recolourOutfit(px, null, opts); recolourOutfit(px, "nope", opts);
  check("no colour, or a bad one, changes nothing", [...px].every((v, i) => v === before[i]));
}
{
  const px = recolourOutfit(picture(), "#1F2F5C", opts);
  const white = at(px, 3), shade = at(px, 5);
  check("a white garment takes the colour (blue now: more blue than red)", white[2] > white[0] + 20, white.join(","));
  check("its shade stays darker than its light, so the folds stay", shade[2] < white[2] && shade[0] <= white[0]);
  check("skin is left exactly as it was", at(px, 0).join() === [...SKIN, 255].join() && at(px, 1).join() === [...SKIN, 255].join());
  check("gold detail keeps its colour", at(px, 6).join() === [...GOLD, 255].join());
  check("black shoes at the bottom stay black", at(px, 8).join() === [...BLACK, 255].join());
  check("transparent pixels stay transparent", at(px, 9)[3] === 0);
}
{
  // a dark suit is recoloured where it is body, but black hair in the head share is kept (and there is no 'head' share unless asked for)
  const suit = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) suit.set([...(y < 2 ? SKIN : BLACK), 255], (y * W + x) * 4);
  const hair = new Uint8ClampedArray(suit); for (let x = 0; x < W; x++) hair.set([...BLACK, 255], x * 4);   // row 0 is black hair
  const without = recolourOutfit(new Uint8ClampedArray(hair), "#7A1F2B", { width: W, height: H, keepDarkFeet: 0 });
  const withHead = recolourOutfit(new Uint8ClampedArray(hair), "#7A1F2B", { width: W, height: H, keepDarkFeet: 0, keepDarkHead: 0.1 });
  check("hair is tinted unless the model says its head is to be kept", at(without, 0)[0] > BLACK[0] + 5 && at(withHead, 0).join() === [...BLACK, 255].join());
  check("the dark body of a suit is recoloured either way", at(withHead, 5)[0] > BLACK[0] + 5);
}
{
  const px = new Uint8ClampedArray(picture()); const copy = recolourOutfit(px, "#8C8C94", opts);
  check("it works in place and returns the same array", copy === px);
}
check("only the groom's black-haired models have a head to keep", recolourOptionsFor("groom-1").keepDarkHead! > 0 && recolourOptionsFor("groom-3").keepDarkHead! > 0 && recolourOptionsFor("bride-1").keepDarkHead === undefined);
console.log(fails ? `${fails} FAILED` : "all passed");
if (fails) process.exit(1);
