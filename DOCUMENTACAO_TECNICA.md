# Documentação Técnica do Projeto Help Finanças

## 1. Visão Geral do Projeto

### Nome do sistema
Help Finanças

### Objetivo principal
Aplicação web de gerenciamento financeiro pessoal que ajuda o usuário a registrar receitas, despesas, metas financeiras, orçamentos e relatórios de desempenho.

### Problema que o sistema resolve
Ajuda pessoas que possuem dificuldade em organizar gastos e receitas, calcular saldos mensais, planejar metas financeiras e acompanhar orçamento e estratégias de alocação de recursos.

### Público-alvo
Usuários finais que buscam controle pessoal de finanças, especialmente iniciantes em educação financeira.

### Principais funcionalidades
- Cadastro e autenticação de usuários.
- Onboarding financeiro personalizado.
- Cadastro de transações (receita e despesa).
- Gerenciamento de categorias de transação.
- Definição e acompanhamento de metas financeiras.
- Planejamento e registro de orçamentos mensais.
- Geração de relatórios e visualização de gráficos.
- Configurações de perfil e tema do aplicativo.

### Escopo do sistema
O sistema atende ao controle financeiro pessoal, com foco em cadastro e monitoramento de transações, metas e orçamentos. Não inclui pagamentos, múltiplos níveis de permissão ou integrações de terceiros no fluxo principal.

### Benefícios aos usuários
- Melhora no controle de fluxo de caixa.
- Auxílio no planejamento de metas.
- Visualização de saúde financeira por meio de dashboards.
- Organização de categorias e orçamentos.
- Suporte à decisão com relatórios mensais.

---

## 2. Tecnologias Utilizadas

### Frontend
- React (via Vite): construção da interface de usuário.
- Vite: bundler e servidor de desenvolvimento.
- TypeScript: tipagem estática nos componentes.
- Tailwind CSS: estilização baseada em classes utilitárias.
- Radix UI: componentes UI acessíveis.
- Recharts: visualização de dados em gráficos.
- React Router: rotas e navegação.
- React Hook Form: suporte a formulários.
- Lucide e MUI Icons: ícones.
- date-fns: manipulação de datas.

### Backend
- Node.js + Express: framework web REST.
- Prisma: ORM para PostgreSQL.
- PostgreSQL: banco de dados relacional.
- bcryptjs: hash de senha.
- jsonwebtoken: autenticação JWT.
- dotenv: carregamento de variáveis de ambiente.
- cors: habilitação de CORS.
- morgan: logging HTTP.
- express-rate-limit: limitação de taxa.
- @supabase/supabase-js: cliente Supabase configurado, não utilizado no fluxo principal.

### Banco de Dados
- Tecnologia: PostgreSQL.
- ORM: Prisma.
- Migrations: não há migrations versionadas no repositório.
- Seeds: não há seeders formais, mas existe script `server/setup-db.js` que cria tabelas manualmente.

### Infraestrutura
- Sem Docker nem IaC explícitos.
- Sem configuração de deploy como Vercel, Railway ou AWS.
- Uso potencial de Supabase para banco/infraestrutura via variáveis de ambiente.

---

## 3. Arquitetura do Sistema

### Arquitetura utilizada
- Monolítica no backend.
- SPA no frontend.
- Arquitetura em camadas leve: `routes -> controllers -> services -> models`.

### Organização da arquitetura
- `routes/`: define endpoints REST.
- `controllers/`: processa requisições e realiza primeiras validações.
- `services/`: contém regras de negócio e agregações financeiras.
- `models/`: instância do Prisma e cliente Supabase.
- `middlewares/`: autenticação JWT e rate limiting.

### Fluxo de execução entre camadas
1. Requisição chega a `app.js`.
2. Rota determina controlador em `routes/`.
3. Middleware executa verificações e autenticação.
4. Controller processa payload, valida e chama `service` ou Prisma.
5. Prisma acessa o banco e retorna dados.
6. Controller retorna JSON para o frontend.

