import { useCallback } from "react";
import { Upload } from "lucide-react";
import { useImageStore } from "../stores/imageStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

export function ImageUploader() {
  const { setImage } = useImageStore();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img, URL.createObjectURL(file));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [setImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img, URL.createObjectURL(file));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [setImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Importer une carte</CardTitle>
        <CardDescription>
          Glissez-déposez une image ou cliquez pour la sélectionner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center flex flex-col items-center justify-center gap-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-10 h-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Formats acceptés : PNG, JPG, JPEG
          </p>
          <Button
            variant="outline"
            className="relative"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            Parcourir
            <input
              id="image-upload"
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
