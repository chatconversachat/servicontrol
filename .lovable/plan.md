````text
PRD - ServiControl: Sistema de Controle de Serviços e Gestão Financeira

1. VISÃO GERAL DO PRODUTO
O ServiControl é um sistema de gestão especializado para prestadores de serviços e oficinas, focado em transformar a operação em um fluxo visual e analítico. O objetivo principal é oferecer controle total sobre orçamentos, custos de execução (mão de obra e materiais) e saúde financeira do negócio através de dashboards compactos e um quadro Kanban intuitivo.

2. PÚBLICO-ALVO
- Micro e pequenos prestadores de serviços.
- Oficinas mecânicas, eletrônicas ou de manutenção geral.
- Gestores que precisam de uma visão rápida de lucratividade por serviço/categoria.

3. FUNCIONALIDADES PRINCIPAIS (Features)

3.1 Gestão de Serviços (Kanban)
- Visualização em Quadros: Fluxo de trabalho organizado em colunas de status.
- Detalhes do Serviço: Modal otimizado que consolida todas as informações (Orçamento, Cliente, Custos, Saldo) sem necessidade de rolagem excessiva.
- Registro de Custos: Diferenciação entre mão de obra (própria/terceirizada) e materiais.
- Pipeline de Status: Localizado no topo para facilitar a navegação e mudança de fase dos serviços.

3.2 Gestão Financeira e Recebimentos
- Controle de Pagamentos: Tela dedicada para registrar e acompanhar o que já foi recebido vs. o que está pendente.
- Capital de Giro: Monitoramento em tempo real do faturamento e saldo disponível.

3.3 Relatórios e Analytics
- KPIs Compactos: Cards de alto nível para Faturamento, Saldo Líquido, Custos e Capital de Giro.
- Análise de Custos por Categoria: Visão detalhada do peso de cada custo (ex: peças, MO) dentro de sua categoria e no negócio como um todo (%).
- Top Clientes: Ranking dos clientes que mais geram receita e margem.
- Situação Financeira: Resumo rápido de serviços totais, valores recebidos e a receber.

3.4 Integrações e Configurações
- Evolution API: Integração nativa para comunicações automatizadas via WhatsApp (configuração de credenciais via interface).
- Exportação: Geração de relatórios em Excel para contabilidade ou backups externos.

4. REQUISITOS NÃO FUNCIONAIS
- Interface Responsiva: Otimizada para uso em desktop e dispositivos móveis (Mobile Nav).
- Segurança: Verificação constante de vulnerabilidades e proteção de rotas (ProtectedRoute).
- Performance: Dashboards carregados via React Query para garantir fluidez nos dados.

5. ARQUITETURA TÉCNICA
- Frontend: React + Vite + Tailwind CSS + Shadcn UI.
- Estado e Dados: Context API (filtros) + TanStack Query (servidores).
- Backend: Supabase (Autenticação e Banco de Dados).
- Integração: Evolution API para automação.
````

Vou criar um arquivo `PRD.md` na raiz do projeto com este conteúdo para documentação permanente.