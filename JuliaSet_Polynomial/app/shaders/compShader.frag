#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * compShader   :   Polynomial Julia-Set
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   2/19/2018 11:21:57 PM
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
uniform float   r, alpha ;
uniform int     n ;

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
out vec4 outcolor ;

/*========================================================================
 * multiplying complex numbers "a" and "b" 
 *========================================================================
 */
#define mul(a,b)  vec2((a).x*(b).x-(a).y*(b).y,(a).x*(b).y + (a).y*(b).x)

vec2 complexPow(vec2 a,int m){
    vec2 z0 = vec2(1.,0.) ;
    for(int i=0; i<m ; i++){
        z0 = mul(z0,a) ;
    }
    return z0 ;
}

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    float   iter = 0. ;
    float   mu = 0. ;
    vec2 c0 = r*vec2(cos(alpha),sin(alpha));
    vec2 z      = pixCrd ;
    for (int i=0; i <noIterations; i++){
        z = complexPow(z,n) + c0 ;
        if((length(z)>escapeRadius )){
            break ;
        }

        iter += 1.0 ;
    }

    mu = iter - log(log(length(z)))/log(escapeRadius) ;
    outcolor = vec4(mu) ;
    return ;
}