### Diagrama Mermaid de alto nível
```mermaid
flowchart TD
  A[Frontend React SPA] -->|HTTP REST| B[Express API]
  B --> C[Routes]
  C --> D[Controllers]
  D --> E[Services]
  D --> F[Prisma Client]
  F --> G[PostgreSQL]
  F --> H[Supabase Client (não usado)]
```

---

## 4. Estrutura de Pastas

### Raiz do projeto
- `frontend/`: aplicação de interface.
- `server/`: backend e definição de modelo.
- `.vscode/`: configurações do editor.

### Backend
- `server/package.json`: dependências do backend.
- `server/prisma/schema.prisma`: modelo de dados Prisma.
- `server/setup-db.js`: script de criação de tabelas SQL.
- `server/src/app.js`: servidor Express principal.
- `server/src/routes/`: rotas REST.
- `server/src/controllers/`: processamento de requisições.
- `server/src/services/`: lógica de negócio.
- `server/src/middlewares/`: middleware de autenticação e limite.
- `server/src/models/`: cliente Prisma e Supabase.
- `server/src/utils/format.js`: utilitários de formatação.

### Frontend
- `frontend/package.json`: dependências do frontend.
- `frontend/vite.config.ts`: configuração Vite.
- `frontend/tsconfig.json`, `tsconfig.node.json`: configuração TypeScript.
- `frontend/src/main.tsx`: ponto de entrada React.
- `frontend/src/app/api.ts`: cliente HTTP para backend.
- `frontend/src/app/App.tsx`: lógica de estado e fluxo principal.
- `frontend/src/app/components/`: telas e componentes de interface.
- `frontend/src/app/components/ui/`: componentes UI comuns.
- `frontend/src/styles/`: estilos globais.

### Função de cada módulo
- `authController.js`: registro, login, refresh e logout.
- `userController.js`: perfil, onboarding, atualização e exclusão.
- `transactionController.js`: CRUD de transações e resumo.
- `categoryController.js`: CRUD de categorias.
- `goalController.js`: CRUD de metas.
- `budgetController.js`: CRUD de orçamentos.
- `reportController.js`: relatórios mensais e comparativos.
- `transactionService.js`: cálculos de resumo e despesas.
- `reportService.js`: construção de relatórios para frontend.
- `api.ts`: abstrai chamadas HTTP ao backend.

---

## 5. Fluxo Completo do Sistema

### Fluxo de autenticação
- Cadastro: `/api/auth/register` cria usuário e persiste `senha_hash`.
- Login: `/api/auth/login` valida email/senha e retorna `accessToken` e `refreshToken`.
- Refresh: `/api/auth/refresh` renova tokens usando refresh token persistido.
- Logout: `/api/auth/logout` remove refresh token.
- Middleware `authMiddleware`: valida `Authorization: Bearer <token>`.

### Fluxo financeiro
- Cadastro de transações: `/api/transactions` cria receita/despesa.
- Edição/exclusão de transações: endpoints de update/delete.
- Categorias: lista padrões e categorias do usuário.
- Metas: cadastro, atualização e conclusão automática.
- Orçamentos: registro de limites mensais e estratégias.
- Relatórios: resumo mensal e comparação 6 meses.

### Fluxo administrativo
- Não há roles administrativas separadas.
- Controle de acesso é baseado apenas no `userId` JWT.

### Fluxo de API passo a passo
1. Frontend envia requisição com token.
2. Middleware valida token.
3. Controller processa dados.
4. Service ou Prisma realiza operações.
5. Resposta JSON retorna ao frontend.

---

## 6. Modelagem de Dados

### Tabelas e entidades
- `usuarios`
- `perfis_financeiros`
- `categorias`
- `transacoes`
- `metas`
- `orcamentos`
- `refresh_tokens`

