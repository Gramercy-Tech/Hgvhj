#ifdef GL_ES
precision mediump float;
#endif


varying vec2 vUv;
uniform sampler2D imageTexture;
uniform vec3 u_inner_color;
uniform vec3 u_outer_color;
uniform float u_time;
uniform float yOffset;
uniform float frameSize;
uniform float blendShade;
uniform float isFiltered;

void main(){
  float dist = distance(vUv, vec2(0.5,0.5));
  float x = vUv.x;
  float y = yOffset + vUv.y * frameSize;
  vec4 itc = texture2D(imageTexture, vec2(x, y));

  if(dist > 0.40){

    if(
       (isFiltered < 1.0 && dist < 0.48) ||
       (blendShade < 1.0 && dist < 0.48)
       ){
      //If there's no filtering going on
      //or it's a filtered element that's been filtered out
      gl_FragColor = vec4( itc.r * blendShade,
                           itc.g * blendShade,
                           itc.b * blendShade,
                           1.0 );    
    }else if(isFiltered < 1.0 && dist < 0.5){
      gl_FragColor = vec4( 0.6, 0.6, 0.6, 1.0 );
    }else if(dist < 0.45){
      gl_FragColor = vec4( u_inner_color * blendShade, 1.0 );            
    }else if(dist < 0.5){
      gl_FragColor = vec4( u_outer_color * blendShade, 1.0 );      
    }else{
      gl_FragColor = vec4( vec3(0.0), 0.0 );
    }
  }else{
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
