import type { Brand, Production } from './types';
export function safeAsset(path: unknown): boolean;
export function validateBrand(brand: Brand): void;
export function validateProduction(production: unknown, options?: { final?: boolean; cover?: boolean }): Production;
export function productionAssets(production: Production): string[];
export function compositionFrames(production: Production, brand: Brand): number;