### Detalhes de cada entidade
#### usuarios
- `id`: UUID PK.
- `nome`: String.
- `email`: String único.
- `senha_hash`: String.
- `renda_mensal`: Decimal opcional.
- `estrategia_financeira`: String opcional.
- `onboarding_concluido`: Boolean.
- `criado_em`, `atualizado_em`: DateTime.

#### perfis_financeiros
- `id`: UUID PK.
- `usuario_id`: UUID único FK.
- `objetivo_principal`: String.
- `perfil_consumidor`: String.
- `dependentes`: Int.
- `config_estrategia`: Json opcional.
- `criado_em`: DateTime.

#### categorias
- `id`: UUID PK.
- `usuario_id`: UUID FK opcional.
- `nome`, `tipo`, `grupo_estrategia`, `icone`, `cor`, `eh_padrao`, `criado_em`.

#### transacoes
- `id`: UUID PK.
- `usuario_id`: UUID FK.
- `categoria_id`: UUID FK opcional.
- `tipo`, `valor`, `descricao`, `data`, `recorrencia`, `criado_em`, `atualizado_em`.

#### metas
- `id`: UUID PK.
- `usuario_id`: UUID FK.
- `nome`, `tipo_meta`, `valor_total`, `valor_atual`, `data_limite`, `status`, `criado_em`, `atualizado_em`.

#### orcamentos
- `id`: UUID PK.
- `usuario_id`: UUID FK.
- `mes`, `ano`, `estrategia`, `limite_essencial`, `limite_desejo`, `limite_prioridade`, `config_personalizada`, `criado_em`.
- Unique `usuario_id + mes + ano`.

#### refresh_tokens
- `id`: UUID PK.
- `usuario_id`: UUID FK.
- `token`: String único.
- `expires_em`: DateTime.
- `criado_em`: DateTime.

---

## 7. Regras de Negócio

### Regras implementadas
- E-mails únicos no cadastro.
- Senha mínima e hash com bcrypt.
- Validação de `tipo` de transação.
- Valores de transação devem ser positivos.
- Recorrência de transação limitada a valores permitidos.
- Metas não podem ter prazo no passado.
- Metas com valores maiores que R$ 99.999.999,99 são rejeitadas.
- Meta muda para `concluida` quando valor atual >= total.
- Exclusão de categoria custom preserva transações, mas zera `categoria_id`.
- Orçamentos únicos por mês/ano por usuário.
- Rate limiting para login.

### Regras potenciais faltantes
- Recuperação de senha.
- Políticas de redefinição de sessão.
- Validação de todos os campos de entrada com schemas centralizados.

---

## 8. APIs e Endpoints

