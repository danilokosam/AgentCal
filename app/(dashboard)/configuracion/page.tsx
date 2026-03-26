import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 bg-white">
        <Settings className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-900">Configuración</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-2xl space-y-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Nombre</span>
              <span className="font-medium text-slate-900">Demo Clinic</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Zona horaria</span>
              <span className="font-medium text-slate-900">America/New_York (UTC para almacenamiento)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Horario laboral</span>
              <span className="font-medium text-slate-900">08:00 – 18:00 UTC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Protocolo MCP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Estado</span>
              <Badge className="bg-green-100 text-green-800 border-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                Activo
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Versión protocolo</span>
              <span className="font-mono text-xs text-slate-700">2024-11-05</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Arranque</span>
              <span className="font-mono text-xs text-slate-700">npm run mcp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tools disponibles</span>
              <span className="font-medium text-slate-900">6</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
