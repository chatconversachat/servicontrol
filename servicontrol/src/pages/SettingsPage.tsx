import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSettings, TrelloSettings } from '@/hooks/useSettings';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { TrelloClient } from '@/integrations/trello/client';
import { Checkbox } from '@/components/ui/checkbox';
import { TrelloBoard } from '@/integrations/trello/types';

export default function SettingsPage() {
    const { settings, saveSettings } = useSettings();
    const [formData, setFormData] = useState<TrelloSettings>(settings);
    // Initialize availableBoards from saved settings if available
    const [availableBoards, setAvailableBoards] = useState<TrelloBoard[]>(settings.savedBoards || []);
    const [loadingBoards, setLoadingBoards] = useState(false);

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

            // Update formData with the new list of known boards so it gets saved
            setFormData(prev => ({
                ...prev,
                savedBoards: boards
            }));

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

        // Give time for toast
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Configurações"
                description="Gerencie as integrações e preferências do sistema"
            />

            <div className="grid gap-6">
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
                                <Input
                                    id="apiKey"
                                    placeholder="Sua API Key do Trello"
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Obtenha em: <a href="https://trello.com/app-key" target="_blank" rel="noreferrer" className="text-primary hover:underline">trello.com/app-key</a>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="token">Token</Label>
                                <Input
                                    id="token"
                                    type="password"
                                    placeholder="Seu Token do Trello"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Quadros Selecionados</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchBoards}
                                        disabled={loadingBoards || !formData.apiKey || !formData.token}
                                        className="gap-2"
                                    >
                                        {loadingBoards ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Sincronizar Quadros
                                    </Button>
                                </div>

                                {availableBoards.length > 0 && (
                                    <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                                        {availableBoards.map(board => (
                                            <div key={board.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={board.id}
                                                    checked={(formData.boardIds || []).includes(board.id)}
                                                    onCheckedChange={() => handleBoardToggle(board.id)}
                                                />
                                                <Label htmlFor={board.id} className="cursor-pointer font-normal">
                                                    {board.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Show currently saved IDs if not yet fetched list, just as fallback display */}
                                {availableBoards.length === 0 && formData.boardIds && formData.boardIds.length > 0 && (
                                    <div className="text-sm text-muted-foreground italic">
                                        {formData.boardIds.length} quadro(s) selecionado(s) atualmente (IDs: {formData.boardIds.join(', ')}). Clique em "Buscar" para ver nomes.
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
