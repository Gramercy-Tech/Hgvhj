#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
uniform vec2 u_mouse;
uniform vec2 u_nose;
uniform vec2 u_cheek_1;
uniform vec2 u_cheek_2;
uniform float u_time;
uniform float u_track;
uniform sampler2D videoTexture;

void main() {
  vUv = uv;
  //gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);        
}
