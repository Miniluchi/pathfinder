import { create } from "zustand";

type ImageState = {
  image: HTMLImageElement | null;
  imageUrl: string | null;
  scale: number;
  position: { x: number; y: number };
  stageSize: { width: number; height: number };

  // Actions
  setImage: (imageElement: HTMLImageElement, url: string) => void;
  resetImage: () => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setStageSize: (width: number, height: number) => void;
};

export const useImageStore = create<ImageState>((set) => ({
  image: null,
  imageUrl: null,
  scale: 1,
  position: { x: 0, y: 0 },
  stageSize: { width: window.innerWidth, height: window.innerHeight },

  setImage: (imageElement, url) =>
    set({
      image: imageElement,
      imageUrl: url,
      // Reset au milieu quand on charge une nouvelle image
      position: { x: 0, y: 0 },
      scale: 1,
    }),

  resetImage: () =>
    set({
      image: null,
      imageUrl: null,
      scale: 1,
      position: { x: 0, y: 0 },
    }),

  setScale: (scale) =>
    set({
      scale: Math.min(Math.max(0.1, scale), 10), // Limiter le zoom entre 0.1x et 10x
    }),

  setPosition: (x, y) => set({ position: { x, y } }),

  setStageSize: (width, height) => set({ stageSize: { width, height } }),
}));
