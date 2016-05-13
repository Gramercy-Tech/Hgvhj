#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
uniform vec2 u_mouse;
uniform vec2 u_nose;
uniform float u_time;
uniform sampler2D videoTexture;

void main() {
  vUv = uv;
  //gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  vec3 newPosition = position;
  vec4 vtc = texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y));
  //newPosition.z += (vtc.r + vtc.g + vtc.b) * 400.0;
  //newPosition.x += 100.0 * cos(vUv.x * 2.0 * PI + u_time * 2.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition,1.0);        
}
