#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
uniform float u_time;
varying vec3 vColor;

void main() {
  vUv = uv;
  //gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);        
}
