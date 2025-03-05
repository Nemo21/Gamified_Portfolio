import { kontext } from "./kaboomCtx";
import { dialogueData, scaleFactor } from "./constants";
import { displayDialogue, setCamScale } from "./utils";

kontext.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 936,
    "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
    "idle-side": 975,
    "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
    "idle-up": 1014,
    "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

kontext.loadSprite("map", "./map.png");

kontext.setBackground(kontext.Color.fromHex("#311047"));

kontext.scene("main", async () => {
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;
  const map = kontext.add([
    kontext.sprite("map"),
    kontext.pos(0),
    kontext.scale(scaleFactor),
  ]);
  const player = kontext.make([
    kontext.sprite("spritesheet", { anim: "idle-down" }),
    kontext.area({
      shape: new kontext.Rect(kontext.vec2(0, 3), 10, 10),
    }),
    kontext.body(),
    kontext.anchor("center"),
    kontext.pos(),
    kontext.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);
  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          kontext.area({
            shape: new kontext.Rect(
              kontext.vec2(0),
              boundary.width,
              boundary.height
            ),
          }),
          kontext.body({ isStatic: true }),
          kontext.pos(boundary.x, boundary.y),
          boundary.name,
        ]);
        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            displayDialogue(
              dialogueData[boundary.name],
              () => (player.isInDialogue = false)
            );
          });
        }
      }
      continue;
    }
    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = kontext.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor
          );
          kontext.add(player);
          continue;
        }
      }
    }
  }

  setCamScale(kontext);

  kontext.onResize(() => {
    setCamScale(kontext);
  });
  kontext.onUpdate(() => {
    kontext.camPos(player.pos.x, player.pos.y + 100);
  });

  kontext.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;
    const worldMousePos = kontext.toWorld(kontext.mousePos());
    player.moveTo(worldMousePos, player.speed);
    const mouseAngle = player.pos.angle(worldMousePos);
    const lowerBound = 50;
    const upperBound = 125;
    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  kontext.onMouseRelease(() => {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }
    player.play("idle-side");
  });
});

kontext.go("main");
