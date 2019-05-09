#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * initShader   :   Initialize Beeler-Reuter Variables 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 19 Jul 2017 12:31:30 PM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;

/*------------------------------------------------------------------------
 * Interface variables : 
 * varyings change to "in" types in fragment shaders 
 * and "out" in vertexShaders
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
layout (location = 0 )  out vec4 outFmhjd ;
layout (location = 1 )  out vec4 outSmhjd ;

layout (location = 2 )  out vec4 outFvcxf ;
layout (location = 3 )  out vec4 outSvcxf ;

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec4 mhjd = vec4(0.011,0.9877,0.9748,0.003) ;
    vec4 vcxf = vec4(-83.0,1.782e-7,0.0057,1.0) ;

    if (pixPos.x < 0.02){
        vcxf.r = 0.0 ;
    }

    outFmhjd = mhjd ;
    outSmhjd = mhjd ;

    outFvcxf = vcxf ;
    outSvcxf = vcxf ;
    return ;
}
