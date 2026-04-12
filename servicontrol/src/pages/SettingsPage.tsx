import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useSettings, TrelloSettings } from '@/hooks/useSettings';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Save, Loader2, RefreshCw, Eye, EyeOff, Bell, MessageSquare, Smartphone } from 'lucide-react';
import { TrelloClient } from '@/integrations/trello/client';
import { Checkbox } from '@/components/ui/checkbox';
import { TrelloBoard } from '@/integrations/trello/types';

export default function SettingsPage() {
    const { settings, saveSettings } = useSettings();
    const { preferences, savePreferences, requestPushPermission } = useNotificationSettings();
    const [formData, setFormData] = useState<TrelloSettings>(settings);
    const [availableBoards, setAvailableBoards] = useState<TrelloBoard[]>(settings.savedBoards || []);
    const [loadingBoards, setLoadingBoards] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const fetchBoards = async () => {
        if (!formData.apiKey || !formData.token) {
            toast.error('Informe a API Key e o Token para buscar os quadros.');
            return;
        }
        setLoadingBoards(true);
        try {
            const tempClient = new TrelloClient(formData.apiKey, formData.token);
            const boards = await tempClient.getBoards();
            setAvailableBoards(boards);
            setFormData(prev => ({ ...prev, savedBoards: boards }));
            toast.success(`${boards.length} quadro(s) encontrado(s)!`);
        } catch (error: any) {
            console.error('Fetch boards error:', error);
            toast.error('Falha ao buscar quadros. Verifique as credenciais.');
        } finally {
            setLoadingBoards(false);
        }
    };

    const handleBoardToggle = (boardId: string) => {
        setFormData(prev => {
            const currentIds = prev.boardIds || [];
            const newIds = currentIds.includes(boardId)
                ? currentIds.filter(id => id !== boardId)
                : [...currentIds, boardId];
            return { ...prev, boardIds: newIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettings(formData);
        toast.success('Configurações salvas com sucesso!', {
            description: 'O sistema recarregará para aplicar as alterações.',
        });
        setTimeout(() => window.location.reload(), 1500);
    };

    const handleTogglePush = async (enabled: boolean) => {
        if (enabled) {
            const granted = await requestPushPermission();
            if (!granted) {
                toast.error('Permissão de notificação negada pelo navegador.');
                return;
            }
            toast.success('Notificações push ativadas!');
        } else {
            savePreferences({ pushEnabled: false });
        }
    };

    const notificationEvents = [
        { key: 'onStatusChange' as const, label: 'Mudança de status', desc: 'Quando um serviço muda de status' },
        { key: 'onNewService' as const, label: 'Novo serviço', desc: 'Quando um serviço é adicionado' },
        { key: 'onPaymentReceived' as const, label: 'Pagamento recebido', desc: 'Quando um pagamento é registrado' },
        { key: 'onServiceOverdue' as const, label: 'Serviço vencido', desc: 'Quando um serviço está atrasado' },
        { key: 'onValueChange' as const, label: 'Alteração de valor', desc: 'Quando o valor de um serviço muda' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Configurações"
                description="Gerencie as integrações, notificações e preferências do sistema"
            />

            <div className="grid gap-6">
                {/* Notifications Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notificações
                        </CardTitle>
                        <CardDescription>
                            Escolha quais canais e eventos geram notificações.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Channels */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Canais</h4>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Push no Navegador</p>
                                        <p className="text-xs text-muted-foreground">Receba alertas mesmo com a aba fechada</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={preferences.pushEnabled}
                                    onCheckedChange={handleTogglePush}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4 opacity-60">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">WhatsApp</p>
                                        <p className="text-xs text-muted-foreground">Em breve — conecte o Twilio nas configurações</p>
                                    </div>
                                </div>
                                <Switch disabled checked={preferences.whatsappEnabled} />
                            </div>
                        </div>

                        <Separator />

                        {/* Events */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Eventos</h4>
                            {notificationEvents.map(evt => (
                                <div key={evt.key} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium">{evt.label}</p>
                                        <p className="text-xs text-muted-foreground">{evt.desc}</p>
                                    </div>
                                    <Switch
                                        checked={preferences[evt.key]}
                                        onCheckedChange={(v) => savePreferences({ [evt.key]: v })}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Trello Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Integração com Trello</CardTitle>
                        <CardDescription>
                            Configure o acesso ao Trello para sincronizar seus cartões como serviços.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="apiKey"
                                        type={showApiKey ? 'text' : 'password'}
                                        placeholder="Sua API Key do Trello"
                                        value={formData.apiKey}
                                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                        className="pr-10"
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowApiKey(!showApiKey)}>
                                        {showApiKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Obtenha em: <a href="https://trello.com/app-key" target="_blank" rel="noreferrer" className="text-primary hover:underline">trello.com/app-key</a>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="token">Token</Label>
                                <div className="relative">
                                    <Input
                                        id="token"
                                        type={showToken ? 'text' : 'password'}
                                        placeholder="Seu Token do Trello"
                                        value={formData.token}
                                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                        className="pr-10"
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowToken(!showToken)}>
                                        {showToken ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Quadros Selecionados</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={fetchBoards} disabled={loadingBoards || !formData.apiKey || !formData.token} className="gap-2">
                                        {loadingBoards ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Sincronizar Quadros
                                    </Button>
                                </div>
                                {availableBoards.length > 0 && (
                                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                                        {availableBoards.map(board => (
                                            <div key={board.id} className="flex items-center gap-2">
                                                <Checkbox id={board.id} checked={(formData.boardIds || []).includes(board.id)} onCheckedChange={() => handleBoardToggle(board.id)} />
                                                <Label htmlFor={board.id} className="cursor-pointer font-normal">{board.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {availableBoards.length === 0 && formData.boardIds && formData.boardIds.length > 0 && (
                                    <div className="text-sm text-muted-foreground italic">
                                        {formData.boardIds.length} quadro(s) selecionado(s) atualmente. Clique em "Sincronizar" para ver nomes.
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="flex justify-end pt-2">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Salvar Configurações
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
