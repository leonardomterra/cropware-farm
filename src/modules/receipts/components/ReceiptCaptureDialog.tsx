import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReceiptScanner, type ScanResult } from "../hooks/useReceiptScanner";

interface ReceiptCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (result: ScanResult) => void;
}

export function ReceiptCaptureDialog({
  open,
  onOpenChange,
  onScanComplete,
}: ReceiptCaptureDialogProps) {
  const { scan, scanning, error } = useReceiptScanner();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      // limpa estado quando fecha
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewSrc(null);
      setSelectedFile(null);
    }
  }, [open]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewSrc(url);
    setSelectedFile(file);
  };

  const handleProcessar = async () => {
    if (!selectedFile) return;
    const result = await scan(selectedFile);
    if (result) {
      onScanComplete(result);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !scanning && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Capturar recibo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Tire foto do recibo, nota ou cupom. A IA tenta extrair os campos
            sozinha. Voce revisa antes de salvar.
          </p>

          {previewSrc ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <img
                src={previewSrc}
                alt="Preview"
                className="w-full max-h-80 object-contain"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={scanning}
              >
                <Camera className="size-6 text-farm-green" />
                <span className="text-sm">Tirar foto</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
              >
                <Upload className="size-6 text-farm-green" />
                <span className="text-sm">Galeria</span>
              </Button>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {selectedFile ? (
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span className="truncate">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (previewUrlRef.current)
                    URL.revokeObjectURL(previewUrlRef.current);
                  previewUrlRef.current = null;
                  setPreviewSrc(null);
                  setSelectedFile(null);
                }}
                disabled={scanning}
              >
                Trocar
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {scanning ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 py-2">
              <Loader2 className="size-4 animate-spin" />
              Processando com IA...
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={scanning}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleProcessar}
            disabled={!selectedFile || scanning}
          >
            {scanning ? "Processando..." : "Processar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
