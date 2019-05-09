/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   Polynomial Julia-Set 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Thu 28 Sep 2017 11:33:48 AM EDT 
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
define([    'require',
            'shader!vertShader.vert',
            'shader!compShader.frag',
            'Abubu/Abubu'
            ],
function(   require,
            vertShader,
            compShader,
            Abubu
            ){
"use strict" ;

/*========================================================================
 * Global Parameters
 *========================================================================
 */
var log = console.log ;
var params ;
var env ;
var gui ;
var pan ;
/*========================================================================
 * createGui
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui() ;
    gui = env.gui.addPanel({width:300}) ;
    
    gui.f0 = gui.addFolder('Julia Params') ;
    gui.f0.add(env, 'n').onChange(function(){
                env.comp.setUniform('n',env.n) ;
            } ).min(1).step(1) ;

    gui.f0.add(env, 'r').onChange(function(){
                env.comp.setUniform('r',env.r) ;
            } ).step(0.0001) ;
    gui.f0.add(env, 'alpha').onChange(function(){
                env.comp.setUniform('alpha',env.alpha) ;
            } ).step(0.0001) ;

    gui.f0.add(env,'noIterations').onChange(function(){
            env.comp.setUniform('noIterations', env.noIterations) ;
            }).step(2).min(1) ;

    gui.f0.add(env,'escapeRadius').onChange(function(){
            env.comp.setUniform('escapeRadius', env.escapeRadius) ;
            }).step(1).min(2) ;
    gui.rng = gui.addFolder( 'Range' ) ;
    gui.rng.add(env, 'x1').onChange(function(){
                env.comp.setUniform('x1',env.x1) ;
            } ).step(0.000001) ;
    gui.rng.add(env, 'x2').onChange(function(){
                env.comp.setUniform('x2',env.x2) ;
            } ).step(0.000001) ;

    gui.rng.add(env, 'y1').onChange(function(){
                env.comp.setUniform('y1',env.y1) ;
            } ).step(0.000001) ;
    gui.rng.add(env, 'y2').onChange(function(){
                env.comp.setUniform('y2',env.y2) ;
            } ).step(0.000001) ;

    gui.rng.open() ;

    gui.f1 = gui.addFolder('Display Menu') ;
    gui.f1.add(env,'maxValue').onChange(function(){
            env.disp.setMaxValue(env.maxValue) ;
            } ).min(0) ;
    gui.f1.add(env,'minValue').onChange(function(){
            env.disp.setMinValue(env.minValue) ;
            } ) ;

    gui.f1.add( env, 'colormap', Abubu.getColormapList() )
                .onChange(  function(){
                                env.disp.setColormap(env.colormap);
                            }   ).name('Colormap') ;

    gui.f0.open() ;
    gui.f1.open() ;

    env.save = function(){
        Abubu.saveToXML({
                fileName : env.filename + '.xml' ,
                obj     : env,
                names   : saveList } ) ;
        Abubu.saveCanvas ( 'canvas_1',
                {
                    prefix: env.filename ,
                    format: 'png' } ) ;
    } ;

    env.input = document.createElement('input') ;
    env.input.setAttribute('type', 'file' ) ;
    env.input.onchange = function(){
        Abubu.loadFromXML({
            input   : env.input ,
            obj     : env ,
            names   : saveList,
            callback : function(){
                env.gui.update();
             } ,
        } ) ;
    } ;

    gui.save = gui.addFolder('Save and Load') ;
    gui.save.add( env.input, 'click' ).name('Load XML file') ;
    gui.save.add( env, 'comment' ).name('comments') ;
    gui.save.add( env, 'filename' ).name('File Name') ;
    gui.save.add( env, 'save' ) ;
    gui.save.open() ;


    return ;
} /* End of createGui */

var saveList = [ 
    'comment', 
    'n', 'r','alpha',
    'x1','x2','y1','y2',
    'noIterations',
    'escapeRadius','minValue','maxValue','colormap' ] ;

/*========================================================================
 * Environment
 *========================================================================
 */
function Environment(){
    this.running = false ;

    /* Model Parameters         */
    this.C_m        = 1.0 ;
    this.diffCoef   = 0.001 ;

    this.minVlt     = -90 ;
    this.maxVlt     = 30 ;

    /* Display Parameters       */
    this.colormap    =   'rainbowHotSpring';
    this.dispWidth   =   512 ;
    this.dispHeight  =   512 ;

    /* Solver Parameters        */
    this.width       =   512 ;
    this.height      =   512 ;
    
    this.a = 2.3 ;
    this.x10 = -this.a ;
    this.x20 = this.a ;
    this.y10 = -this.a ;
    this.y20 = this.a ;

    this.x1 = this.x10 ;
    this.x2 = this.x20 ;
    this.y1 = this.y10 ;
    this.y2 = this.y20 ;
    this.scale = 1.0 ;
    this.noIterations = 3000 ;

    this.n  = 2 ;
    this.r  = 0.84 ;
    this.alpha = Math.PI ;

    this.escapeRadius =2. ;
    this.minValue = 0. ;
    this.maxValue = 50.  ;
    this.filename = '' ;
    this.comment  = '' ;

}

/*========================================================================
 * Initialization of the GPU and Container
 *========================================================================
 */
function loadWebGL()
{
    var canvas_1 = document.getElementById("canvas_1") ;

    canvas_1.width  = 512 ;
    canvas_1.height = 512 ;

    env = new Environment() ;
    params = env ;
/*-------------------------------------------------------------------------
 * stats
 *-------------------------------------------------------------------------
 */
    var stats       = new Stats() ;
    document.body.appendChild( stats.domElement ) ;
    env.outcolor = new Abubu.FloatRenderTarget(env.width, env.height) ;

/*------------------------------------------------------------------------
 * comp1 and comp2 solvers for time stepping
 *------------------------------------------------------------------------
 */
    env.comp = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        vertexShader    : vertShader.value,
        uniforms        : {
            escapeRadius : { type : 'f', value : env.escapeRadius } ,
            noIterations: { type : 'i', value : env.noIterations} ,
            n       : { type : 'i', value : env.n   } ,
            r       : { type : 'f', value : env.r   } ,
            alpha   : {type : 'f', value : env.alpha } ,
            x1      : { type : 'f', value : env.x1 } ,
            x2      : { type : 'f', value : env.x2 } ,
            y1      : { type : 'f', value : env.y1 } ,
            y2      : { type : 'f', value : env.y2 } ,
        } ,
        renderTargets   : {
            outval  : { location : 0 , target : env.outcolor } ,
        }
    } ) ;

/*------------------------------------------------------------------------
 * disp
 *------------------------------------------------------------------------
 */
    env.disp = new Abubu.Plot2D({
            target: env.outcolor ,
            canvas : canvas_1 ,
            colormap : env.colormap,
            minValue : env.minValue,
            maxValue : env.maxValue , 
            } ) ;
//    env.disp.addMessage('Polynomial Julia Set', 0.05,0.05 , 
//            {   font: "Bold 12pt Arial",
//                style:"#ffffff",
//                align : "start"             }  ) ;

/*------------------------------------------------------------------------
 * createGui
 *------------------------------------------------------------------------
 */
   createGui() ;
   canvas_1.addEventListener( 'wheel', onwheel, false ) ;

   canvas_1.addEventListener( 'mousemove', onmousemove, false ) ;
   canvas_1.addEventListener( 'mousedown', onmousedown, false ) ;

/*------------------------------------------------------------------------
 * rendering the program ;
 *------------------------------------------------------------------------
 */
    env.render = function(){
        env.comp.render() ;
        env.disp.render() ;
        stats.update(); 
        requestAnimationFrame(env.render) ;
    }

/*------------------------------------------------------------------------
 * add environment to document
 *------------------------------------------------------------------------
 */
    document.env = env ;

/*------------------------------------------------------------------------
 * render the webgl program
 *------------------------------------------------------------------------
 */
    env.render();

}/*  End of loadWebGL  */