| Método | URL | Objetivo | Body | Resposta | Códigos |
|---|---|---|---|---|---|
| POST | /api/auth/register | Cadastro | `nome, email, senha, renda_mensal?` | Usuário criado | 201, 400, 409 |
| POST | /api/auth/login | Login | `email, senha` | `accessToken, refreshToken, user` | 200, 400, 401, 429 |
| POST | /api/auth/refresh | Renovar token | `refreshToken` | `accessToken, refreshToken` | 200, 400, 401 |
| POST | /api/auth/logout | Logout | `refreshToken` | `204` | 204, 400 |
| GET | /api/users/me | Perfil | - | Usuário | 200, 401 |
| PUT | /api/users/me | Atualiza perfil | `nome?, email?, senha?, renda_mensal?, estrategia_financeira?` | Usuário | 200, 400, 409 |
| DELETE | /api/users/me | Excluir conta | - | 204 | 204, 401 |
| POST | /api/users/onboarding | Onboarding | `objetivo_principal, perfil_consumidor, dependentes, config_estrategia?` | Perfil | 200, 400 |
| GET | /api/transactions | Listar transações | query params | Lista | 200 |
| POST | /api/transactions | Criar transação | `tipo, valor, descricao?, data, categoria_id?, categoria_key?, recorrencia` | Transação + resumo | 201, 400 |
| PUT | /api/transactions/:id | Atualizar transação | campos | Transação | 200, 400, 404 |
| DELETE | /api/transactions/:id | Deletar transação | - | 204 | 204, 404 |
| GET | /api/transactions/summary | Resumo mensal | query | Totais | 200 |
| GET | /api/categories | Listar categorias | query | Lista | 200 |
| POST | /api/categories | Criar categoria | `nome, tipo, grupo_estrategia?, icone?, cor?` | Categoria | 201, 400 |
| PUT | /api/categories/:id | Atualizar categoria | campos | Categoria | 200, 404 |
| DELETE | /api/categories/:id | Excluir categoria | - | 204 | 204, 404 |
| GET | /api/goals | Listar metas | query | Lista | 200 |
| POST | /api/goals | Criar meta | `nome, tipo_meta, valor_total, valor_atual?, data_limite` | Meta | 201, 400 |
| PUT | /api/goals/:id | Atualizar meta | campos | Meta | 200, 400, 404 |
| DELETE | /api/goals/:id | Excluir meta | - | 204 | 204, 404 |
| GET | /api/budgets | Listar orçamentos | query | Lista | 200 |
| POST | /api/budgets | Criar orçamento | `mes, ano, estrategia, limite_essencial, limite_desejo, limite_prioridade, config_personalizada?` | Orçamento | 201, 400 |
| PUT | /api/budgets/:id | Atualizar orçamento | campos | Orçamento | 200, 404 |
| DELETE | /api/budgets/:id | Deletar orçamento | - | 204 | 204, 404 |
| GET | /api/reports/monthly | Relatório mensal | query | Relatório | 200 |
| GET | /api/reports/compare | Relatório comparativo | - | Lista | 200 |
| GET | /api/reports/export | Export payload | - | Payload JSON | 200 |

---

## 9. Segurança

### O que está implementado
- Hash de senha (`bcryptjs`).
- JWT para autenticação.
- Refresh token persistido em banco.
- Rate limiting em login.
- CORS habilitado.

### Vulnerabilidades identificadas
- Ausência de CSRF explícito.
- Validação de entrada manual e sem schema central.
- Falta de sanitização robusta de payload.
- Token refresh não gerenciado automaticamente no frontend.
- Cliente Supabase presente sem uso efetivo.

### Melhorias
- Implementar validação com schema (`zod`/`Joi`).
- Adicionar CSRF e políticas `SameSite` em cookies se usar cookies.
- Remover código e dependências não usados.
- Adicionar logs de segurança e auditoria.

---

## 10. Testes

### Status atual
- Não há testes identificados no repositório.
- Não há frameworks de teste configurados.

### Recomendações
- Testes unitários para controllers e serviços.
- Testes de integração para endpoints REST.
- Testes E2E para fluxo de login, onboarding, transações e relatórios.

---

## 11. Padrões de Projeto

### Padrões identificados
- Service: `transactionService.js`, `reportService.js`.
- Controller: uso claro de controllers no backend.
- Singleton: `PrismaClient` em `prismaClient.js`.
- Facade implícito: `api.ts` abstrai chamadas HTTP.
- Middleware: `authMiddleware` e `rateLimiter`.

### Padrões ausentes
- Repository formal.
- Dependency Injection explícita.
- DDD completo.
- Factory ou Strategy implementados.

---

## 12. Qualidade de Código

### Pontos Fortes
- Separação clara de responsabilidades no backend.
- Uso de Prisma para mapeamento de dados.
- Frontend organizado em componentes.
- UX com dashboards e formulários.

### Pontos Fracos
- Falta de testes.
- Validação de entrada inconsistente.
- Arquivos gerados (`dist`, `node_modules`) no repositório.
- Dependência de cliente Supabase não utilizado.

