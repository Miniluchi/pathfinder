import { useGridStore } from "../stores/gridStore";

// Structure représentant un nœud dans l'algorithme A*
type Node = {
  x: number;
  y: number;
  g: number; // Coût depuis le départ
  h: number; // Heuristique (distance estimée jusqu'à l'arrivée)
  f: number; // Score total (g + h)
  parent: Node | null;
};

// Distance de Manhattan entre deux points
function heuristic(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Vérifie si deux points sont les mêmes
function arePointsEqual(
  a: { x: number; y: number },
  b: { x: number; y: number }
): boolean {
  return a.x === b.x && a.y === b.y;
}

// Récupère les voisins accessibles d'une cellule
function getNeighbors(
  node: { x: number; y: number },
  borders: { x1: number; y1: number; x2: number; y2: number }[],
  cells: Record<string, { isBlocked: boolean }>,
  gridWidth: number,
  gridHeight: number
): { x: number; y: number }[] {
  const neighbors: { x: number; y: number }[] = [];
  const { x, y } = node;
  const directions = [
    { x: 0, y: -1 }, // haut
    { x: 1, y: 0 }, // droite
    { x: 0, y: 1 }, // bas
    { x: -1, y: 0 }, // gauche
  ];

  // Pour chaque direction
  for (const dir of directions) {
    const nx = x + dir.x;
    const ny = y + dir.y;

    // Vérifier si le voisin est dans les limites
    if (nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) {
      continue;
    }

    // Vérifier si la cellule est bloquée
    const cellKey = `${nx},${ny}`;
    if (cells[cellKey]?.isBlocked) {
      continue;
    }

    // Vérifier s'il y a une bordure entre la cellule actuelle et le voisin
    const borderKey1 = `${x},${y}-${nx},${ny}`;
    const borderKey2 = `${nx},${ny}-${x},${y}`;

    const hasBorder = borders.some((border) => {
      const bKey1 = `${border.x1},${border.y1}-${border.x2},${border.y2}`;
      const bKey2 = `${border.x2},${border.y2}-${border.x1},${border.y1}`;
      return (
        bKey1 === borderKey1 ||
        bKey1 === borderKey2 ||
        bKey2 === borderKey1 ||
        bKey2 === borderKey2
      );
    });

    if (!hasBorder) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

// Algorithme de recherche de chemin A*
export function findPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  gridWidth: number,
  gridHeight: number
): { x: number; y: number }[] {
  if (!start || !end) return [];

  const { borders, cells } = useGridStore.getState();

  // Initialiser les listes ouvertes et fermées
  const openList: Node[] = [];
  const closedList: Node[] = [];

  // Créer le nœud de départ
  const startNode: Node = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  // Ajouter le nœud de départ à la liste ouverte
  openList.push(startNode);

  // Tant qu'il y a des nœuds à explorer
  while (openList.length > 0) {
    // Trouver le nœud avec le score f le plus bas
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;

    // Si nous avons atteint la destination
    if (arePointsEqual(currentNode, end)) {
      // Reconstruire le chemin
      const path: { x: number; y: number }[] = [];
      let current: Node | null = currentNode;

      while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
      }

      return path;
    }

    // Ajouter le nœud actuel à la liste fermée
    closedList.push(currentNode);

    // Obtenir les voisins du nœud actuel
    const neighbors = getNeighbors(
      currentNode,
      borders,
      cells,
      gridWidth,
      gridHeight
    );

    // Pour chaque voisin
    for (const neighbor of neighbors) {
      // Vérifier si le voisin est déjà dans la liste fermée
      if (closedList.some((node) => arePointsEqual(node, neighbor))) {
        continue;
      }

      // Calculer le coût g pour ce voisin
      const gScore = currentNode.g + 1;

      // Vérifier si le voisin est déjà dans la liste ouverte
      const existingNeighbor = openList.find((node) =>
        arePointsEqual(node, neighbor)
      );

      if (!existingNeighbor) {
        // Si le voisin n'est pas dans la liste ouverte, l'ajouter
        const hScore = heuristic(neighbor, end);
        const neighborNode: Node = {
          x: neighbor.x,
          y: neighbor.y,
          g: gScore,
          h: hScore,
          f: gScore + hScore,
          parent: currentNode,
        };

        openList.push(neighborNode);
      } else if (gScore < existingNeighbor.g) {
        // Si nous avons trouvé un meilleur chemin vers ce voisin, mettre à jour
        existingNeighbor.g = gScore;
        existingNeighbor.f = gScore + existingNeighbor.h;
        existingNeighbor.parent = currentNode;
      }
    }
  }

  // Aucun chemin trouvé
  return [];
}
