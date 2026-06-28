# VIVA Front-end

Front-end do sistema **VIVA — Vitrine de Inovação e Valor Acadêmico**, desenvolvido para centralizar, acompanhar, avaliar, publicar e divulgar Projetos Integradores acadêmicos.

Este repositório contém a interface web do projeto, construída com **Angular**, integrada a uma API em **FastAPI**.

## Sobre o projeto

O VIVA é uma plataforma acadêmica para gerenciamento de Projetos Integradores. O sistema permite que alunos submetam projetos, professores avaliem, coordenadores publiquem na vitrine pública e administradores gerenciem os dados principais da plataforma.

O sistema também possui uma **vitrine pública**, onde visitantes podem visualizar projetos publicados e acessar o portfólio público dos alunos.

## Tecnologias utilizadas

* Angular
* TypeScript
* HTML
* CSS
* RxJS
* Bootstrap Icons
* API REST com FastAPI
* SQLite3 no back-end

## Funcionalidades principais

### Área pública

* Vitrine pública de projetos.
* Página pública de detalhes do projeto.
* Busca por título, descrição, curso, tecnologias, competências e participantes.
* Visualização de tecnologias, competências e participantes do projeto.
* Portfólio público do aluno.
* Listagem dos projetos que o aluno escolheu exibir no portfólio.

### Área do aluno

* Listagem dos próprios projetos.
* Detalhes do projeto.
* Submissão de projeto.
* Reenvio de projeto após solicitação de revisão.
* Notificações.
* Gerenciamento do portfólio acadêmico.
* Escolha dos projetos que aparecem no portfólio público.

### Área do professor

* Fila de aprovação de projetos.
* Visualização detalhada dos projetos orientados.
* Aprovação, rejeição ou solicitação de revisão.
* Histórico de revisões.
* Notificações.

### Área do coordenador

* Dashboard com resumo geral.
* Visualização de projetos.
* Publicação de projetos aprovados na vitrine pública.

### Área do administrador

* Gestão de usuários.
* Gestão de cursos.
* Gestão de turmas.
* Gestão de tags e tecnologias.
* Gestão de competências.

## Perfis do sistema

O sistema trabalha com quatro perfis principais:

| Perfil        | Código | Área inicial                |
| ------------- | ------ | --------------------------- |
| Aluno         | 1      | `/aluno/projetos`           |
| Professor     | 2      | `/professor/fila-aprovacao` |
| Coordenador   | 3      | `/coordenador/dashboard`    |
| Administrador | 4      | `/administrador/usuarios`   |

## Requisitos para rodar o front-end

Antes de iniciar o projeto, é necessário ter instalado:

* Node.js
* npm
* Angular CLI

Para verificar se estão instalados:

```bash
node -v
npm -v
ng version
```

Caso o Angular CLI não esteja instalado globalmente:

```bash
npm install -g @angular/cli
```

## Como rodar o front-end

### 1. Acessar a pasta do front-end

```bash
cd frontend
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Rodar o servidor Angular

```bash
ng serve
```

### 4. Acessar no navegador

```txt
http://localhost:4200
```

Por padrão, abre na vitrine pública:

```txt
http://localhost:4200/vitrine
```

## Integração com o back-end

O front-end se comunica com o back-end pela URL configurada em:

```txt
src/app/services/api.service.ts
```

URL atual da API:

```ts
http://127.0.0.1:8000/api/v1
```

Para o front funcionar corretamente, o back-end precisa estar rodando em:

```txt
http://127.0.0.1:8000
```

## Como rodar o back-end

Em outro terminal, acesse a pasta do back-end:

```bash
cd viva-backend
```

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

Rode a API:

```bash
python -m uvicorn main:app --reload
```

A documentação da API fica disponível em:

```txt
http://127.0.0.1:8000/docs
```

## Rotas principais

### Rotas públicas

```txt
/vitrine
/vitrine/:slug_publico
/portfolio/:slug_publico
/login
```

Exemplos:

```txt
/vitrine/sistema-viva
/vitrine/projeto-teste-front-end
/portfolio/aluno-teste
```

### Rotas do aluno

```txt
/aluno/projetos
/aluno/projetos/:id
/aluno/submeter-projeto
/aluno/portfolio
/aluno/notificacoes
```

### Rotas do professor

```txt
/professor/fila-aprovacao
/professor/projetos/:id
/professor/historico-revisoes
/professor/notificacoes
```

### Rotas do coordenador

```txt
/coordenador/dashboard
/coordenador/projetos
```

### Rotas do administrador

```txt
/administrador/usuarios
/administrador/cursos
/administrador/turmas
/administrador/tags
/administrador/competencias
```

## Estrutura main do projeto

```txt
src/app
├── administrador
│   ├── usuarios
│   ├── cursos
│   ├── turmas
│   ├── tags
│   └── competencias
│
├── aluno
│   ├── projetos
│   ├── projeto-detalhes
│   ├── submeter-projeto
│   ├── portfolio
│   └── notificacoes
│
├── professor
│   ├── fila-aprovacao
│   ├── projeto-detalhes
│   ├── historico-revisoes
│   └── notificacoes
│
├── coordenador
│   ├── dashboard
│   └── projetos
│
├── publico
│   ├── vitrine-publica
│   ├── projeto-publico-detalhes
│   └── portfolio-publico
│
├── guards
│   └── auth.guard.ts
│
├── services
│   ├── api.service.ts
│   └── auth.service.ts
│
└── shared
    ├── sidebar
    └── topbar
```

## Autenticação e proteção de rotas

A autenticação MVP é básica.

Após o login, os dados do usuário são salvos no `localStorage`.
O sistema usa esses dados para:

* identificar o usuário logado;
* redirecionar conforme o perfil;
* proteger rotas privadas;
* impedir que um perfil acesse a área de outro.

A proteção das rotas fica no arquivo:

```txt
src/app/guards/auth.guard.ts
```

## Observações importantes

* O front-end depende do back-end rodando para login, listagens, cadastros e alterações.
* A URL da API está centralizada no `ApiService`.
* O arquivo `.gitignore` ignora essas pastas: `.angular/cache`, `node_modules`

## Possíveis problemas

### O front não conecta com o back-end

Verifique se o back-end está rodando:

```txt
http://127.0.0.1:8000
```

verifique se a URL da API está correta:

```txt
src/app/services/api.service.ts
```

### O comando `ng` não é reconhecido

Instale o Angular CLI:

```bash
npm install -g @angular/cli
```

Ou rode o projeto com:

```bash
npm start
```

## Equipe

* Erik Guilherme
* Hállefe Daniel
* Barbara Siqueira
* Cid José
* Matheus de Araújo
* Vinicius Medeiros