### Dívidas Técnicas
- Ausência de migrations versionadas.
- Falta de deploy automatizado.
- Falta de refresh token no frontend.
- Recursos de segurança incompletos.

### Refatorações Recomendadas
- Adicionar testes.
- Usar `prisma migrate` com migrations.
- Refatorar validações para schema central.
- Remover artefatos gerados do repositório.
- Implementar refresh token e controle de sessão.

---

## 13. Funcionalidades Implementadas

### Autenticação
- Login, registro, logout e refresh token.

### Onboarding
- Fluxo de cadastro de perfil financeiro.

### Transações
- Registro, listagem, edição, exclusão e resumo.
- Criação automática de categorias via `categoria_key`.

### Categorias
- Listagem de categorias padrão e customizadas.
- CRUD de categorias custom.

### Metas
- Cadastro de metas financeiras.
- Atualização de metas e cálculo de status.

### Orçamentos
- Registro de orçamentos mensais e limites por estratégia.

### Relatórios
- Relatório mensal.
- Comparativo de 6 meses.
- Payload de exportação.

### UI
- Dashboard, transações, metas, relatórios e configurações.
- Tema claro/escuro.

---

## 14. Funcionalidades Incompletas

- Refresh token não usado automaticamente no frontend.
- Exportação de relatório não gera PDF.
- Cliente Supabase presente, mas não integrado.
- Script `setup-db.js` criador de schema não é parte de rotina de migrations.
- Ausência de recuperação de senha.
- `dist` irrelevante no repositório.

---

## 15. Performance

### Observações
- Transações sem paginação podem crescer em volume.
- Relatórios 6 meses usam loop sequencial de consultas.
- Agregações simples e diretas, mas escalabilidade limitada.

### Possíveis otimizações
- Adicionar paginação às transações.
- Criar índices adequados no banco.
- Reutilizar consultas em vez de calcular repetidamente.
- Implementar cache de relatórios se necessário.

---

## 16. Deploy e Infraestrutura

### Processo de build
- Frontend: `npm run dev` ou `vite build`.
- Backend: `npm run dev` com `nodemon` ou `npm start`.

