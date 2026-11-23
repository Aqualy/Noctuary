// The Moon printed on paper: two inks, ordered dither, ink contours. Drawn at low resolution
// (one fragment = one printed dot) and enlarged with nearest neighbour. Final colours only: phones may
// convert the buffer's colours, so nothing is ever read back from it as data.
import { MOON_CORE } from './moonShader';

export const PRINT_PASS = `
uniform float uContrast;  // above 1: darker mid tones
uniform float uLines;     // strength of the contours, 0..1

float bayer8(float2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// xyz normal, w distance to the viewer
float4 relief(float2 xy, float3 r0, float3 r1, float3 r2) {
  float unit = 0.5 * min(uRes.x, uRes.y) * uRadius;
  float2 s = (xy - 0.5 * uRes) / unit;
  s.y = -s.y;
  if (dot(s, s) >= 1.0) { return float4(0.0, 0.0, 0.0, -9.0); }
  Hit h = surface(s, r0, r1, r2);
  return float4(h.N, h.V.z * (1.0 + heightAt(h.m)));
}

half4 main(float2 xy) {
  float3 paper = float3(0.925, 0.894, 0.808);
  float3 ink = float3(0.149, 0.141, 0.118);
  float unit = 0.5 * min(uRes.x, uRes.y) * uRadius;
  float2 s = (xy - 0.5 * uRes) / unit;
  float r = length(s);
  if (r >= 1.0) { return half4(half3(paper), 1.0); }

  float l = dot(float3(moonColor(xy, 0.02).rgb), float3(0.299, 0.587, 0.114));
  float t = clamp((l - 0.07) / 0.80, 0.0, 1.0);
  t = pow(t, uContrast);
  t *= mix(0.62, 1.0, smoothstep(0.0, 0.55, sqrt(1.0 - r * r))); // darker towards the rim

  // contours: where the stone turns or drops, but not at the rim of the sphere
  float3 r0; float3 r1; float3 r2;
  basis(r0, r1, r2);
  float4 here = relief(xy, r0, r1, r2);
  float4 right = relief(xy + float2(1.0, 0.0), r0, r1, r2);
  float4 down = relief(xy + float2(0.0, 1.0), r0, r1, r2);
  float inside = 1.0 - smoothstep(0.84, 0.95, r);
  float turnN = max(1.0 - dot(here.xyz, right.xyz), 1.0 - dot(here.xyz, down.xyz));
  float drop = max(abs(here.w - right.w), abs(here.w - down.w));
  float line = max(smoothstep(0.10, 0.30, turnN), smoothstep(0.022, 0.045, drop)) * inside * uLines;
  // dark lines in the light, light lines in the dark
  t = mix(t, t > 0.22 ? t * 0.15 : t + 0.55, line);

  float dot_ = step(bayer8(xy) * 0.97 + 0.015, t);
  return half4(half3(mix(ink, paper, dot_)), 1.0);
}
`;

export const MOON_PRINT_SKSL = MOON_CORE + PRINT_PASS;
