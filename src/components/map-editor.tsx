import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image, Rect, Line, Circle } from "react-konva";
import Konva from "konva";
import { useImageStore } from "../stores/imageStore";
import { useGridStore } from "../stores/gridStore";
import { useAppStore } from "../stores/appStore";
import { findPath } from "../utils/pathfinding";

export function MapEditor() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const {
    image,
    scale,
    position,
    setPosition,
    setScale,
    stageSize,
    setStageSize,
  } = useImageStore();
  const {
    gridSize,
    borders,
    cells,
    startCell,
    endCell,
    path,
    toggleCellBlocked,
    addBorder,
    removeBorder,
    setStartCell,
    setEndCell,
    setPath,
  } = useGridStore();
  const { interactionMode, showGrid, isEditing } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Mettre à jour la taille du stage lors du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setStageSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setStageSize]);

  // Gérer le zoom avec la molette de la souris
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const scaleBy = 1.1;
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = scale;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale =
        e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

      setScale(newScale);

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setPosition(newPos.x, newPos.y);
    },
    [scale, position, setScale, setPosition]
  );

  // Convertir les coordonnées de l'écran en coordonnées de la grille
  const toGridCoords = useCallback(
    (x: number, y: number) => {
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      return { gridX, gridY };
    },
    [gridSize]
  );

  // Gérer le clic sur la scène
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!image || !isEditing) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const x = (pointerPos.x - position.x) / scale;
      const y = (pointerPos.y - position.y) / scale;

      const { gridX, gridY } = toGridCoords(x, y);

      // Détecter si nous sommes proches d'une ligne de grille
      const xRemainder = x % gridSize;
      const yRemainder = y % gridSize;
      const isOnVerticalLine = xRemainder < 5 || xRemainder > gridSize - 5;
      const isOnHorizontalLine = yRemainder < 5 || yRemainder > gridSize - 5;

      // Snap aux lignes de la grille
      let x1: number | undefined;
      let y1: number | undefined;
      let x2: number | undefined;
      let y2: number | undefined;

      if (
        interactionMode === "border" &&
        (isOnVerticalLine || isOnHorizontalLine)
      ) {
        if (isOnVerticalLine && isOnHorizontalLine) {
          // L'utilisateur a cliqué près d'une intersection, on choisit la plus proche
          const closestX = xRemainder < 5 ? gridX : gridX + 1;
          const closestY = yRemainder < 5 ? gridY : gridY + 1;

          // Détecter si on est plus proche d'une ligne horizontale ou verticale
          const distToHorizontal = Math.min(yRemainder, gridSize - yRemainder);
          const distToVertical = Math.min(xRemainder, gridSize - xRemainder);

          if (distToHorizontal < distToVertical) {
            // Ligne horizontale
            x1 = gridX;
            y1 = closestY;
            x2 = gridX + 1;
            y2 = closestY;
          } else {
            // Ligne verticale
            x1 = closestX;
            y1 = gridY;
            x2 = closestX;
            y2 = gridY + 1;
          }
        } else if (isOnVerticalLine) {
          // Ligne verticale
          const closestX = xRemainder < 5 ? gridX : gridX + 1;
          x1 = closestX;
          y1 = gridY;
          x2 = closestX;
          y2 = gridY + 1;
        } else {
          // Ligne horizontale
          const closestY = yRemainder < 5 ? gridY : gridY + 1;
          x1 = gridX;
          y1 = closestY;
          x2 = gridX + 1;
          y2 = closestY;
        }

        // S'assurer que les coordonnées sont définies
        if (
          x1 !== undefined &&
          y1 !== undefined &&
          x2 !== undefined &&
          y2 !== undefined
        ) {
          // Vérifier si la bordure existe déjà
          const existingBorder = borders.find(
            (b) =>
              (b.x1 === x1 && b.y1 === y1 && b.x2 === x2 && b.y2 === y2) ||
              (b.x1 === x2 && b.y1 === y2 && b.x2 === x1 && b.y2 === y1)
          );

          if (existingBorder) {
            removeBorder(existingBorder);
          } else {
            addBorder({ x1, y1, x2, y2 });
          }
        }
      } else if (interactionMode === "cell") {
        // Double clic pour bloquer/débloquer une cellule
        toggleCellBlocked(gridX, gridY);
      } else if (interactionMode === "start") {
        // Définir la cellule de départ
        setStartCell(gridX, gridY);
      } else if (interactionMode === "end") {
        // Définir la cellule d'arrivée
        setEndCell(gridX, gridY);
      } else if (interactionMode === "findPath" && startCell && endCell) {
        // Trouver un chemin entre le départ et l'arrivée
        const pathFound = findPath(
          startCell,
          endCell,
          Math.ceil(image.width / gridSize),
          Math.ceil(image.height / gridSize)
        );
        setPath(pathFound);
      }
    },
    [
      image,
      scale,
      position,
      gridSize,
      interactionMode,
      borders,
      isEditing,
      startCell,
      endCell,
      toGridCoords,
      addBorder,
      removeBorder,
      toggleCellBlocked,
      setStartCell,
      setEndCell,
      setPath,
    ]
  );

  // Gérer le survol des lignes de la grille
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!image || !isEditing || interactionMode !== "border") return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const x = (pointerPos.x - position.x) / scale;
      const y = (pointerPos.y - position.y) / scale;

      const { gridX, gridY } = toGridCoords(x, y);

      // Détecter si nous sommes proches d'une ligne de grille
      const xRemainder = x % gridSize;
      const yRemainder = y % gridSize;
      const isOnVerticalLine = xRemainder < 5 || xRemainder > gridSize - 5;
      const isOnHorizontalLine = yRemainder < 5 || yRemainder > gridSize - 5;

      // Réinitialiser la ligne en survol
      setHoveredLine(null);

      if (isOnVerticalLine || isOnHorizontalLine) {
        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;

        if (isOnVerticalLine && isOnHorizontalLine) {
          // L'utilisateur est proche d'une intersection, on choisit la plus proche
          const distToHorizontal = Math.min(yRemainder, gridSize - yRemainder);
          const distToVertical = Math.min(xRemainder, gridSize - xRemainder);

          if (distToHorizontal < distToVertical) {
            // Ligne horizontale
            const closestY = yRemainder < 5 ? gridY : gridY + 1;
            x1 = gridX;
            y1 = closestY;
            x2 = gridX + 1;
            y2 = closestY;
          } else {
            // Ligne verticale
            const closestX = xRemainder < 5 ? gridX : gridX + 1;
            x1 = closestX;
            y1 = gridY;
            x2 = closestX;
            y2 = gridY + 1;
          }
        } else if (isOnVerticalLine) {
          // Ligne verticale
          const closestX = xRemainder < 5 ? gridX : gridX + 1;
          x1 = closestX;
          y1 = gridY;
          x2 = closestX;
          y2 = gridY + 1;
        } else {
          // Ligne horizontale
          const closestY = yRemainder < 5 ? gridY : gridY + 1;
          x1 = gridX;
          y1 = closestY;
          x2 = gridX + 1;
          y2 = closestY;
        }

        setHoveredLine({ x1, y1, x2, y2 });
      }
    },
    [image, scale, position, gridSize, interactionMode, isEditing, toGridCoords]
  );

  // Gérer le déplacement lorsqu'on est en mode pan
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDragging && interactionMode === "pan") {
        const dx = e.evt.movementX;
        const dy = e.evt.movementY;
        setPosition(position.x + dx, position.y + dy);
      }
    },
    [isDragging, interactionMode, position, setPosition]
  );

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onWheel={handleWheel}
      onClick={handleClick}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleDragMove(e);
      }}
      onMouseDown={() => interactionMode === "pan" && setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      draggable={false}
      style={{
        cursor: isDragging
          ? "grabbing"
          : interactionMode === "pan"
          ? "grab"
          : "default",
      }}
    >
      {/* Couche de l'image */}
      <Layer>
        {image && (
          <Image
            image={image}
            x={position.x}
            y={position.y}
            scaleX={scale}
            scaleY={scale}
          />
        )}
      </Layer>

      {/* Couche de la grille */}
      {image && showGrid && (
        <Layer>
          {/* Lignes verticales */}
          {Array.from({ length: Math.ceil(image.width / gridSize) + 1 }).map(
            (_, i) => (
              <Line
                key={`v-${i}`}
                points={[
                  i * gridSize * scale + position.x,
                  position.y,
                  i * gridSize * scale + position.x,
                  image.height * scale + position.y,
                ]}
                stroke="#666"
                strokeWidth={0.5}
                opacity={0.5}
              />
            )
          )}

          {/* Lignes horizontales */}
          {Array.from({ length: Math.ceil(image.height / gridSize) + 1 }).map(
            (_, i) => (
              <Line
                key={`h-${i}`}
                points={[
                  position.x,
                  i * gridSize * scale + position.y,
                  image.width * scale + position.x,
                  i * gridSize * scale + position.y,
                ]}
                stroke="#666"
                strokeWidth={0.5}
                opacity={0.5}
              />
            )
          )}
        </Layer>
      )}

      {/* Couche des cellules bloquées */}
      {image && (
        <Layer>
          {Object.values(cells)
            .filter((cell) => cell.isBlocked)
            .map((cell) => (
              <Rect
                key={`cell-${cell.x}-${cell.y}`}
                x={cell.x * gridSize * scale + position.x}
                y={cell.y * gridSize * scale + position.y}
                width={gridSize * scale}
                height={gridSize * scale}
                fill="rgba(255, 0, 0, 0.3)"
              />
            ))}
        </Layer>
      )}

      {/* Couche des bordures */}
      {image && (
        <Layer>
          {borders.map((border, index) => (
            <Line
              key={`border-${index}`}
              points={[
                border.x1 * gridSize * scale + position.x,
                border.y1 * gridSize * scale + position.y,
                border.x2 * gridSize * scale + position.x,
                border.y2 * gridSize * scale + position.y,
              ]}
              stroke="#000"
              strokeWidth={2 * scale}
            />
          ))}

          {/* Bordure en survol */}
          {hoveredLine && (
            <Line
              points={[
                hoveredLine.x1 * gridSize * scale + position.x,
                hoveredLine.y1 * gridSize * scale + position.y,
                hoveredLine.x2 * gridSize * scale + position.x,
                hoveredLine.y2 * gridSize * scale + position.y,
              ]}
              stroke="#66f"
              strokeWidth={2 * scale}
              opacity={0.7}
            />
          )}
        </Layer>
      )}

      {/* Couche du chemin */}
      {image && path.length > 0 && (
        <Layer>
          {/* Connexions du chemin */}
          <Line
            points={path.flatMap((point) => [
              point.x * gridSize * scale + position.x + (gridSize * scale) / 2,
              point.y * gridSize * scale + position.y + (gridSize * scale) / 2,
            ])}
            stroke="#0f0"
            strokeWidth={2 * scale}
          />

          {/* Points du chemin */}
          {path.map((point, index) => (
            <Circle
              key={`path-${index}`}
              x={
                point.x * gridSize * scale + position.x + (gridSize * scale) / 2
              }
              y={
                point.y * gridSize * scale + position.y + (gridSize * scale) / 2
              }
              radius={3 * scale}
              fill="#0f0"
            />
          ))}
        </Layer>
      )}

      {/* Points de départ et d'arrivée */}
      {image && (
        <Layer>
          {startCell && (
            <Circle
              x={
                startCell.x * gridSize * scale +
                position.x +
                (gridSize * scale) / 2
              }
              y={
                startCell.y * gridSize * scale +
                position.y +
                (gridSize * scale) / 2
              }
              radius={5 * scale}
              fill="blue"
            />
          )}

          {endCell && (
            <Circle
              x={
                endCell.x * gridSize * scale +
                position.x +
                (gridSize * scale) / 2
              }
              y={
                endCell.y * gridSize * scale +
                position.y +
                (gridSize * scale) / 2
              }
              radius={5 * scale}
              fill="red"
            />
          )}
        </Layer>
      )}
    </Stage>
  );
}