### Variáveis de ambiente
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`

### Configurações
- Configuração de produção ausente.
- Deploy não automatizado.
- Infraestrutura implícita por Supabase.

---

## 17. Resumo Acadêmico para TCC

### Descrição do Sistema
Help Finanças é um sistema de controle financeiro pessoal desenvolvido em arquitetura monolítica com frontend React/Vite e backend Node.js/Express. O produto permite a gestão de receitas, despesas, metas e orçamentos por meio de uma interface intuitiva e relatórios visuais.

### Arquitetura Utilizada
A aplicação utiliza uma arquitetura em camadas. O backend separa logicamente rotas, controllers, serviços e acesso a dados via Prisma. O frontend é uma aplicação SPA composta por componentes React que consomem APIs REST.

### Tecnologias Empregadas
- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts.
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT.
- Infraestrutura: Supabase sugerido por variáveis de ambiente.

### Requisitos Funcionais
- Autenticação de usuários.
- Registro e gerenciamento de transações.
- Acompanhamento de metas financeiras.
- Consultas de relatórios mensais.
- Configurações pessoais.

### Requisitos Não Funcionais
- Persistência em banco relacional.
- Interface responsiva.
- Segurança básica com JWT.
- Logging de requisições.

### Casos de Uso
- Cadastro de usuário, login e onboarding.
- Registro de despesas e receitas.
- Acompanhamento de metas e orçamentos.
- Revisão de desempenho financeiro via relatórios.

### Fluxo do Sistema
1. O usuário acessa a SPA.
2. Autentica via backend.
3. Realiza CRUD financeiro.
4. O backend valida e persiste em PostgreSQL.
5. A interface exibe dados e gráficos.

### Banco de Dados
Modelo relacional com tabelas focadas em usuário, perfil financeiro, categorias, transações, metas, orçamentos e tokens de refresh.

### Segurança
Autenticação JWT, hash de senha e rate limiting fazem parte das medidas de segurança, embora faltem técnicas avançadas como CSRF e validação de schema completa.

### Conclusão Técnica
O sistema apresenta uma solução MVP viável para controle financeiro pessoal. Seu design modular no backend e os componentes do frontend oferecem boa base para evolução, mas requerem melhorias em testes, deploy, validação de entrada e maturidade de produção.

---

## 18. Ajustes recomendados para o TCC

### 18.1 O que corrigir imediatamente
- Se o TCC disser que a arquitetura backend é MVC completa, altere para:
  - backend em camadas com `routes`, `controllers`, `services` e `models`
  - frontend separado como SPA React/Vite
- Se o TCC mencionar views server-side, ajuste para dizer que a visualização está no frontend React e o backend fornece apenas APIs REST.
- Se o TCC disser que o banco de dados é Supabase, corrija para:
  - PostgreSQL acessado via Prisma
  - `@supabase/supabase-js` existe no código, mas não é usado no fluxo principal
- Se houver afirmação de migrations versionadas, ajuste para:
  - não há migrations no repositório
  - há um script SQL manual `server/setup-db.js` para criar tabelas

### 18.2 Funcionalidades reais do sistema
Use estas descrições para alinhar o TCC à implementação real:
- Autenticação: registro, login, logout e refresh token via JWT
- Onboarding financeiro: criação de perfil financeiro após cadastro
- Transações: CRUD de receita/despesa, resumo mensal e criação automática de categoria via `categoria_key`
- Categorias: categorias padrão e categorias custom por usuário
- Metas: cadastro, atualização e conclusão automática ao atingir valor total
- Orçamentos: orçamento mensal com limites por estratégia e unicidade por usuário/mês/ano
- Relatórios: relatório mensal e comparativo de 6 meses, além de exportação em JSON

### 18.3 O que deixar como limitação
Inclua estes pontos como limitações do sistema entregue:
- não há recuperação de senha implementada
- exportação de relatório não gera PDF, apenas JSON
- não há roles administrativas nem perfis de permissão avançados
- refresh token não é renovado automaticamente no frontend
- não há deploy automatizado, Docker ou IaC no repositório

### 18.4 Termos técnicos mais corretos
Substitua termos vagos por estes:
- `API RESTful` em vez de apenas `API`
- `JWT Bearer token` em vez de `cookie de sessão` (não há uso de cookies para auth no código)
- `Prisma ORM` em vez de `mapeamento manual de SQL`
- `React + Vite` em vez de `React puro` ou `React + Create React App`

### 18.5 Seções do TCC que devem ser reescritas
- Metodologia / arquitetura: explicitar camada de frontend separada e backend API
- Tecnologias: incluir Vite, Tailwind CSS, Recharts, Prisma, PostgreSQL
- Modelo de dados: usar as tabelas reais (`usuarios`, `perfis_financeiros`, `categorias`, `transacoes`, `metas`, `orcamentos`, `refresh_tokens`)
- Segurança: foco em `bcrypt`, `JWT`, `refresh tokens`, `rate limit`, ausência de CSRF e validação centralizada
- Conclusão: enfatizar que o sistema é um MVP funcional com necessidade de testes, deploy e validação adicionais

---

## Informações Finais
- Arquivos de código analisados: `113`.
- Linguagens identificadas: JavaScript, TypeScript, JSON, SQL, Markdown.
- Tecnologias identificadas: React, Vite, Tailwind CSS, Express, Prisma, PostgreSQL, JWT.
- Arquitetura identificada: Monolito com camadas `routes/controllers/services/models`.
- Nível de maturidade: MVP.
- Recomendações principais: testes, migrations, refresh token no frontend, remover artefatos gerados, documentar deploy.
