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

float delta;
float alpha;
vec4 c;
vec4 c2;

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
      delta = 0.01;
      alpha = smoothstep( 0.48 - delta, 0.48 + delta, dist);
      c2 = vec4(0.6 * blendShade, 0.6 * blendShade, 0.6 * blendShade, 1.0);
      c = vec4( itc.r * blendShade,
                itc.g * blendShade,
                itc.b * blendShade,
                1.0 );    
      gl_FragColor = mix(c, c2, alpha);
      /*
        gl_FragColor = vec4( itc.r * blendShade,
        itc.g * blendShade,
        itc.b * blendShade,
        1.0 );    
      */
    }else if(isFiltered < 1.0 && dist < 0.5){
      delta = 0.01;
      alpha = smoothstep( 0.5 - delta, 0.5 + delta, dist);
      c = vec4( 0.6, 0.6, 0.6, 1.0 );
      c2 = vec4(0.0,0.0,0.0,1.0);
      gl_FragColor = mix(c, c2, alpha);
    }else if(dist < 0.45){
      //gl_FragColor = vec4( u_inner_color * blendShade, 1.0 );            
      delta = 0.01;
      alpha = smoothstep( 0.45 - delta, 0.45 + delta, dist);
      c = vec4(u_inner_color * blendShade, 1.0);
      //c2 = vec4(0.0,0.0,0.0,1.0);
      c2 = vec4(u_outer_color * blendShade, 1.0);
      gl_FragColor = mix(c, c2, alpha);

    }else if(dist < 0.5){
      delta = 0.01;
      alpha = smoothstep( 0.5 - delta, 0.5 + delta, dist);
      c = vec4(u_outer_color * blendShade, 1.0);
      c2 = vec4(0.0,0.0,0.0,1.0);
      gl_FragColor = mix(c, c2, alpha);
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
      if( isFiltered < 1.0){
        gl_FragColor = vec4( itc.rgb, 1.0 );
      }else{
        delta = 0.01;
        alpha = smoothstep( 0.4 - delta, 0.4 + delta, dist);
        c2 = vec4(u_inner_color * blendShade, 1.0);
        c = vec4( itc.rgb, 1.0 );
        gl_FragColor = mix(c, c2, alpha);
      }
    }

  }
}
