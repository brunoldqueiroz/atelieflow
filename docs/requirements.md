versao: 1.3

# **RELATÓRIO TÉCNICO DE PROJETO DE EXTENSÃO UNIVERSITÁRIA (PEX V)**

## **CURSO DE ANÁLISE E DESENVOLVIMENTO DE SISTEMAS — FACULDADE DESCOMPLICA / UNIAMÉRICA**

## **1\. IDENTIFICAÇÃO DO PROJETO E DA ORGANIZAÇÃO PARCEIRA**

| Campo | Especificação Institucional / Operacional&nbsp;&nbsp; |
| :---- | :---- |
| **Título do Projeto** | AteliêFlow: Sistema Web Integrado de Gestão Operacional, Controle de Encomendas e Fluxo Financeiro para Encadernação Artesanal |
| **Nome da Aplicação** | AteliêFlow |
| **Organização Parceira** | Ateliê de Encadernação e Papelaria Personalizada \[Inserir Razão Social / Nome Fantasia\] |
| **Segmento / Atuação** | Papelaria personalizada e cartonagem sob demanda: cadernos escolares/universitários, agendas, cadernetas de saúde infantil e blocos de anotações. |
| **CNPJ / MEI** | \[Inserir CNPJ ou Registro MEI\] |
| **Representante Legal** | \[Nome da Proprietária / Responsável\] |
| **Endereço Completo** | \[Inserir Logradouro, Número, Bairro, Município \- UF\] |
| **Vínculo com ODS (ONU)** | ODS 8 (Trabalho Decente e Crescimento Econômico) e ODS 9 (Indústria, Inovação e Infraestrutura) |

 

## **2\. INTRODUÇÃO E DIAGNÓSTICO SITUACIONAL**

A extensão universitária no âmbito do curso de Análise e Desenvolvimento de Sistemas (ADS) atua como mecanismo de articulação entre o arcabouço teórico-metodológico e as demandas operacionais concretas de microempreendimentos. No contexto da confecção artesanal e da cartonagem personalizada, os processos produtivos operam frequentemente sob orçamentos ad hoc e rotinas manuais de controle.

A partir de diagnóstico situacional realizado com a responsável pelo ateliê, identificou-se uma movimentação média entre 5 e 30 encomendas mensais, com elevada concentração de clientes recorrentes. O fluxo de captação e gerenciamento é operado por meio de anotações físicas em cadernos e agendas, em conjunto com trocas de mensagens instantâneas via WhatsApp. Tal estrutura engendra quatro fragilidades críticas:

> * **Fragmentação de dados:** Ausência de repositório centralizado, provocando dispersão de requisitos específicos (grafia de nomes nas capas, laminação escolhida e especificidades de miolo);  
> * **Vulnerabilidade no controle de prazos:** A ausência de escalonamento cronológico visual eleva o risco de atrasos na entrega dos itens personalizados;  
> * **Opacidade financeira:** Dificuldade na apuração precisa de faturamento bruto, custos diretos de matéria-prima e margem operacional líquida mensal;  
> * **Imprevisibilidade de insumos:** Falta de acompanhamento sistemático de estoque crítico (arames wire-o, garras metálicas, películas holográficas e papéis de alta gramatura).

 

## **3\. OBJETIVOS DO PROJETO**

**3.1 Objetivo Geral:** Projetar, desenvolver e validar preliminarmente o sistema web **AteliêFlow** sob medida para o gerenciamento centralizado de pedidos, orçamentação e pipeline visual de produção artesanal da microempresa parceira.

**3.2 Objetivos Específicos:**

> * Levantar e formalizar os requisitos funcionais e não funcionais inerentes ao ciclo de vida das encomendas personalizadas;  
> * Elaborar a modelagem relacional de dados normalizada em Terceira Forma Normal (3FN), segregando entidades categóricas;  
> * Implementar arquitetura cliente-servidor desacoplada, orientada a APIs RESTful com backend FastAPI e frontend React/Tailwind CSS;  
> * Executar um ciclo piloto do AteliêFlow com dados reais de encomendas em ambiente de homologação, aferindo ganhos operacionais e usabilidade.

 

## **4\. ESPECIFICAÇÃO DE REQUISITOS DO SISTEMA**

| Código | Descrição Funcional | Escopo&nbsp;&nbsp; |
| :---- | :---- | :---- |
| **RF01** | Cadastro e manutenção de registros de clientes (nome, telefone/WhatsApp, histórico e observações de preferência). | Piloto |
| **RF02** | Manutenção paramétrica de tipos de produto confeccionados (Caderno, Agenda, Caderneta de Vacina, Bloco de Notas). | Piloto |
| **RF03** | Configuração sequencial e padronizada das etapas do pipeline de status da confecção (Orçado, Aguardando Arte, Em Produção, Pronto, Entregue). | Piloto |
| **RF04** | Registro e orçamentação da encomenda, incluindo campos livres de personalização da capa, prazos de entrega e valores (total e sinal adiantado). | Piloto |
| **RF05** | Painel visual de acompanhamento da esteira de confecção (Kanban) ordenado pelas datas de entrega mais urgentes. | Piloto |
| **RF06** | Gestão de contas operacionais (receitas consolidadas e aquisições de matéria-prima). | Refinamento |

 

