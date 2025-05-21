# Audio-X

Audio-X é um repositório base para um sistema de gravação, edição e organização de voice-overs a partir de scripts em Markdown. O projeto é focado em facilitar a produção de áudios para vídeos, podcasts e outros conteúdos, com interface moderna e recursos de controle de microfone, takes, sessões e exportação de arquivos.

## Estrutura do Projeto

- `script-voice-over/`: Aplicação principal, construída com React, TypeScript e Vite. Inclui interface para:
  - Criação de projetos de voice-over
  - Edição de scripts em Markdown
  - Gravação de sessões de áudio (com múltiplos takes)
  - Visualização de formas de onda (WaveSurfer.js)
  - Configuração avançada de microfone (volume, ganho, equalizador, pitch, monitoramento)
  - Exportação de áudios gravados

## Tecnologias Utilizadas

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) para build e desenvolvimento rápido
- [WaveSurfer.js](https://wavesurfer-js.org/) para visualização de áudio
- [TailwindCSS](https://tailwindcss.com/) para estilos utilitários
- ESLint para padronização de código

## Como rodar o projeto

1. Instale as dependências:

```bash
cd script-voice-over
npm install
```

2. Rode o ambiente de desenvolvimento:

```bash
npm run dev
```

3. Acesse a aplicação em [http://localhost:5173](http://localhost:5173) (ou porta indicada no terminal).

## Scripts disponíveis

- `npm run dev` — inicia o ambiente de desenvolvimento
- `npm run build` — gera a build de produção
- `npm run preview` — serve a build de produção localmente
- `npm run lint` — executa o linter

## Estrutura de pastas relevante

- `src/` — código-fonte principal da aplicação
- `public/` — arquivos estáticos
- `App.tsx` — componente principal da aplicação

## Dependências principais

- `react`, `react-dom`, `wavesurfer.js`, `tailwindcss`, `vite`, `eslint`

## Observações

- O projeto está em desenvolvimento e pode receber novas funcionalidades.
- Para dúvidas ou sugestões, abra uma issue ou envie um pull request.

---

Desenvolvido por Luna Labs.
