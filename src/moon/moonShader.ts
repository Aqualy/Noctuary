// The living Moon. SkSL for @shopify/react-native-skia; preview.html runs the same code through WebGL.
// MOON_CORE has no main(); moonPixelShader.ts adds its own.
export const MOON_CORE = `
uniform shader packMap;    // R height, G occlusion, B albedo
uniform shader normalMap;  // object-space normal
uniform float2 uRes;       // canvas size, px
uniform float2 uAtlas;     // texture size, px
uniform float uRadius;     // Moon radius as a fraction of half the shortest side
uniform float3 uSun;       // direction to the Sun, view space: x right, y up, z to viewer
uniform float3 uTurn;      // yaw, pitch, roll in radians
uniform float uOpen;       // eyelids 0..1
uniform float uJaw;        // 0..1
uniform float uSmile;      // -1 frown .. 1 smile
uniform float uBrow;       // -1 stern .. 1 raised
uniform float2 uGaze;      // -1..1
uniform float uGlow;       // iris glow 0..1
uniform float uShine;      // earthshine 0..1
uniform float uDither;     // 0..1
uniform float uCell;       // dither cell, px
uniform float uShadows;    // 1 = cast shadows, 0 = fast

const float MAXT = 1.7453293;
const float EX = 0.376;
const float EW = 0.26;

float2 atlas(float3 d) {
  float back = d.z < 0.0 ? 1.0 : 0.0;
  float side = 1.0 - 2.0 * back;
  float2 p = float2(d.x * side, d.y);
  float l = max(length(p), 0.00001);
  float2 u = p / l * (atan(l, abs(d.z)) / MAXT);
  return float2(((u.x + 1.0) * 0.5 + back) * 0.5, (1.0 - u.y) * 0.5) * uAtlas;
}
float heightAt(float3 d) {
  float2 a = atlas(d);
  return packMap.eval(a).r * 0.40 - 0.12;
}

float lashY(float t) { return 0.229 + 0.024 * smoothstep(0.0, 0.75, abs(t)); }
float creaseY(float t) {
  float a = min(abs(t), 1.0);
  return max(0.252 + 0.133 * (1.0 - pow(a, t > 0.0 ? 1.5 : 2.6)), lashY(t) + 0.001);
}
float edgeY(float t) { return mix(lashY(t), creaseY(t), 0.74 * uOpen); }
float mouthY(float t) { return -0.362 - 0.008 * smoothstep(0.0, 0.6, abs(t)); }
float bump(float x) { return exp(-x * x); }

// Where on the neutral face to look for face position p. z: 0 stone, 1 mouth, 2 eye.
float3 warp(float2 p) {
  float2 q = p;
  float ax = abs(p.x);
  float bx = smoothstep(0.02, 0.2, ax) * (1.0 - smoothstep(0.5, 0.75, ax));
  float inner = 1.0 - smoothstep(0.1, 0.45, ax);
  float by = bump((p.y - 0.49) / 0.085);
  q.y -= (uBrow > 0.0 ? uBrow * 0.045 : uBrow * 0.04 * inner) * by * bx;

  float mt = q.x / 0.27;
  float mw = bump((q.y + 0.37) / 0.13);
  float mc = min(mt * mt, 1.0) * (1.0 - smoothstep(1.0, 1.75, abs(mt)));
  q.y -= uSmile * 0.055 * mc * mw;
  q.x -= uSmile * 0.018 * sign(q.x) * mc * mw;

  mt = q.x / 0.27;
  float gap = uJaw * 0.10 * max(0.0, 1.0 - mt * mt);
  float up = gap * 0.18;
  float ml = mouthY(mt);
  if (q.y > -0.8 && q.y < -0.2 && gap > 0.0015) {
    if (q.y < ml + up && q.y > ml - gap) { return float3(q, 1.0); }
    if (q.y >= ml + up) {
      q.y -= up * (1.0 - smoothstep(0.0, 0.06, q.y - ml - up));
    } else {
      float a = ml - gap - q.y;
      q.y = ml - a - gap * smoothstep(0.02, 0.26, a);
    }
  }

  float t = (ax - EX) / EW;
  if (abs(t) < 1.0 && uOpen > 0.01) {
    float lo = lashY(t);
    float hi = creaseY(t);
    float ed = edgeY(t);
    if (q.y > lo && q.y < ed) { return float3(q, 2.0); }
    if (q.y >= ed && q.y < hi) { q.y = lo + (q.y - ed) / (hi - ed) * (hi - lo); }
  }
  return float3(q, 0.0);
}

float bayer2(float2 c) {
  float2 a = floor(c);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
float bayer4(float2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

struct Hit { float3 d; float3 m; float3 f; float3 N; float3 V; float3 emit; float alb; float ao; float open; };

void basis(out float3 r0, out float3 r1, out float3 r2) {
  float cy = cos(uTurn.x); float sy = sin(uTurn.x);
  float cp = cos(uTurn.y); float sp = sin(uTurn.y);
  float cr = cos(uTurn.z); float sr = sin(uTurn.z);
  // rows of the view-from-object rotation (roll * pitch * yaw)
  float3 a0 = float3(cy, 0.0, sy);
  float3 a1 = float3(sp * sy, cp, -sp * cy);
  r2 = float3(-cp * sy, sp, cp * cy);
  r0 = cr * a0 - sr * a1;
  r1 = sr * a0 + cr * a1;
}

// What the viewer sees at disc position s (length(s) < 1).
Hit surface(float2 s, float3 r0, float3 r1, float3 r2) {
  float r = length(s);
  float3 brass = float3(0.647, 0.545, 0.310);
  // relief: move the hit point to the raised surface
  float3 v = float3(s, sqrt(max(1.0 - r * r, 0.0)));
  float3 d = r0 * v.x + r1 * v.y + r2 * v.z;
  for (int i = 0; i < 3; i++) {
    float hh = 1.0 + heightAt(d);
    float3 w = float3(s, sqrt(max(hh * hh - r * r, 0.0)));
    w = normalize(mix(w, v, smoothstep(0.80, 0.97, r)));
    d = r0 * w.x + r1 * w.y + r2 * w.z;
  }
  d = normalize(d);

  float3 f = float3(d.xy, 0.0);
  float3 m = d;
  if (d.z > 0.2) {
    f = warp(d.xy);
    float fade = 1.0 - smoothstep(0.8, 0.95, length(d.xy));
    float2 q = mix(d.xy, f.xy, fade);
    m = float3(q, sqrt(max(1.0 - dot(q, q), 0.0)));
  }
  float2 at = atlas(m);
  float3 pk = float3(packMap.eval(at).rgb);
  float3 n = normalize(float3(normalMap.eval(at).rgb) * 2.0 - 1.0);
  float ao = pk.g;
  float alb = pk.b;
  float3 emit = float3(0.0);
  float open = 1.0;

  if (f.z > 1.5) {                         // carved eyeball
    float t = (abs(d.x) - EX) / EW;
    float2 c = float2(sign(d.x) * (EX - 0.01), 0.295) + uGaze * float2(0.05, 0.018);
    float2 e = d.xy - c;
    float re = length(e);
    float2 ball = d.xy - float2(sign(d.x) * EX, 0.30);
    n = normalize(float3(ball * 2.6, 1.0));
    float ring = 1.0 - smoothstep(0.004, 0.011, abs(re - 0.062));
    float pupil = 1.0 - smoothstep(0.022, 0.030, re);
    float iris = 1.0 - smoothstep(0.056, 0.064, re);
    float spoke = 0.5 + 0.5 * sin(atan(e.y, e.x) * 26.0);
    n = normalize(n + float3(e / max(re, 0.001), 0.0) * ring * 0.9);
    alb = 0.74 - 0.34 * ring - 0.12 * iris * (0.4 + 0.6 * spoke) - 0.6 * pupil;
    ao = smoothstep(-0.015, 0.055, edgeY(t) - d.y) * smoothstep(-0.01, 0.02, d.y - lashY(t));
    ao = 0.25 + 0.75 * ao;
    ao *= smoothstep(0.0, 0.16, 1.0 - abs(t)) * 0.6 + 0.4;
    emit = brass * 1.5 * uGlow * iris * (1.0 - pupil) * (0.45 + 0.55 * spoke) * ao;
  } else if (f.z > 0.5) {                  // mouth hollow
    float mt = f.x / 0.27;
    float g = max(uJaw * 0.10 * max(0.0, 1.0 - mt * mt), 0.001);
    float k = clamp((f.y - (mouthY(mt) - g)) / (g * 1.18), 0.0, 1.0);
    n = normalize(float3(0.0, 0.8, 0.6));
    alb = 0.30;
    ao = 0.10 + 0.35 * pow(1.0 - k, 3.0);
    open = 0.35;
  }

  float3 N = float3(dot(r0, n), dot(r1, n), dot(r2, n));
  float3 V = float3(dot(r0, d), dot(r1, d), dot(r2, d));
  return Hit(d, m, f, N, V, emit, alb, ao, open);
}

// soft: width of the limb fade, px
half4 moonColor(float2 xy, float soft) {
  float unit = 0.5 * min(uRes.x, uRes.y) * uRadius;
  float2 s = (xy - 0.5 * uRes) / unit;
  s.y = -s.y;
  float r = length(s);
  float by = bayer4(xy / uCell);
  float3 ink = float3(0.055, 0.071, 0.051);
  float3 moss = float3(0.173, 0.227, 0.141);
  float3 bone = float3(0.957, 0.933, 0.867);

  // halo, brighter on the sunlit side
  float side = dot(s / max(r, 0.001), uSun.xy) * 0.5 + 0.5;
  float lit = 0.5 + 0.5 * uSun.z;
  float halo = exp(-max(r - 1.0, 0.0) * 4.2) * (0.20 + 0.75 * side * lit);
  float hd = mix(halo, step(by + 0.04, halo) * 0.8, uDither);
  float3 col = mix(ink, moss * 1.25, clamp(hd, 0.0, 1.0));
  float cover = 1.0 - smoothstep(1.0 - soft / unit, 1.0, r);
  if (cover <= 0.0) { return half4(half3(col), 1.0); }

  float3 r0; float3 r1; float3 r2;
  basis(r0, r1, r2);
  Hit hit = surface(s, r0, r1, r2);
  float3 d = hit.d;
  float3 m = hit.m;
  float3 N = hit.N;
  float3 V = hit.V;
  float ao = hit.ao;
  float ndl = dot(N, uSun);
  float macro = smoothstep(-0.10, 0.16, dot(V, uSun));
  float sh = 1.0;
  if (uShadows > 0.5 && macro > 0.0 && ndl > 0.0) {
    float3 L = r0 * uSun.x + r1 * uSun.y + r2 * uSun.z;
    float3 P = d * (1.0 + max(heightAt(d), heightAt(m)) + 0.006);
    float k = 0.012;
    for (int i = 0; i < 14; i++) {
      float3 Q = P + L * k;
      float l = length(Q);
      if (l < 1.22) { sh = min(sh, 1.0 + (l - 1.0 - heightAt(Q / l)) * 0.9 / k * 6.0); }
      k *= 1.26;
    }
    sh = clamp(sh, 0.0, 1.0);
  }
  float light = pow(max(ndl, 0.0), 0.8) * macro * sh * hit.open;
  float3 stone = bone * (0.35 + 0.95 * hit.alb);
  float lum = light * (0.45 + 0.55 * ao);
  float amb = (uShine * 0.34 * (0.35 + 0.65 * max(dot(N, float3(0.25, 0.45, 0.86)), 0.0)) + 0.02) * (0.3 + 0.7 * ao);

  // dither only where the light runs out
  float dark = 1.0 - smoothstep(0.10, 0.42, lum);
  float tone = lum + amb;
  float dit = step(by * 0.40 + 0.03, tone * 1.15) * 0.36;
  tone = mix(tone, mix(tone * 0.8, dit, 0.5), dark * uDither);
  float3 tint = mix(moss * 1.5, bone, smoothstep(0.02, 0.45, tone));
  float3 moon = stone * tint * tone * 1.12 + ink * 0.55 + hit.emit;
  moon *= mix(0.80, 1.0, smoothstep(0.0, 0.35, V.z));
  col = mix(col, moon, cover);
  return half4(half3(clamp(col, 0.0, 1.0)), 1.0);
}
`;

export const MOON_SKSL = MOON_CORE + `
half4 main(float2 xy) { return moonColor(xy, 1.5); }
`;
