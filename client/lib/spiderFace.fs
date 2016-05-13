#ifdef GL_ES
precision mediump float;
#endif

//uniform sampler2D texture1;
//uniform sampler2D texture2;
uniform sampler2D videoTexture;
varying vec2 vUv;
uniform vec2 u_mouse;
uniform vec2 u_center;
uniform vec2 u_p_1;
uniform vec2 u_p_2;
uniform vec2 u_p_3;
uniform vec2 u_p_4;
uniform float u_track;
uniform float u_time;

float circle(in vec2 _st, in float _radius, in vec2 center){
  //vec2 l = _st - vec2(0.5);
  vec2 l = _st - center;
  return 1.0 - smoothstep(_radius - (_radius * 0.01),
                          _radius + (_radius * 0.01),
                          dot(l, l) * 4.0);
}


void main(){

  float t1Factor = abs(sin(u_time * 3.0) * 3.0);
  float t2Factor = abs(cos(u_time * 4.0) * 3.0);
  //float vtFactor = abs(sin(u_time * 20.0) * 3.0);
  float vtFactor = 1.0;
  
  //gl_FragColor =  texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y)) * vtFactor;
  vec4 color = texture2D(videoTexture, vec2(1.0 - vUv.x, vUv.y)) * vtFactor;

  /*
  if(vUv.x > u_nose.x){
    color.r = 1.0;
  }
  */
  /*
  if(vUv.x > u_cheek_1.x || vUv.x < u_cheek_2.x){
    color.a = 0.2;
  }
  */
  if(u_track > 0.0){
    color.r += circle( vUv, 0.0001, u_p_1 );
    color.r += circle( vUv, 0.0001, u_p_2 );
    color.b += circle( vUv, 0.0001, u_p_3 );
    color.b += circle( vUv, 0.0001, u_p_4 );
    //color.g += circle( vUv, 0.0001, u_center );
  }
  /*
  color.a = 0.0;
  color.a += circle( vUv, 0.0001, u_nose );
  color.a += circle( vUv, 0.0001, u_cheek_1 );
  color.a += circle( vUv, 0.0001, u_cheek_2 );
  */

  gl_FragColor =  color;
}
