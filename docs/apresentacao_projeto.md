# Sacramento Automóveis — Proposta e Guia de Demonstração

Preparámos um protótipo funcional, moderno e interativo do novo website para o stand **Sacramento Automóveis**. O objetivo é permitir que os clientes consultem o stock disponível em tempo real, vejam fotos e detalhes de cada viatura, e entrem em contacto direto (via formulário ou WhatsApp). 

Do lado do stand, o administrador (vendedor) terá uma área privada protegida por palavra-passe para gerir as viaturas e ler as mensagens dos clientes.

---

## 💎 Características Principais do Website

### 1. Experiência do Cliente (Área Pública)
* **Design Moderno e Premium**: Interface em modo escuro com acabamentos de luxo (grafite e detalhes em dourado champagne). Ajusta-se perfeitamente a telemóveis, tablets e computadores.
* **Pesquisa e Filtros Avançados**: O cliente pode filtrar instantaneamente por **Marca**, **Combustível**, **Tipo de Caixa** e **Preço Máximo**. O stock é atualizado dinamicamente.
* **Ficha de Detalhe Completa**: Cada carro tem uma página dedicada com:
  * Galeria de fotos interativa (carousel de imagens).
  * Tabela de características (potência, cilindrada, kms, ano, cor, etc.).
  * Lista de equipamento extra (GPS, AC Automático, Sensores, etc.).
  * Descrição comercial detalhada.
* **Secção "Sobre Nós"**: Espaço dedicado a apresentar a história, os valores e o compromisso de confiança do stand, acompanhado por um painel visual das instalações.
* **Canais de Contacto Direto**:
  * **Formulário de Interesse**: Envia uma mensagem que cai diretamente na caixa de entrada do vendedor.
  * **Botão WhatsApp**: Abre uma conversa direta com o vendedor e **pré-preenche uma mensagem automática** indicando exatamente o carro, o ano e o preço em que o cliente está interessado (ex: *"Olá, gostaria de obter informações sobre o Ford Fiesta (2010) de 12.500€"*).

### 2. Painel de Controlo do Vendedor (Back-Office Privado)
* **Acesso Seguro**: Área protegida por credenciais (Utilizador/Palavra-passe).
* **Gestão de Stock (CRUD)**:
  * **Adicionar Viatura**: Permite introduzir marca, modelo, versão, preço, ano, kms, especificações de motor e cor.
  * **Seletor de Equipamentos**: Checkbox simples para selecionar facilmente os extras da viatura.
  * **Upload de Fotos Simples**: Zona para arrastar e soltar (drag-and-drop) até 10 fotos por carro de uma só vez.
  * **Editar e Eliminar**: Permite atualizar preços, adicionar/remover fotos ou retirar carros vendidos do catálogo.
* **Caixa de Correio Integrada**:
  * Registo e controlo de todas as mensagens enviadas pelos clientes no site.
  * Links diretos para a viatura que originou o contacto.
  * Sistema de estados (Marcações automáticas como **Novo**, **Lido** ou **Arquivado**).
  * Botão de resposta automática que abre o email do cliente com o assunto já preenchido.

---

## 🔐 Dados de Acesso para Demonstração Local

Para apresentar o projeto ao cliente na sua máquina local:
* **Endereço do Site (Público)**: [http://localhost:3000](http://localhost:3000)
* **Endereço do Painel do Vendedor**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
* **Credenciais de Acesso**:
  * **Utilizador**: `admin`
  * **Palavra-passe**: `sacramento2026`

---

## 🧪 Roteiro Sugerido de Demonstração (Passo a Passo)

Sugerimos que faça esta demonstração simples ao proprietário do stand:

1. **Mostrar o Catálogo**:
   * Abra o site [http://localhost:3000](http://localhost:3000) e mostre o logótipo oficial do stand no cabeçalho e os dois carros de demonstração (*Ford Fiesta* e *Renault Megane*) já com fotos reais do stand.
   * Filtre por Combustível: selecione **Diesel** e clique em **Filtrar Stock**.
2. **Consultar uma Viatura**:
   * Clique na foto do **Ford Fiesta**. Mostre a galeria a rodar as imagens, a tabela de cilindrada/potência e a mensagem pré-definida do WhatsApp.
3. **Enviar Mensagem de Teste**:
   * Preencha o formulário de contacto no detalhe do carro e envie.
4. **Entrar no Painel e Validar**:
   * Abra o painel [http://localhost:3000/admin.html](http://localhost:3000/admin.html) com os dados de acesso acima.
   * Clique em **Mensagens** e mostre que o contacto do cliente entrou instantaneamente com o estado **Novo** associado ao carro correto. Mostre a mensagem completa.
5. **Adicionar Viatura Real**:
   * Clique em **Adicionar Viatura**, preencha os dados de um carro fictício, arraste uma foto e clique em guardar.
   * Volte ao site público, atualize a página e mostre que a viatura já aparece listada para venda automaticamente.

---

## 🚀 Próximos Passos: Hosting e Domínio

Se o proprietário do stand aprovar o projeto, o plano de implementação online consiste em:
1. **Código no GitHub**: Já temos um repositório git local inicializado e pronto para ser empurrado para a sua conta do GitHub.
2. **Alojamento no Render (Gratuito / Baixo Custo)**:
   * Cria-se uma conta gratuita no [Render.com](https://render.com).
   * Associa-se o repositório GitHub para publicação automática (sempre que fizer alterações no código, o site atualiza-se sozinho online).
   * Configura-se um **Volume Persistente de Disco** no Render (de forma a que a base de dados SQLite e as fotos enviadas pelo stand não desapareçam quando o servidor reiniciar).
3. **Domínio Personalizado**:
   * Compra-se o domínio (ex: `sacramentoautomoveis.pt` ou similar) numa entidade registadora (ex: Amen, Dominios.pt, PTISP).
   * Aponta-se o domínio para o servidor do Render, ativando o certificado de segurança SSL gratuito (o cadeado verde `https://`).
