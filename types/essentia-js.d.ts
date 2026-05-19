declare module "essentia.js" {
  export const Essentia: unknown;
  export const EssentiaWASM: unknown;
  export const EssentiaModel: unknown;
  export const EssentiaExtractor: unknown;
  export const EssentiaPlot: unknown;
}

declare module "essentia.js/dist/essentia.js-core.es.js" {
  const Essentia: unknown;
  export default Essentia;
}

declare module "essentia.js/dist/essentia-wasm.es.js" {
  export const EssentiaWASM: unknown;
}
