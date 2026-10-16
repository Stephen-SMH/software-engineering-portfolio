/// <reference path="../.astro/types.d.ts" />

interface Window {
  goatcounter?: {
    count: (options: { path: string }) => void;
  };
}
