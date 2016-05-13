#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
uniform float u_time;

void main() {
  vUv = uv;
  vec3 newPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  //newPosition.z += 1.0 + sin(u_time * 10.0 * vUv.x);
  //gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition,1.0);
}
