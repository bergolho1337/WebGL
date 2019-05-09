#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * vertShader   :   vertex shader
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 19 Jul 2017 12:45:23 PM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl

/*------------------------------------------------------------------------
 * "attribute"s in WebGL1 change to "in"s to a vertexShaders in WebGL2.
 * It will receive data from a buffer
 *------------------------------------------------------------------------
 */
in vec4 position;
uniform float  x1, x2, y1, y2 ;

/*------------------------------------------------------------------------
 * "varyings" in WebGL1 change to "out" variables in WebGL2 vertexShaders
 *------------------------------------------------------------------------
 */
out vec2 pixPos ;
out vec2 pixCrd ;

/*========================================================================
 * Main body of the vertexShader
 *========================================================================
 */
void main() {
    pixPos      = position.xy ;
    pixCrd.x    = pixPos.x*(x2-x1) + x1 ;
    pixCrd.y    = pixPos.y*(y2-y1) + y1 ;

    gl_Position = vec4(position.x*2.-1., position.y*2.-1.,0.,1.0);
}
