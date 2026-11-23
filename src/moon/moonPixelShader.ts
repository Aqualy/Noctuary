// Pixel version of the Moon. Draw it at low resolution (one fragment = one art pixel) and upscale with nearest.
// Edge functions ported from RenderPixelatedPass.js by KodyJKing (MIT, (c) three.js authors):
// https://github.com/KodyJKing/three.js/blob/outlined-pixel-example/examples/jsm/postprocessing/RenderPixelatedPass.js
// The pass reads normals and depth from render targets; here they come from the Moon's own surface(),
// so eyelids, lips and brows get outlines too.
import { MOON_CORE } from './moonShader';

export const PIXEL_PASS = `
uniform float uNormalEdge; // strength of the light inner lines, 0..1 (pass default 0.3)
uniform float uDepthEdge;  // strength of the dark outlines, 0..1 (pass default 0.4)

// xyz view-space normal, w depth 0..1
float4 geometry(float2 xy, float3 r0, float3 r1, float3 r2) {
  float unit = 0.5 * min(uRes.x, uRes.y) * uRadius;
  float2 s = (xy - 0.5 * uRes) / unit;
  s.y = -s.y;
  if (dot(s, s) >= 1.0) { return float4(-1.0, -1.0, -1.0, 1.0); } // cleared render targets
  Hit h = surface(s, r0, r1, r2);
  float lift = 1.0 + heightAt(h.m);
  if (h.f.z > 1.5) { return float4(h.V, 0.5 - h.V.z * (lift - 0.02) * 0.2); } // smooth eyeball: no lines on the iris
  if (h.f.z > 0.5) { lift -= 0.16; } // mouth is hollow
  // camera range as in the three.js example, where the model is about 2 of 9.9 units deep
  return float4(h.N, 0.5 - h.V.z * lift * 0.2);
}

float depthEdgeIndicator(float depth, float e, float w, float s, float n) {
  float diff = 0.0;
  diff += clamp(e - depth, 0.0, 1.0);
  diff += clamp(w - depth, 0.0, 1.0);
  diff += clamp(s - depth, 0.0, 1.0);
  diff += clamp(n - depth, 0.0, 1.0);
  return floor(smoothstep(0.01, 0.02, diff) * 2.0) / 2.0;
}

float neighborNormalEdgeIndicator(float4 other, float4 here) {
  float depthDiff = other.w - here.w;
  // Edge pixels should yield to faces whose normals are closer to the bias normal.
  float normalDiff = dot(here.xyz - other.xyz, float3(1.0));
  float normalIndicator = clamp(smoothstep(-0.01, 0.01, normalDiff), 0.0, 1.0);
  // Only the shallower pixel should detect the normal edge.
  float depthIndicator = clamp(sign(depthDiff * 0.25 + 0.0025), 0.0, 1.0);
  return (1.0 - dot(here.xyz, other.xyz)) * depthIndicator * normalIndicator;
}

half4 main(float2 xy) {
  half4 texel = moonColor(xy, 0.02);
  float unit = 0.5 * min(uRes.x, uRes.y) * uRadius;
  if (length(xy - 0.5 * uRes) >= unit) { return texel; } // sky never holds an edge
  float3 r0; float3 r1; float3 r2;
  basis(r0, r1, r2);
  float4 here = geometry(xy, r0, r1, r2);
  float4 e = geometry(xy + float2(1.0, 0.0), r0, r1, r2);
  float4 w = geometry(xy - float2(1.0, 0.0), r0, r1, r2);
  float4 s = geometry(xy + float2(0.0, 1.0), r0, r1, r2);
  float4 n = geometry(xy - float2(0.0, 1.0), r0, r1, r2);
  // the sky is no edge: no dark ring around the Moon
  if (e.w > 0.999) { e = here; }
  if (w.w > 0.999) { w = here; }
  if (s.w > 0.999) { s = here; }
  if (n.w > 0.999) { n = here; }
  float rim = smoothstep(0.88, 0.95, length(xy - 0.5 * uRes) / unit); // a sphere's depth falls away at the rim, that is no edge either
  float dei = depthEdgeIndicator(here.w, e.w, w.w, s.w, n.w);
  float nei = 0.0;
  nei += neighborNormalEdgeIndicator(s, here);
  nei += neighborNormalEdgeIndicator(n, here);
  nei += neighborNormalEdgeIndicator(w, here);
  nei += neighborNormalEdgeIndicator(e, here);
  nei = step(0.1, nei);
  dei *= 1.0 - rim;
  float strength = dei > 0.0 ? 1.0 - uDepthEdge * dei : 1.0 + uNormalEdge * nei;
  return half4(half3(float3(texel.rgb) * strength), 1.0);
}
`;

export const MOON_PIXEL_SKSL = MOON_CORE + PIXEL_PASS;
