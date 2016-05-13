#ifdef GL_ES
precision mediump float;
#endif

//uniform sampler2D texture1;
//uniform sampler2D texture2;
varying vec2 vUv;
varying vec3 vColor;
uniform float u_time;

void main(){

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
  //vec3 color = vec3(0.0);

  /*
  if(vUv.x > u_nose.x){
    color.r = 1.0;
  }
  */
  //color.b = 1.0;
  gl_FragColor =  vec4(1.0, 0.0, 0.0, 1.0);
}
