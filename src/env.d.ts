/** Versão do package.json, injetada pelo Vite no build. */
declare const __APP_VERSION__: string;
/** Commit do build (7 caracteres). Fora do GitHub Actions vale "dev". */
declare const __APP_BUILD__: string;

interface ImportMetaEnv {
  /** Endereço do Worker de IA. Vazio: o recurso fica desligado. Definido no deploy pela variável AI_URL do repositório. */
  readonly VITE_AI_URL?: string;
}
