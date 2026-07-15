import * as PIXI from 'pixi.js'
import { Live2DModel, InternalModel } from 'pixi-live2d-display'

export interface PetEngine {
  app: PIXI.Application
  model: Live2DModel<InternalModel>
  width: number
  height: number
}

export async function usePetEngine(canvas: HTMLCanvasElement): Promise<PetEngine> {
  const width = 400
  const height = 550

  const app = new PIXI.Application({
    view: canvas,
    width,
    height,
    backgroundAlpha: 0,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  // Load Haru model (Cubism 2 model)
  const model = await Live2DModel.from('/models/haru/haru01.model.json')

  // Scale and position the model
  model.scale.set(0.15)
  model.x = width / 2
  model.y = height * 0.58
  model.anchor.set(0.5, 0.5)

  // Enable mouse tracking for eye follow
  model.interactive = true

  app.stage.addChild(model as any)

  return { app, model, width, height }
}
