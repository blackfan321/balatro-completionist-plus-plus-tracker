// https://www.shadertoy.com/view/XXtBRr?__cf_chl_tk=k_oAV1i6NgDztzW1yzPaA4OStnJhizVNAQFjjDfDaC8-1768180832-1.0.1.1-rrJQm2oPkSP83_5PguI.nPTe.FIJJ6HXOa8p37uly1E
// Original by localthunk (https://www.playbalatro.com)

// Configuration (modify these values to change the effect)
#define SPIN_ROTATION -2.0
#define SPIN_SPEED 2.0
#define OFFSET vec2(0.0)
#define COLOUR_1 vec4(0.4078, 0.6729, 0.5608, 1.0)
#define COLOUR_2 vec4(0.2824, 0.4659, 0.3882, 1.0)
#define COLOUR_3 vec4(0.2196, 0.3624, 0.3020, 1.0)
#define CONTRAST 3.0
#define LIGTHING 0.0
#define SPIN_AMOUNT 0.0
#define PIXEL_FILTER 700.0
#define SPIN_EASE 0.5
#define PI 3.14159265359
#define IS_ROTATE false

vec4 effect(vec2 screenSize, vec2 screen_coords) {
  float pixel_size = length(screenSize.xy) / PIXEL_FILTER;
  vec2 uv = (floor(screen_coords.xy*(1./pixel_size))*pixel_size - 0.5*screenSize.xy)/length(screenSize.xy) - OFFSET;
  float uv_len = length(uv);

  float speed = (SPIN_ROTATION*SPIN_EASE*0.2);
  if(IS_ROTATE){
    speed = iTime * speed;
  }
  speed += 302.2;
  float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE*20.*(1.*SPIN_AMOUNT*uv_len + (1. - 1.*SPIN_AMOUNT));
  vec2 mid = (screenSize.xy/length(screenSize.xy))/2.;
  uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

  uv *= 30.;
  speed = iTime*(SPIN_SPEED);
  vec2 uv2 = vec2(uv.x+uv.y);

  for(int i=0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
    uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
  }

  float contrast_mod = (0.25*CONTRAST + 0.5*SPIN_AMOUNT + 1.2);
  float paint_res = min(2., max(0.,length(uv)*(0.035)*contrast_mod));
  float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
  float c2p = max(0.,1. - contrast_mod*abs(paint_res));
  float c3p = 1. - min(1., c1p + c2p);
  float light = (LIGTHING - 0.2)*max(c1p*5. - 4., 0.) + LIGTHING*max(c2p*5. - 4., 0.);
  return (0.3/CONTRAST)*COLOUR_1 + (1. - 0.3/CONTRAST)*(COLOUR_1*c1p + COLOUR_2*c2p + vec4(c3p*COLOUR_3.rgb, c3p*COLOUR_1.a)) + light;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord/iResolution.xy;

  fragColor = effect(iResolution.xy, uv * iResolution.xy);
}
