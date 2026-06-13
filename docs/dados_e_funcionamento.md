# Sacramento Automóveis — Ficha de Acesso e Guia de Funcionamento

Este documento reúne todas as informações sobre o funcionamento do novo website do stand **Sacramento Automóveis**, as credenciais de acesso administrativas e o plano de alojamento online.

---

## 🌟 Resumo do Projeto

Desenvolvemos um website premium sob medida para a **Sacramento Automóveis**. A plataforma permite que os clientes consultem o stock de viaturas em tempo real, filtrem por marca, preço, combustível ou caixa, vejam detalhes e fotos de cada carro e enviem mensagens diretas de interesse ou iniciem conversas no WhatsApp com dados automáticos do veículo.

O stand tem acesso a um **Painel de Controlo Privado** (Back-Office) para adicionar, editar ou eliminar viaturas e gerir as mensagens recebidas dos clientes.

---

## 🔐 Contas e Dados de Acesso

Criámos uma identidade de email centralizada para que todas as contas (alojamento, domínio, base de dados) fiquem em nome do stand, garantindo total propriedade e autonomia:

### 1. E-mail de Gestão (Outlook)
Este email é a chave mestre para gerir o domínio, o alojamento no Render e a base de dados online.
* **E-mail**: `automoveissacramento@outlook.pt`
* **Palavra-passe**: `Sacramento`
* **Data de Nascimento associada**: `22-08-2000`

### 2. Painel de Controlo de Domínio (Amen.pt)
Controlo de registo do domínio `automoveissacramento.pt` e apontamento DNS.
* **UserID**: `Automoveis`
* **Password**: `Sacramento`

### 3. Painel Administrativo do Stand (Gestão do Site)
Acesso ao Back-Office de gestão de veículos e mensagens.
* **Link Local (Demonstração)**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
* **Link Online (Após publicação)**: `https://www.automoveissacramento.pt/admin.html`
* **Utilizador**: `VitorSacramento`
* **Palavra-passe**: `sacramento.2026`

---

## 💰 Custos de Manutenção (Alojamento Gratuito)

O site foi estruturado para ter um custo de manutenção **praticamente nulo**:

1. **Alojamento do Site (Render)**: **100% Gratuito**. O site fica hospedado nos servidores do Render sem mensalidades. *(Nota: no plano gratuito, se o site não receber visitas durante 15 minutos, ele adormece, demorando cerca de 30 segundos a carregar no primeiro acesso do dia).*
2. **Base de Dados (Supabase/Neon)**: **100% Gratuita**. Todos os registos dos carros e mensagens ficam guardados numa base de dados na nuvem sem custos.
3. **Domínio (`automoveissacramento.pt`)**: Este é o **único custo** associado ao projeto. Trata-se do registo anual do nome do site (cerca de 10€ a 15€ por ano), pago diretamente à entidade registadora.

---

## 📖 Guia de Funcionamento Simples (Como usar o site)

### Como adicionar um carro ao catálogo?
1. Aceda ao Painel Administrativo e faça login com os dados de acesso acima.
2. Na aba **Gerir Stock**, clique em **Adicionar Viatura**.
3. Preencha a ficha do carro: Marca, Modelo, Preço, Ano, Quilómetros, Potência (cv) e Cilindrada (cc).
4. Selecione os extras nas caixas de seleção (ex: GPS, Estofos em Pele, etc.).
5. Introduza a descrição (detalhes de garantia, revisões, etc.).
6. **Fotos**: Arraste as fotos do computador ou telemóvel para a área pontilhada e clique em **Guardar Viatura**. O carro entra imediatamente em direto no site.

### Como gerir as mensagens dos clientes?
1. Sempre que um cliente preencher o formulário de contacto de um carro, a mensagem entra no painel.
2. Aceda à aba **Mensagens**. As mensagens novas terão uma etiqueta azul a dizer **Novo**.
3. Clique na mensagem para ver os contactos do cliente (Nome, Email, Telemóvel) e qual o carro em que ele está interessado.
4. Ao abrir a mensagem, o estado muda automaticamente para **Lido**. Podes clicar em **Responder por Email** ou clicar em **Arquivar** para organizar a caixa de entrada.

---

## 🚗 Viaturas Pré-Carregadas (Seed Inicial)

O site já arranca com o stock inicial configurado com fotos reais e dados oficiais do stand:
1. **Ford Fiesta 1.6 TDCi Titanium (2010)** — Branco, 90 cv, Diesel, Manual, 185.000 km, Ar Condicionado, Jantes Especiais. Preço: **12.500 €**.
2. **Renault Megane Break 1.5 dCi Dynamique (2011)** — Preto, 110 cv, Diesel, Manual, 215.000 km, GPS, Sensores, AC Automático, Cruise Control. Preço: **10.900 €**.
