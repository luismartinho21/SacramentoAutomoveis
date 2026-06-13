# Guia de Publicação Online (Render & Domínio Personalizado)

Este guia descreve o processo passo a passo para colocar o website do stand **Sacramento Automóveis** online utilizando o **Render.com** (plataforma de alojamento estável e de baixo custo) e um domínio registado (ex: `.pt`).

Como a aplicação utiliza uma base de dados SQLite (`database.db`) e guarda as fotos das viaturas no disco do servidor, é **fundamental** configurar um disco persistente no Render. Caso contrário, sempre que o servidor reiniciar, as fotos novas e os novos registos de carros seriam apagados.

---

## 1. Subir o Código para o GitHub

1. Aceda ao seu GitHub e crie um novo repositório vazio com o nome `sacramento-automoveis` (não adicione README nem .gitignore, pois o projeto já os tem).
2. Na sua linha de comandos (dentro da pasta do projeto), corra os seguintes comandos para ligar o projeto local ao seu GitHub e enviar os ficheiros:
   ```bash
   git remote add origin https://github.com/SEU_UTILIZADOR/sacramento-automoveis.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Criar a Conta e Configurar o Web Service no Render

1. Aceda a [Render.com](https://render.com) e crie uma conta (de preferência com o email do proprietário do stand, para que as faturas e o controlo fiquem em nome dele).
2. No painel principal do Render, clique em **New** (Novo) no canto superior direito e selecione **Web Service**.
3. Associe a sua conta GitHub e selecione o repositório `sacramento-automoveis`.
4. Configure as seguintes definições do serviço:
   * **Name**: `sacramento-automoveis`
   * **Region**: Escolha uma região europeia (ex: `Frankfurt (EU)`) para menor latência em Portugal.
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: Escolha o plano **Free** (gratuito) para testes, ou o plano **Starter** (cerca de $7/mês) para produção. O plano Starter é altamente recomendado para produção pois evita que o site "adormeça" por inatividade.

---

## 3. Configurar Armazenamento Persistente (Volume)

Para garantir que a base de dados SQLite e as fotos enviadas pelo vendedor não são apagadas no reinício do servidor:

1. No menu lateral do seu Web Service no Render, clique em **Disks** (Discos).
2. Clique em **Add Disk** (Adicionar Disco).
3. Preencha as configurações:
   * **Name**: `sacramento-data`
   * **Mount Path**: `/data`
   * **Size**: `1 GB` (o plano Starter de $1/mês para o disco é mais do que suficiente para albergar milhares de fotos compactadas e registos).
4. Clique em **Create**.

---

## 4. Configurar Variáveis de Ambiente e Base de Dados

A aplicação está preparada para trabalhar com duas opções de base de dados em produção:

### Opção A: Utilizar PostgreSQL Gratuito (Recomendado - Neon ou Supabase)
Esta opção liga o site a uma base de dados PostgreSQL externa e robusta (como as oferecidas gratuitamente pela [Neon.tech](https://neon.tech) ou [Supabase.com](https://supabase.com)).
1. Crie uma base de dados gratuita na Neon ou Supabase e copie o endereço de ligação (**Connection String**), que terá um aspeto como: `postgres://utilizador:palavrapasse@servidor/database?sslmode=require`.
2. No menu lateral do seu Web Service no Render, aceda a **Environment** (Ambiente) e clique em **Add Environment Variable**.
3. Adicione as seguintes variáveis:
   * **Chave**: `DATABASE_URL` | **Valor**: `[Endereço do PostgreSQL que copiou]`
   * **Chave**: `UPLOADS_PATH` | **Valor**: `/data/uploads` (para manter as fotos das viaturas no disco do Render).
4. Clique em **Save Changes**. O Render irá reiniciar o serviço e a aplicação criará automaticamente as tabelas e o administrador no PostgreSQL.

### Opção B: Utilizar a Base de Dados SQLite Local (Ficheiro)
Esta opção utiliza o ficheiro local SQLite `database.db` guardado no volume de disco do Render.
1. No menu lateral do seu Web Service no Render, aceda a **Environment** (Ambiente) e clique em **Add Environment Variable**.
2. Adicione as seguintes variáveis:
   * **Chave**: `DATABASE_PATH` | **Valor**: `/data/database.db`
   * **Chave**: `UPLOADS_PATH` | **Valor**: `/data/uploads`
3. Clique em **Save Changes**.

*Nota: Na primeira inicialização em produção (seja em PostgreSQL ou SQLite), a base de dados estará vazia e o sistema criará automaticamente o utilizador `admin` com a palavra-passe `sacramento2026` e semeará os dois automóveis reais com fotos (Ford Fiesta e Renault Megane).*

---

## 5. Associar Domínio Personalizado (ex: `.pt`)

Depois de registar o domínio numa entidade (como Dominios.pt, PTISP ou Amen.pt):

1. No painel do Render, aceda a **Settings** (Definições) do Web Service.
2. Desça até à secção **Custom Domains** (Domínios Personalizados) e clique em **Add Custom Domain**.
3. Escreva o domínio contratado (ex: `sacramentoautomoveis.pt` ou `www.sacramentoautomoveis.pt`) e clique em **Save**.
4. O Render fornecerá as instruções DNS que deve configurar na entidade onde comprou o domínio:
   * **Registo CNAME** para o subdomínio `www` a apontar para o endereço do Render (ex: `sacramento-automoveis.onrender.com`).
   * **Registo A / ANAME** para o domínio raiz (sem www) a apontar para o IP fornecido pelo Render.
5. Após a alteração nos servidores de DNS (pode demorar entre 1 a 4 horas a propagar), o site passará a estar acessível no endereço oficial com certificado de segurança **HTTPS** gratuito emitido de forma automática pelo Render.