## **5\. ARQUITETURA DE SOFTWARE E MODELAGEM DE DADOS**

O sistema **AteliêFlow** adota arquitetura em camadas desacopladas via API RESTful. O backend em Python opera sobre o framework **FastAPI**, assegurando validação estrita de dados através do Pydantic e documentação automática Swagger/OpenAPI. O armazenamento persistente utiliza o banco de dados **PostgreSQL** com mapeamento objeto-relacional via **SQLAlchemy ORM**, garantindo integridade referencial com chaves estrangeiras e evolução de esquema por migrações versionadas (**Alembic**). A camada de apresentação (frontend) consiste em uma Single Page Application (SPA) modular desenvolvida com **React**, inicializada e empacotada por **Vite** e estilizada com **Tailwind CSS**, viabilizando uso fluido tanto em navegadores desktop quanto móveis na bancada de trabalho.

A implantação é containerizada e orquestrada por **Docker Compose** em quatro serviços: `db` (PostgreSQL 17), `backend` (FastAPI, com aplicação automática das migrações na inicialização), `frontend` (SPA servida por **nginx**, que também atua como proxy reverso de `/api`, eliminando a necessidade de CORS entre os serviços) e `backup` (rotina automatizada de `pg_dump` diário, compactado, com retenção de 14 dias e procedimento de restauração documentado). Visando integrações futuras com ferramentas de AI e BI, o banco expõe acesso multiusuário: além do usuário proprietário da aplicação, um usuário somente leitura (`atelieflow_leitura`) recebe privilégio de `SELECT` sobre todas as tabelas atuais e futuras, e a porta de conexão pode ser publicada na rede local de forma configurável.

| Tabela | Atributo | Tipo de Dado | Restrição / Chave&nbsp;&nbsp; |
| :---- | :---- | :---- | :---- |
| **clientes** | id | INTEGER | PRIMARY KEY AUTOINCREMENT |
|  | nome | VARCHAR(120) | NOT NULL |
|  | telefone | VARCHAR(20) | NOT NULL (WhatsApp) |
|  | observacoes | TEXT | NULLABLE |
| **tipos\_produto** | id | INTEGER | PRIMARY KEY AUTOINCREMENT |
|  | nome | VARCHAR(60) | NOT NULL UNIQUE |
|  | ativo | BOOLEAN | DEFAULT TRUE |
| **status\_encomenda** | id | INTEGER | PRIMARY KEY AUTOINCREMENT |
|  | nome | VARCHAR(40) | NOT NULL UNIQUE |
|  | ordem | INTEGER | NOT NULL (Sequência Kanban) |
|  | cor\_badge | VARCHAR(20) | NULLABLE |
| **encomendas** | id | INTEGER | PRIMARY KEY AUTOINCREMENT |
|  | cliente\_id | INTEGER | FOREIGN KEY REFERENCES clientes(id) |
|  | tipo\_produto\_id | INTEGER | FOREIGN KEY REFERENCES tipos\_produto(id) |
|  | status\_id | INTEGER | FOREIGN KEY REFERENCES status\_encomenda(id) |
|  | detalhes\_personalizacao | TEXT | NOT NULL |
|  | data\_pedido | DATETIME | DEFAULT CURRENT\_TIMESTAMP |
|  | data\_entrega\_prevista | DATE | NOT NULL |
|  | valor\_total | DECIMAL(10,2) | NOT NULL |
|  | valor\_sinal | DECIMAL(10,2) | DEFAULT 0.00 |
|  | observacoes\_internas | TEXT | NULLABLE |

 

## **6\. EXECUÇÃO PRELIMINAR (ATIVIDADE PILOTO)**

A execução preliminar contempla a implantação assistida do AteliêFlow em ambiente de testes. O plano experimental é composto por:

> * **Carga inicial:** Inserção dos registros básicos de tipos de produto e parametrização dos 5 status sequenciais do Kanban;  
> * **Rotina assistida:** Registro simultâneo de 5 a 10 encomendas reais recebidas no ateliê, avaliando o tempo de lançamento e clareza das informações;  
> * **Métricas de acompanhamento:** Redução do tempo de busca por status de pedido e integridade na grafia dos nomes estampados em capas;  
> * **Avaliação de usabilidade:** Coleta de feedback qualitativo com a artesã sobre facilidade de operação e pontos de atrito na interface.

 

## **7\. REGISTRO DE EVIDÊNCIAS**

\[Seção destinada à anexação do Termo de Autorização devidamente assinado, fotografias da visita e realização de testes na bancada de trabalho e capturas de tela do sistema em operação\].

 

## **REFERÊNCIAS**

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 10719**: Informação e documentação \- Relatório técnico e/ou científico \- Apresentação. Rio de Janeiro: ABNT, 2015\.

PRESSMAN, R. S.; MAXIM, B. R. **Engenharia de Software**: uma abordagem profissional. 8\. ed. Porto Alegre: AMGH, 2016\.

SOMMERVILLE, I. **Engenharia de Software**: 9\. ed. São Paulo: Pearson Prentice Hall, 2011\.