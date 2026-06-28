# ATSReady

> Seu currículo pronto para passar por qualquer ATS.

Landing page single-page para análise de currículos contra métricas de **ATS (Applicant Tracking System)**. O usuário envia o PDF do currículo, cola a descrição da vaga e recebe um score com pontos fortes e sugestões de melhoria.

## Stack

- HTML5 semântico
- CSS puro (design system glassmorphism, sem frameworks)
- JavaScript vanilla (sem frameworks)
- [Lucide Icons](https://lucide.dev/) e Google Fonts (Inter) via CDN

## Estrutura

| Arquivo | Descrição |
| --- | --- |
| `index.html` | Estrutura e seções da página |
| `styles.css` | Design system glassmorphism e responsividade |
| `script.js` | Interações, upload drag & drop e integração com a API |

## Funcionalidades

- Navbar fixa com efeito de scroll e menu hamburger mobile
- Hero com mockup estático de resultado (score circular + barras)
- Seções: Como funciona, Métricas, Faixas de score e formulário de análise
- Upload de PDF por drag & drop com validação de tipo
- Animações de entrada por scroll (IntersectionObserver)
- Resultado dinâmico com score animado, barras de progresso e sugestões

## API

O formulário envia um `POST` (multipart/form-data) para:

```
http://localhost:8080/api/analise
```

Campos enviados:

- `curriculo` — arquivo PDF
- `descricaoVaga` — texto da vaga

A resposta esperada é um JSON com o score geral, categorias (Palavras-Chave, Cronologia, Impacto, Formatação) e sugestões. O parser é tolerante a diferentes nomes de campos.

## Como rodar

Abra o `index.html` em um navegador ou sirva a pasta com qualquer servidor estático:

```bash
npx serve .
```

Para a análise funcionar, o backend deve estar rodando em `localhost:8080`.

## Autor

Feito por **Eduardo Ciudad** — [GitHub](https://github.com/eduardo-Ciudad)
