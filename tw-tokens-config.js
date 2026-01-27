import { makeSdTailwindConfig } from 'sd-tailwindcss-transformer';
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary(
  makeSdTailwindConfig({
    type: 'all',
    source: ['./tokens.json'], 
    buildPath: '', // 반환될 위치
  }),
);

await sd.hasInitialized;
await sd.buildAllPlatforms();