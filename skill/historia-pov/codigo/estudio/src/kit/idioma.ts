// IDIOMA DO VÍDEO. A mesma cena serve para os dois idiomas: placas, celular, avisos e cartão trocam sozinhos.
// O componente chama definirIdioma() no começo do render, ANTES de montar a cena 3D; os textos usam T(pt, es).
// Sem chamar nada, tudo fica no idioma principal. Procure também textos escritos direto no código
// (interjeições como "AIII!" na legenda), não só no roteiro.
export type Idioma = "pt" | "es" | "en";
let atual: Idioma = "pt";
export const definirIdioma = (i: Idioma | undefined) => { atual = i ?? "pt"; };
export const idioma = (): Idioma => atual;
/** T("texto em português", "texto en español", "english text") */
export const T = (pt: string, es: string, en?: string) => (atual === "es" ? es : atual === "en" ? en ?? es : pt);
