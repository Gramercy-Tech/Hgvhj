
//#ifdef GL_ES
//precision mediump float;
//#endif

uniform vec2 u_resolution;
uniform float u_time;

varying vec2 vUv;



vec2 brick_tile( vec2 _st, float _zoom, float offset ){
  _st *= _zoom;

  // Offset happens here
  //step(x, y) returns 1.0 if y>x
  _st.x += step(1.0, mod(_st.y, 2.0) ) * offset;
  _st.x += step(1.0, mod(_st.y, 2.0) ) < 1.0 ? -1.0 * offset : 0.0;
  return fract(_st);
}

vec2 moving_tiles( vec2 _st, float _zoom, float _speed ){
  _st *= _zoom;

  float time = u_time * _speed;

  if (fract(time) > 0.5){
    if (fract( _st.y * 0.5) > 0.5){
      _st.x += fract(time)*2.0;
    }else{
      _st.x -= fract(time)*2.0;
    }
  }else{
    if (fract( _st.x * 0.5) > 0.5){
      _st.y += fract(time)*2.0;
    }else {
      _st.y -= fract(time)*2.0;
    }
  }
  return fract(_st);
}

float box2(vec2 _st, vec2 _size){
  _size = vec2(0.5)-_size*0.5;
  vec2 uv = smoothstep(_size,_size+vec2(1e-4),_st);
  uv *= smoothstep(_size,_size+vec2(1e-4),vec2(1.0)-_st);
  return uv.x*uv.y;
}

float box(in vec2 _st, in vec2 _size){
  _size = vec2(0.5) - _size * 0.5;
  vec2 uv = smoothstep( _size, _size + vec2(1e-4), _st);
  uv *= smoothstep(_size, _size + vec2(1e-4), vec2(1.0) - _st);
  return uv.x*uv.y;
}

void main(void){
  vec3 color = vec3(0.0);

  vec2 new_vUv = vUv;

  float offset = u_time;
  new_vUv = moving_tiles( new_vUv, 10.0, 0.5 );

  //color = vec3(box2(new_vUv, vec2( 0.9 ) ));
  color = vec3(new_vUv, 0.9);
  gl_FragColor = vec4( color, 1.0 );
}
