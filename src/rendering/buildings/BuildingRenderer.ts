import { Graphics } from "pixi.js";
import { HexTile } from "../../world/HexTile";
import { BuildingType } from "../../world/Building";
import { HouseRenderer } from "./HouseRenderer";
import { ReligiousRenderer } from "./ReligiousRenderer";
import { LandmarkRenderer } from "./LandmarkRenderer";
import { IndustrialRenderer } from "./IndustrialRenderer";
import { CommercialRenderer } from "./CommercialRenderer";
import { AgriculturalRenderer } from "./AgriculturalRenderer";
import { MilitaryRenderer } from "./MilitaryRenderer";

/**
 * Coordinates all building renderers
 */
export class BuildingRenderer {
  private houseRenderer = new HouseRenderer();
  private religiousRenderer = new ReligiousRenderer();
  private landmarkRenderer = new LandmarkRenderer();
  private industrialRenderer = new IndustrialRenderer();
  private commercialRenderer = new CommercialRenderer();
  private agriculturalRenderer = new AgriculturalRenderer();
  private militaryRenderer = new MilitaryRenderer();

  /**
   * Draw a building based on its type
   */
  drawBuilding(gfx: Graphics, buildingType: BuildingType, cx: number, cy: number, hex?: HexTile): void {
    switch (buildingType) {
      // Houses
      case BuildingType.House:
        this.houseRenderer.drawHouse(gfx, cx, cy, hex);
        break;
      case BuildingType.CityHouse:
        this.houseRenderer.drawCityHouse(gfx, cx, cy, hex);
        break;

      // Religious
      case BuildingType.Church:
        this.religiousRenderer.drawChurch(gfx, cx, cy, hex);
        break;
      case BuildingType.Monastery:
        this.religiousRenderer.drawMonastery(gfx, cx, cy);
        break;
      case BuildingType.Chapel:
        this.religiousRenderer.drawChapel(gfx, cx, cy);
        break;

      // Landmarks
      case BuildingType.Tower:
        this.landmarkRenderer.drawTower(gfx, cx, cy, hex);
        break;
      case BuildingType.Castle:
        this.landmarkRenderer.drawCastle(gfx, cx, cy);
        break;
      case BuildingType.Windmill:
        this.landmarkRenderer.drawWindmill(gfx, cx, cy);
        break;

      // Industrial - Food Extraction
      case BuildingType.HuntingLodge:
        this.industrialRenderer.drawHuntingLodge(gfx, cx, cy);
        break;
      case BuildingType.FishingHut:
        this.industrialRenderer.drawFishingHut(gfx, cx, cy);
        break;
      case BuildingType.FishingBoat:
        this.industrialRenderer.drawFishingBoat(gfx, cx, cy);
        break;
      case BuildingType.Dock:
        this.industrialRenderer.drawDock(gfx, cx, cy);
        break;
      case BuildingType.Pasture:
        this.industrialRenderer.drawPasture(gfx, cx, cy);
        break;

      // Industrial - Material Extraction
      case BuildingType.LumberCamp:
        this.industrialRenderer.drawLumberCamp(gfx, cx, cy);
        break;
      case BuildingType.Sawmill:
        this.industrialRenderer.drawSawmill(gfx, cx, cy);
        break;
      case BuildingType.ClayPit:
        this.industrialRenderer.drawClayPit(gfx, cx, cy);
        break;
      case BuildingType.Quarry:
        this.industrialRenderer.drawQuarry(gfx, cx, cy);
        break;
      case BuildingType.SaltWorks:
        this.industrialRenderer.drawSaltWorks(gfx, cx, cy);
        break;

      // Industrial - Mineral Extraction
      case BuildingType.CopperMine:
        this.industrialRenderer.drawCopperMine(gfx, cx, cy);
        break;
      case BuildingType.IronMine:
        this.industrialRenderer.drawIronMine(gfx, cx, cy);
        break;
      case BuildingType.SilverMine:
        this.industrialRenderer.drawSilverMine(gfx, cx, cy);
        break;
      case BuildingType.GoldMine:
        this.industrialRenderer.drawGoldMine(gfx, cx, cy);
        break;
      case BuildingType.GemMine:
        this.industrialRenderer.drawGemMine(gfx, cx, cy);
        break;

      // Legacy mine (generic)
      case BuildingType.Mine:
        this.industrialRenderer.drawMine(gfx, cx, cy);
        break;

      // Industrial - Food Production Buildings
      case BuildingType.Bakery:
        this.industrialRenderer.drawBakery(gfx, cx, cy);
        break;
      case BuildingType.Butcher:
        this.industrialRenderer.drawButcher(gfx, cx, cy);
        break;
        
      // Industrial - Material Production Buildings
      case BuildingType.Smelter:
        this.industrialRenderer.drawSmelter(gfx, cx, cy);
        break;
      case BuildingType.Smithy:
        this.industrialRenderer.drawSmithy(gfx, cx, cy);
        break;
      case BuildingType.CharcoalBurner:
        this.industrialRenderer.drawCharcoalBurner(gfx, cx, cy);
        break;
      case BuildingType.Kiln:
        this.industrialRenderer.drawKiln(gfx, cx, cy);
        break;
      case BuildingType.Tannery:
        this.industrialRenderer.drawTannery(gfx, cx, cy);
        break;

      // Commercial
      case BuildingType.TradingPost:
        this.commercialRenderer.drawTradingPost(gfx, cx, cy);
        break;
      case BuildingType.Warehouse:
        this.commercialRenderer.drawWarehouse(gfx, cx, cy);
        break;

      // Agricultural
      case BuildingType.Field:
        this.agriculturalRenderer.drawField(gfx, cx, cy);
        break;
      case BuildingType.GrainSilo:
        this.agriculturalRenderer.drawGrainSilo(gfx, cx, cy);
        break;

      // Military
      case BuildingType.Barracks:
        this.militaryRenderer.drawBarracks(gfx, cx, cy);
        break;
      case BuildingType.Watchtower:
        this.militaryRenderer.drawWatchtower(gfx, cx, cy);
        break;

      default:
        // Building type not implemented
        break;
    }
  }
}
