import {
  MousePointer,
  Pencil,
  Grid,
  MoveHorizontal,
  Play,
  Ban,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Card, CardContent } from "./ui/card";
import { ModeToggle } from "./mode-toggle";
import { useAppStore, type InteractionMode } from "../stores/appStore";
import { useGridStore } from "../stores/gridStore";
import { useImageStore } from "../stores/imageStore";
import { findPath } from "../utils/pathfinding";

export function Toolbar() {
  const { interactionMode, setInteractionMode, showGrid, toggleGrid } =
    useAppStore();
  const { gridSize, setGridSize, startCell, endCell, setPath } = useGridStore();
  const { image } = useImageStore();

  const handleGridSizeChange = (value: number[]) => {
    setGridSize(value[0]);
  };

  const handleFindPath = () => {
    if (!startCell || !endCell || !image) return;

    const pathFound = findPath(
      startCell,
      endCell,
      Math.ceil(image.width / gridSize),
      Math.ceil(image.height / gridSize)
    );

    setPath(pathFound);
  };

  const tools: {
    mode: InteractionMode;
    icon: React.ReactNode;
    label: string;
    color?: string;
  }[] = [
    { mode: "pan", icon: <MoveHorizontal size={18} />, label: "Déplacer" },
    { mode: "border", icon: <Pencil size={18} />, label: "Bordures" },
    { mode: "cell", icon: <Ban size={18} />, label: "Bloquer" },
    {
      mode: "start",
      icon: <MousePointer size={18} />,
      label: "Départ",
      color: "blue",
    },
    {
      mode: "end",
      icon: <MousePointer size={18} />,
      label: "Arrivée",
      color: "red",
    },
    {
      mode: "findPath",
      icon: <Play size={18} />,
      label: "Chemin",
      color: "green",
    },
  ];

  return (
    <Card className="fixed left-4 top-4 z-10 w-64 shadow-lg">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Pathfinder</h3>
            <ModeToggle />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.mode}
                variant={interactionMode === tool.mode ? "default" : "outline"}
                size="sm"
                className="flex flex-col h-auto py-2 gap-1 items-center"
                onClick={() => setInteractionMode(tool.mode)}
                title={tool.label}
              >
                <span
                  style={{
                    color:
                      interactionMode === tool.mode ? undefined : tool.color,
                  }}
                >
                  {tool.icon}
                </span>
                <span className="text-xs">{tool.label}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Taille de la grille</span>
              <span className="text-xs font-mono">{gridSize}px</span>
            </div>
            <Slider
              min={16}
              max={128}
              step={8}
              value={[gridSize]}
              onValueChange={handleGridSizeChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={toggleGrid}
            >
              <Grid size={16} className="mr-2" />
              {showGrid ? "Masquer" : "Afficher"} Grille
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleFindPath}
              disabled={!startCell || !endCell}
            >
              <Play size={16} className="mr-2" />
              Calculer Chemin
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
