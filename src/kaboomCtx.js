import kaboom from "kaboom";

export const kontext = kaboom({
  global: false,
  touchToMouse: true,
  canvas: document.getElementById("game"),
});