/*========================================================================
 * onmousemove
 *========================================================================
 */ 
function onmousemove(e){
    if (e.buttons >=1 ){
        var px = e.offsetX/canvas_1.width ;
        var py = 1.-e.offsetY/canvas_1.height ;
        var dx = px - env.px0 ;
        var dy = py - env.py0 ;

        var rx = env.x2d-env.x1d ;
        var ry = env.y2d-env.y1d ;
        env.x1 = env.x1d - dx*rx ;
        env.x2 = env.x1 + rx ;

        env.y1 = env.y1d - dy*ry ;
        env.y2 = env.y1 + ry ;

        env.comp.setUniform('x1', env.x1) ;
        env.comp.setUniform('x2', env.x2) ;
        env.comp.setUniform('y1', env.y1) ;
        env.comp.setUniform('y2', env.y2) ;
        env.gui.update() ;
        env.comp.render() ;
    } 
}

/*========================================================================
 * onmousedown
 *========================================================================
 */ 
function onmousedown(e){
    env.x1d = env.x1 ;
    env.x2d = env.x2 ;
    env.y1d = env.y1 ;
    env.y2d = env.y2 ;
    env.px0 = e.offsetX/canvas_1.width ;
    env.py0 = 1.-e.offsetY/canvas_1.height ;
}

/*========================================================================
 * onwheel
 *========================================================================
 */ 
function onwheel(e){
    var s = 1.1 ;

    var px = e.offsetX/canvas_1.width ;
    var py = 1.-e.offsetY/canvas_1.height ;

    var rx0 = env.x2-env.x1 ;
    var ry0 = env.y2-env.y1 ;

    var x = env.x1 + rx0*px ;
    var y = env.y1 + rx0*py ;
    var reset = false ;

    var wheelDelta = extractWheelDelta(e) ;
   
    if ( wheelDelta > 0. ){
        env.scale *= s ;
        var rx1 = rx0/s ;
        var ry1 = ry0/s ;
    }else if ( env.scale > s ){
        env.scale /= s ;
        var rx1 = rx0*s ;
        var ry1 = ry0*s ;
    }else{
        env.scale = 1.0 ;
        var rx1 = rx0 ;
        var ry1 = ry0 ;
        reset = true ;
    }
    env.x1 = x - rx1*px ;
    env.x2 = env.x1 + rx1 ;

    env.y1 = y - ry1*py ;
    env.y2 = env.y1 + ry1 ;

    if (reset){
        env.x1 = env.x10 ;
        env.x2 = env.x20 ;
        env.y1 = env.y10 ;
        env.y2 = env.y20 ;
    }
    
    env.comp.setUniform('x1', env.x1) ;
    env.comp.setUniform('x2', env.x2) ;
    env.comp.setUniform('y1', env.y1) ;
    env.comp.setUniform('y2', env.y2) ;
    env.gui.update() ;
    env.comp.render() ;
}


/*=========================================================================
 * Extract Wheel Delta According to browser
 *=========================================================================
 */
function extractWheelDelta(e) {
     var delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;
     return delta ;
}

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * End of require()
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
loadWebGL() ;
} ) ;
