# Especificação do Sistema (SSD) - Integração Trello

## Fluxo de Sincronização de Dados

O sistema ServiControl atua como uma camada de visualização e análise de dados (Read-Only) quando o modo Trello está ativo. O fluxo abaixo detalha como a informação transita do Trello para a interface do usuário.

### Diagrama de Sequência (SSD)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant P as Interface (Page/Component)
    participant H as useServices (Custom Hook)
    participant C as TrelloClient (API Wrapper)
    participant M as TrelloMapper (Data Parser)
    participant T as Trello API

    U->>P: Acessa Dashboard ou Kanban
    P->>H: Solicita lista de serviços
    H->>H: Verifica Configurações (API Key/Token)
    
    rect rgb(240, 240, 240)
        Note over H, T: Processo de Busca (Fetch)
        H->>C: getCards(boardId)
        C->>T: HTTP GET /boards/{id}/cards
        T-->>C: JSON Response (Raw Cards)
        C-->>H: Array<TrelloCard>
    end

    rect rgb(230, 245, 230)
        Note over H, M: Processo de Transformação (Mapping)
        H->>M: mapTrelloCardToService(card, lists)
        M->>M: Executa Regex no Nome e Descrição
        M->>M: Extrai Código, Cliente, Valor e Custos
        M->>M: Define Status baseado na Lista
        M-->>H: Objeto Service (Interface Unificada)
    end

    H-->>P: Retorna allServices[]
    P-->>U: Exibe Kanban ou Gráficos Analíticos
```

## Regras de Negócio do Mapeamento

1.  **Identificação de Status**:
    - Listas contendo "Andamento" → `in_progress`
    - Listas contendo "Pagamento" ou "Concluído" → `completed`
    - Listas contendo "Acerto" → `overdue`
    - Listas com nomes de meses (Janeiro, Fevereiro...) → `pending`
    
2.  **Extração de Valores**:
    - O sistema busca padrões monetários (`R$ 0,00`) tanto no título do cartão quanto na descrição.
    - Campos específicos como "Valor Fechado" e "Valor Maquininha" têm prioridade na extração.

3.  **Tratamento de Custos**:
    - Linhas na descrição que seguem o padrão `DD/MM - R$ Valor - Descrição` são automaticamente convertidas em itens de despesa.
