#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * compShader   :   Mandelbrot Shader 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 06 Dec 2017 04:25:26 PM EST
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl

/*------------------------------------------------------------------------
 * Interface variables : 
 * varyings change to "in" types in fragment shaders 
 * and "out" in vertexShaders
 *------------------------------------------------------------------------
 */
in      vec2    pixPos ;
in      vec2    pixCrd ;

uniform float   escapeRadius ;
uniform int     noIterations ;
uniform float   x1, x2, y1, y2 ;

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
out vec4 outcolor ;


/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    float   iter = 0. ;
    float   mu = 0. ;
    vec2 c0 = pixCrd ;
    bool scaped = false ;
    vec2 z = c0 ;
    for (int i=0; i <noIterations; i++){
        z = vec2( 
                c0.x + z.x*z.x -z.y*z.y,
                c0.y + 2.0*z.x*z.y 
                ) ;
        if((length(z)>escapeRadius )){
            scaped = true ;
            break ;
        }

        iter += 1.0 ;
    }

    mu = iter - log(log(length(z)))/log(escapeRadius) ;
    outcolor = vec4(mu) ;
    return ;
}
