#ifdef GL_ES
precision mediump float;
#endif


varying vec2 vUv;
uniform sampler2D imageTexture;
uniform vec3 u_color;
uniform float yOffset;
uniform float frameSize;
uniform float blendShade;


void main(){
  float distance = distance(vUv, vec2(0.5,0.5));

  if(distance > 0.48){
    if(distance < 0.5){
      gl_FragColor = vec4( u_color * blendShade, 1.0 );      
    }else{
      gl_FragColor = vec4( vec3(0.0), 0.0 );
    }
  }else{
    float x = vUv.x;
    float y = yOffset + vUv.y * frameSize;
    vec4 itc = texture2D(imageTexture, vec2(x, y));
    if( blendShade < 1.0 ){
      gl_FragColor = vec4( itc.r * blendShade,
                           itc.g * blendShade,
                           itc.b * blendShade,
                           1.0 );    
    }else{
      gl_FragColor = vec4( itc.rgb, 1.0 );
    }

  }
}
