// Render quality switch. The GitHub Actions "preview" mode passes --props '{"preview":true}'.
// Preview: shadow map 1024, MSAA off (the workflow also caps the render to the first 10 s).
import { getInputProps } from "remotion";

export const isPreview = (): boolean => Boolean((getInputProps() as { preview?: boolean }).preview);

export const quality = (full: { shadowMap: number; msaa: number } = { shadowMap: 2048, msaa: 4 }) =>
  isPreview() ? { shadowMap: 1024, msaa: 0 } : full;
