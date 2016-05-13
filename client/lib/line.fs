#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;

void main(){
  if(vUv.y >= 0.5){
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }else{
    gl_FragColor = vec4(0.0);
  }
}
