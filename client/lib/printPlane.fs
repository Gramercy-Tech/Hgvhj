#ifdef GL_ES
precision mediump float;
#endif

//uniform sampler2D texture1;
//uniform sampler2D texture2;
uniform sampler2D videoTexture;
varying vec2 vUv;
varying vec2 u_nose;

uniform float u_time;

float circle(in vec2 _st, in float _radius){
  vec2 l = _st - vec2(0.5);
  return 1.0 - smoothstep(_radius - (_radius * 0.01),
                          _radius + (_radius * 0.01),
                          dot(l, l) * 4.0);
}


void main(){

  float t1Factor = abs(sin(u_time * 3.0) * 3.0);
  float t2Factor = abs(cos(u_time * 4.0) * 3.0);
  //float vtFactor = abs(sin(u_time * 20.0) * 3.0);
  float vtFactor = 1.0;
  /*
  gl_FragColor = (texture2D(texture1, vUv) * t1Factor +
                  texture2D(texture2, vUv) * t2Factor +
                  //Need to flip the x coordinates coming in from the camera
                  texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y)) ) * vtFactor/
    (t1Factor + t2Factor + vtFactor);
  */

  
  //gl_FragColor =  texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y)) * vtFactor;
  vec4 color = texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y)) * vtFactor;
  gl_FragColor =  color;
}
