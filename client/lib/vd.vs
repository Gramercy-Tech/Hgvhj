#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 vUv;
varying float noise;
uniform float u_time;
uniform vec2 u_mouse;

uniform sampler2D videoTexture;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
{
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                      -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  // First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

  // Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  // Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

  // Gradients: 41 points uniformly over a line, mapped onto a diamond.
  // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

  // Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

//float fbm(vec2 P, const int octaves, float lacunarity, float gain)
float fbm(vec2 P)
{
  float sum = 0.0;
  float amp = 1.0;
  vec2 pp = P;
  float lacunarity = 2.3;
  float gain = 0.4;

  for(float i = 0.0; i < 10.0; i+=1.0)
    {
      amp *= gain;
      sum += amp * snoise(pp);
      pp *= lacunarity;
    }
  return sum;
}

float pattern( in vec2 p, vec2 q, out vec2 r, in float u_time)
{
  q.x = fbm( p + vec2( 0.0,0.0 + u_time) );
  q.y = fbm( p + vec2(5.2, 1.3) );
  r.x = fbm( p + 4.0*q + vec2(1.7,9.2) );
  r.y = fbm( p + 4.0*q + vec2(8.3,2.8) );
  return fbm( p + 4.0*r);
}


void main(){
  vUv = uv;
  vec3 newPosition = position;
  //newPosition.z += 50.0 * pattern(p, vUv, r, sin(u_time / 20.0) );
  newPosition.z += 1000.0 * sin(vUv.x * 2.0 * PI + u_time * 2.0);
  //newPosition.z += sin(vUv.x * 2.0 * PI) * 200.0;
  vec4 vtc = texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y));
  newPosition.z += (vtc.r + vtc.g + vtc.b) * 400.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition,1.0);        
}
