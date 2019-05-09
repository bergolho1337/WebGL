#version 300 es

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * bvltShader
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 26 Oct 2016 06:21:49 PM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl

in vec2        pixPos ;

uniform sampler2D   map ;
uniform float       ry ;

layout (location = 0 ) out vec4 outMap ;
/*=========================================================================
 * main
 *=========================================================================
 */
void main(){
    vec4 val = texture( map, pixPos ) ;

    if ( pixPos.y < ry ){
        val.r = 30. ;
    } ;
    outMap = val ;
    return ;
}
