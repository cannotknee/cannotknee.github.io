// Where the pilot shiba currently is on screen, in CSS pixels. Written every
// frame by PilotShiba (inside the R3F loop) and read by ShibaChat so its
// speech bubbles can hang off the dog — a plain mutable object rather than
// React state, since it changes every frame.
const shibaAnchor = {
  x: 0,
  y: 0,
  r: 0, // approximate on-screen radius of the dog
  visible: false,
  docked: false, // parked in the bottom-right corner
};

export default shibaAnchor;
