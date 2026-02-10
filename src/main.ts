import { Application } from "pixi.js";
import { Game } from "./game/Game";

async function bootstrap() {
  const app = new Application();

  await app.init({
    background: "#0e0e1a",
    resizeTo: window,
    antialias: true,
    roundPixels: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  document.body.appendChild(app.canvas);

  const game = new Game(app);
  game.start();
}

bootstrap().catch(console.error);
