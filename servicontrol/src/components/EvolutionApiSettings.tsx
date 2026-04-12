import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEvolutionSettings, EvolutionSettings } from '@/hooks/useEvolutionSettings';
import { Save, Eye, EyeOff, MessageSquare, Loader2, QrCode, Trash2, Wifi, WifiOff } from 'lucide-react';

export function EvolutionApiSettings() {
  const { settings, saveSettings, clearSettings } = useEvolutionSettings();
  const [formData, setFormData] = useState<EvolutionSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiUrl || !formData.apiKey || !formData.instanceName) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    saveSettings({ ...formData, connected: false });
    toast.success('Credenciais da Evolution API salvas!');
  };

  const createInstance = async () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.instanceName) {
      toast.error('Salve as credenciais antes de criar a instância.');
      return;
    }
    setLoading(true);
    try {
      const baseUrl = formData.apiUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': formData.apiKey,
        },
        body: JSON.stringify({
          instanceName: formData.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
      }

      const data = await res.json();
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      }
      toast.success('Instância criada! Escaneie o QR Code para conectar.');
    } catch (error: any) {
      console.error('Evolution create instance error:', error);
      toast.error(error.message || 'Falha ao criar instância.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.instanceName) {
      toast.error('Salve as credenciais primeiro.');
      return;
    }
    setLoading(true);
    try {
      const baseUrl = formData.apiUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/instance/connect/${formData.instanceName}`, {
        method: 'GET',
        headers: { 'apikey': formData.apiKey },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      if (data.base64) {
        setQrCode(data.base64);
        toast.success('QR Code gerado! Escaneie com o WhatsApp.');
      } else {
        toast.info('Instância já conectada ou QR Code indisponível.');
      }
    } catch (error: any) {
      console.error('Evolution QR error:', error);
      toast.error('Falha ao obter QR Code.');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.instanceName) return;
    setLoading(true);
    try {
      const baseUrl = formData.apiUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/instance/connectionState/${formData.instanceName}`, {
        method: 'GET',
        headers: { 'apikey': formData.apiKey },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const state = data.instance?.state || data.state || 'unknown';
      setInstanceStatus(state);

      if (state === 'open') {
        saveSettings({ ...formData, connected: true });
        setQrCode(null);
        toast.success('WhatsApp conectado com sucesso!');
      } else {
        saveSettings({ ...formData, connected: false });
        toast.info(`Status: ${state}`);
      }
    } catch (error: any) {
      console.error('Evolution status error:', error);
      toast.error('Falha ao verificar status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearSettings();
    setFormData({ apiUrl: '', apiKey: '', instanceName: '', connected: false });
    setQrCode(null);
    setInstanceStatus(null);
    toast.success('Configurações removidas.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Integração WhatsApp (Evolution API)
          {settings.connected && (
            <Badge variant="default" className="ml-2 gap-1">
              <Wifi className="h-3 w-3" /> Conectado
            </Badge>
          )}
          {!settings.connected && settings.apiUrl && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <WifiOff className="h-3 w-3" /> Desconectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure a Evolution API para enviar notificações via WhatsApp. Informe as credenciais, crie a instância e escaneie o QR Code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evo-url">URL da API</Label>
            <Input
              id="evo-url"
              type="url"
              placeholder="https://sua-evolution-api.com"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua instância da Evolution API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evo-key">API Key</Label>
            <div className="relative">
              <Input
                id="evo-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Sua chave da Evolution API"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evo-instance">Nome da Instância</Label>
            <Input
              id="evo-instance"
              placeholder="ex: servicontrol-whatsapp"
              value={formData.instanceName}
              onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {settings.apiUrl && (
              <Button type="button" variant="destructive" size="sm" className="gap-2" onClick={handleDisconnect}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" /> Salvar Credenciais
            </Button>
          </div>
        </form>

        {formData.apiUrl && formData.apiKey && formData.instanceName && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gerenciar Instância</h4>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={createInstance} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Criar Instância
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={fetchQrCode} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Gerar QR Code
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={checkStatus} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  Verificar Status
                </Button>
              </div>

              {instanceStatus && (
                <div className="text-sm">
                  Status atual: <Badge variant={instanceStatus === 'open' ? 'default' : 'secondary'}>{instanceStatus}</Badge>
                </div>
              )}

              {qrCode && (
                <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-background">
                  <p className="text-sm font-medium">Escaneie o QR Code com o WhatsApp</p>
                  <img
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Abra o WhatsApp &gt; Menu &gt; Aparelhos conectados &gt; Conectar um aparelho
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
