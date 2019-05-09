#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * compShader   :   Beeler-Reuter Compute Shader
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 26 Jul 2017 10:36:21 AM EDT
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
precision highp float;
precision highp int ;

/*------------------------------------------------------------------------
 * Interface variables : 
 * varyings change to "in" types in fragment shaders 
 * and "out" in vertexShaders
 *------------------------------------------------------------------------
 */
in vec2 pixPos ;

uniform sampler2D   inMhjd ;
uniform sampler2D   inVcxf ;
uniform sampler2D   mtht ;
uniform sampler2D   jtdt ;
uniform sampler2D   xtft ;
uniform sampler2D   ikix ;

uniform float       ds_x, ds_y ;
uniform float       dt ;
uniform float       diffCoef, C_m ;
uniform float       minVlt, maxVlt ;
uniform float       C_tau_f ;
uniform float       C_tau_x1 ;
uniform float       C_tau_m ;
uniform float       C_tau_h ;
uniform float       C_tau_j ;
uniform float       C_tau_d ;

uniform float       C_K1, C_x1, C_Na, C_s ;

uniform float       g_s ;
uniform float       g_Na ;
uniform float       g_NaC ;

uniform float       D_Ca, D_Na ;

/*------------------------------------------------------------------------
 * It turns out for my current graphics card the maximum number of 
 * drawBuffers is limited to 8 
 *------------------------------------------------------------------------
 */
layout (location = 0 )  out vec4 outMhjd ;
layout (location = 1 )  out vec4 outVcxf ;

/*========================================================================
 * Main body of the shader
 *========================================================================
 */
void main() {
    vec2    cc = pixPos ;
    vec2    size    = vec2(textureSize( inVcxf, 0 ) );
    float   cddx    = size.x/ds_x ;
    float   cddy    = size.y/ds_y ;

    cddx *= cddx ;
    cddy *= cddy ;

/*------------------------------------------------------------------------
 * reading from textures
 *------------------------------------------------------------------------
 */
    vec4    vcxfVal = texture( inVcxf, cc ) ;
    vec4    mhjdVal = texture( inMhjd, cc ) ;
  
    float   V       = vcxfVal.r ;
    vec2    v       = vec2((V - minVlt)/(maxVlt - minVlt),  0.5 ) ;
    
    vec4    mthtTab = texture( mtht, v ) ;
    vec4    jtdtTab = texture( jtdt, v ) ;
    vec4    xtftTab = texture( xtft, v ) ;
    vec4    ikixTab = texture( ikix, v ) ;

    float   Cai     = vcxfVal.g ;
    float   x1      = vcxfVal.b ;
    float   f       = vcxfVal.a ;

/*------------------------------------------------------------------------
 * m
 *------------------------------------------------------------------------
 */ 
    float   m       = mhjdVal.r ;
    float   m_inf   = mthtTab.r ;
    float   tau_m   = mthtTab.g*C_tau_m ;
    m = m_inf - (m_inf-m )*exp(-dt/tau_m) ;

/*------------------------------------------------------------------------
 * h
 *------------------------------------------------------------------------
 */
    float   h       = mhjdVal.g ;
    float   h_inf   = mthtTab.b ;
    float   tau_h   = mthtTab.a*C_tau_h ;
    h   = h_inf - (h_inf -h)*exp(-dt/tau_h) ;

/*------------------------------------------------------------------------
 * j
 *------------------------------------------------------------------------
 */
    float   j       = mhjdVal.b ;
    float   j_inf   = jtdtTab.r ;
    float   tau_j   = jtdtTab.g*C_tau_j ;
    j = j_inf - ( j_inf - j)*exp(-dt/tau_j) ;

/*------------------------------------------------------------------------
 * d
 *------------------------------------------------------------------------
 */
    float   d       = mhjdVal.a ;
    float   d_inf   = jtdtTab.b ;
    float   tau_d   = jtdtTab.a*C_tau_d ;
    d = d_inf - (d_inf - d)*exp(-dt/tau_d );

/*------------------------------------------------------------------------
 * x1
 *------------------------------------------------------------------------
 */
    float   x1_inf  = xtftTab.r ;
    float   tau_x1  = xtftTab.g*C_tau_x1 ;
    x1  = x1_inf - ( x1_inf - x1)*exp( -dt/tau_x1 ) ;

/*------------------------------------------------------------------------
 * f 
 *------------------------------------------------------------------------
 */
    float   f_inf   = xtftTab.b ;
    float   tau_f   = xtftTab.a*C_tau_f ;
    f   = f_inf - (f_inf-f)*exp(-dt/tau_f) ;

/*------------------------------------------------------------------------
 * iK1
 *------------------------------------------------------------------------
 */
    float   iK1     = C_K1*ikixTab.r ;

/*------------------------------------------------------------------------
 * ix1
 *------------------------------------------------------------------------
 */
    float   ix1_bar = ikixTab.g ;
    float   ix1     = C_x1*ix1_bar*x1 ;

/*------------------------------------------------------------------------
 * iNa
 *------------------------------------------------------------------------
 */
    float   ENa     = 50.0 + D_Na ;
    float   gNa     = g_Na ;//4.0 ;
    float   gNaC    = g_NaC ;//0.005 ;

    float   iNa     = C_Na*(gNa*m*m*m*h*j+gNaC)*(V-ENa) ;

/*------------------------------------------------------------------------
 * iCa
 *------------------------------------------------------------------------
 */
    float   ECa     = D_Ca -82.3 - 13.0278*log(Cai) ;
    float   gs      = g_s ; //0.09 ;
    float   iCa     = C_s*gs*d*f*(V-ECa) ;

/*------------------------------------------------------------------------
 * Cai
 *------------------------------------------------------------------------
 */
    float   dCai2dt = -1.0e-7*iCa + 0.07*(1.0e-7-Cai) ;
    Cai += dCai2dt*dt ;

/*-------------------------------------------------------------------------
 * Laplacian
 *-------------------------------------------------------------------------
 */
    vec2 ii = vec2(1.0,0.0)/size ;
    vec2 jj = vec2(0.0,1.0)/size ;    
    
    float gamma = 1./3. ;

    float dVlt2dt = (1.-gamma)*((   texture(inVcxf,cc+ii).r
                                -   2.0*vcxfVal.r
                                +   texture(inVcxf,cc-ii).r     )*cddx
                            +   (   texture(inVcxf,cc+jj).r
                                -   2.0*vcxfVal.r
                                +   texture(inVcxf,cc-jj).r     )*cddy  )

                +   gamma*0.5*(     texture(inVcxf,cc+ii+jj).r
                                +   texture(inVcxf,cc+ii-jj).r
                                +   texture(inVcxf,cc-ii-jj).r
                                +   texture(inVcxf,cc-ii+jj).r
                                -   4.0*vcxfVal.r               )*(cddx + cddy) ;
    dVlt2dt *= diffCoef ;

/*------------------------------------------------------------------------
 * I_sum
 *------------------------------------------------------------------------
 */
    float I_sum =   iK1
                +   ix1
                +   iNa
                +   iCa 
                ;

/*------------------------------------------------------------------------
 * Time integration for membrane potential
 *------------------------------------------------------------------------
 */
    dVlt2dt -= I_sum/C_m ;
    V += dVlt2dt*dt ;

/*------------------------------------------------------------------------
 * ouputing the shader
 *------------------------------------------------------------------------
 */

    outMhjd = vec4(m,h,j,d);
    outVcxf = vec4(V,Cai,x1,f);

    return ;
}
