/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   2D Beeler-Reuter Model in WebGL2.0
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Wed 30 Aug 2017 05:44:10 PM EDT 
 * PLACE        :   Chaos Lab @ GaTech, Atlanta, GA
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
define([    'require',
            'shader!vertShader.vert',
            'shader!initShader.frag',
            'shader!compShader.frag',
            'shader!paceShader.frag',
            'shader!clickShader.frag',
            'shader!bvltShader.frag',
            'Abubu/Abubu'
            ],
function(   require,
            vertShader,
            initShader,
            compShader,
            paceShader,
            clickShader,
            bvltShader,
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

/*========================================================================
 * createGui
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui() ;
    gui = env.gui.addPanel({width:300}) ;

/*-------------------------------------------------------------------------
 * Model Parameters
 *-------------------------------------------------------------------------
 */
    gui.mdlPrmFldr  =   gui.addFolder( 'Model Parameters'   ) ;
    addCoeficients(     gui.mdlPrmFldr, ['C_m', 'diffCoef'] ,
                        [env.comp1,env.comp2], {min:0}) ;

/*------------------------------------------------------------------------
 * Time Coeficients
 *------------------------------------------------------------------------
 */
    gui.tcfPrmFldr = gui.addFolder( 'Time Coeficients' ) ;
    addCoeficients( gui.tcfPrmFldr, [
                                    'C_tau_x1',
                                    'C_tau_m',
                                    'C_tau_h',
                                    'C_tau_j',
                                    'C_tau_d',
                                    'C_tau_f',
                                ] ,
                    [env.comp1,env.comp2 ] ) ;

/*------------------------------------------------------------------------
 * current multipliers
 *------------------------------------------------------------------------
 */
    gui.crtPrmFldr = gui.addFolder( 'Current Multipliers' ) ;
    addCoeficients(
        gui.crtPrmFldr ,
        [
            'C_K1',
            'C_x1',
            'C_Na',
            'C_s' ,
        ] , [env.comp1, env.comp2 ] ) ;
gui.revFldr = gui.addFolder( 'Rev. Potential Shifters' ) ;
    addCoeficients(
        gui.revFldr ,
        [
            'D_Ca',
            'D_Na',
        ] , [env.comp1, env.comp2 ] ) ;

/*------------------------------------------------------------------------
 * 
 *------------------------------------------------------------------------
 */
    gui.condFldr = gui.addFolder( 'Conductances' ) ;
    addCoeficients( gui.condFldr , 
            [ 'g_s', 'g_Na', 'g_NaC' ] ,
            [env.comp1, env.comp2] ) ;

/*------------------------------------------------------------------------
 * Solver Parameters
 *------------------------------------------------------------------------
 */
    gui.slvPrmFldr  = gui.addFolder( 'Solver Parameters' ) ;
    gui.slvPrmFldr.add( env, 'dt').name('Delta t').onChange(
         function(){
            Abubu.setUniformInSolvers('dt', env.dt,
                    [env.comp1,env.comp2 ]) ;
         }
    );

    gui.slvPrmFldr.add( env, 'ds_x' ).name( 'Domain size-x').onChange(
        function(){
            Abubu.setUniformInSolvers('ds_x', env.ds_x,
                    [env.comp1,env.comp2 ]) ;
        }
    ) ;
    gui.slvPrmFldr.add( env, 'ds_y' ).name( 'Domain size-y').onChange(
        function(){
            Abubu.setUniformInSolvers('ds_y', env.ds_y,
                    [env.comp1,env.comp2 ]) ;
        }
    ) ;

    gui.slvPrmFldr.add( env, 'width').name( 'x-resolution' )
    .onChange( function(){
        Abubu.resizeRenderTargets(
                [fmhjd,fvcxf,smhjd,svcxf], env.width, env.height);
    } ) ;

    gui.slvPrmFldr.add( env, 'height').name( 'y-resolution' )
    .onChange( function(){
        Abubu.resizeRenderTargets(
            [
                env.fmhjd,
                env.fvcxf,
                env.smhjd,
                env.svcxf
            ],
            env.width,
            env.height);
    } ) ;

/*------------------------------------------------------------------------
 * Display Parameters
 *------------------------------------------------------------------------
 */
    gui.dspPrmFldr  = gui.addFolder( 'Display Parameters' ) ;
    gui.dspPrmFldr.add( env, 'colormap',
            Abubu.getColormapList())
                .onChange(  function(){
                                env.disp.setColormap(env.colormap);
                                refreshDisplay() ;
                            }   ).name('Colormap') ;

    gui.dspPrmFldr.add( env, 'probeVisiblity').name('Probe Visiblity')
        .onChange(function(){
            env.disp.setProbeVisiblity(env.probeVisiblity);
            refreshDisplay() ;
        } ) ;
        
    gui.dspPrmFldr.add( env, 'tiptVisiblity' )
        .name('Plot Tip Trajectory?')
        .onChange(function(){
            env.disp.setTiptVisiblity(env.tiptVisiblity) ;
            refreshDisplay() ;
        } ) ;

    gui.dspPrmFldr.add( env, 'tiptThreshold').name( 'Tip Threshold [mv]')
        .onChange( function(){
                env.disp.setTiptThreshold( env.tiptThreshold ) ;
                } ) ;

    gui.dspPrmFldr.add( env, 'frameRate').name('Frame Rate Limit')
        .min(60).max(40000).step(60) ;
    gui.dspPrmFldr.add( env, 'saveClrPlotPrefix').name('File Name Prefix') ;
    gui.dspPrmFldr.add( env, 'saveClrPlot' );

/*------------------------------------------------------------------------
 * vltSignal
 *------------------------------------------------------------------------
 */
    gui.vltSignal = gui.dspPrmFldr.addFolder('Voltage Signal');
    gui.vltTimeWindow = gui.vltSignal.add( env, 'timeWindow').name('Time Window [ms]')
    .onChange( function(){
        env.plot.updateTimeWindow(env.timeWindow) ;
        refreshDisplay() ;
    } ) ;
    gui.vltSignal.add(env , 'saveVltPlotPrefix').name('File Name Prefix') ;
    gui.vltSignal.add(env , 'saveVltPlot') ;
    gui.vltSignal.open() ;

/*------------------------------------------------------------------------
 * record
 *------------------------------------------------------------------------
 */
    gui.rec = gui.addFolder('Record Voltage @ Probe' ) ;
    gui.rec.recording = gui.rec.add(env.rec, 'recording')
    .name('recording?').onChange(
        function(){
            env.rec.recorder.setRecordingStatus( env.rec.recording ) ;
        } ).listen() ;
    gui.rec.add(env.rec, 'toggleRecording' ) ;
    gui.rec.add(env.rec, 'interval').onChange(function(){
        env.rec.recorder.setSampleRate(env.rec.interval) ;
    } ) ;
    gui.rec.add(env.rec, 'reset' ) ;
    gui.rec.add(env.rec, 'fileName') ;
    gui.rec.add(env.rec, 'save' ) ;

/*------------------------------------------------------------------------
 * apd
 *------------------------------------------------------------------------
 */
    gui.apdFldr = gui.addFolder( 'APD Measurement' ) ;
    gui.apdFldr.add( env.apd , 'measuring').onChange(function(){
        env.apd.probe.setMeasuring(env.apd.measuring) ;
    } ) ;
    gui.apdFldr.add( env.apd , 'threshold' ).onChange(function(){
        env.apd.probe.reset({threshold: env.apd.threshold } ) ; 
    } ) ;
    gui.apdFldr.add( env.apd , 'apCounts' ).name('A.P. Counts').onChange(function(){
        env.apd.probe.reset({ apCounts: env.apd.apCounts } ) ; 
    } ) ;
    gui.apdFldr.add( env.apd, 'noApsMeasured')
        .name('No. of Measured APs').listen() ;
    gui.apdFldr.add( env.apd, 'last'    ).name('Last APD').listen();
    gui.apdFldr.add( env.apd, 'average' ).name('Average APD').listen();

/*------------------------------------------------------------------------
 * pace maker
 *------------------------------------------------------------------------
 */
    gui.paceFldr = gui.addFolder('Pace Maker') ;
    gui.paceFldr.active = gui.paceFldr.add(env.paceMaker, 'active').
        onChange(function(){
            env.paceMaker.caller.setActivity(env.paceMaker.active) ;
        } ) ;

    gui.paceFldr.period = gui.paceFldr.add( env.paceMaker, 'period').
        onChange(function(){
            env.paceMaker.caller.setInterval(
                env.paceMaker.period ) ;
        } ) ;
    gui.paceFldr.period = gui.paceFldr.add( env.paceMaker, 'radius').
        onChange(function(){
            env.paceMaker.solver.setUniform('paceRadius',
                    env.paceMaker.radius ) ;
        } ) ;
    gui.paceFldr.add(env.paceMaker , 'pickPosition')
        .name('Pick Pace-Position') ;
    
/*------------------------------------------------------------------------
 * vltBreak
 *------------------------------------------------------------------------
 */
    gui.vltBreak = gui.addFolder( 'Break Voltage' );
    gui.vltBreak.add( env, 'vltBreak' ).name( 'Autobreak?') ;
    gui.vltBreak.add( env, 'ry'         ).onChange(function(){
        env.breakVlt.setUniform('ry', env.ry) ;
    } ) ;
    gui.vltBreak.add( env, 'breakTime').name('Break Time [ms]') ;

/*------------------------------------------------------------------------
 * Simulation
 *------------------------------------------------------------------------
 */
    gui.smlPrmFldr  = gui.addFolder(    'Simulation'    ) ;
    gui.smlPrmFldr.add( env,  'clickRadius' )
        .min(0.01).max(1.0).step(0.01)
        .name('Click Radius')
        .onChange(function(){
                env.click.setUniform('clickRadius',env.clickRadius) ;
                } ) ;
    gui.smlPrmFldr.clicker = gui.smlPrmFldr.add( env,
        'clicker',
        [   
            'Pace Region',
            'Signal Loc. Picker',
            'Pace-Maker Location'  ] ).name('Clicker Type') ;

    gui.smlPrmFldr.add( env, 'time').name('Solution Time [ms]').listen() ;

    gui.smlPrmFldr.add( env, 'initialize').name('Initialize') ;
    gui.smlPrmFldr.add( env, 'solve').name('Solve/Pause') ;
    gui.smlPrmFldr.open() ;

/*------------------------------------------------------------------------
 * addCoeficients
 *------------------------------------------------------------------------
 */
    function addCoeficients( fldr,
            coefs,
            solvers ,
            options ){
        var coefGui = {} ;
        var min = undefined ;
        var max = undefined ;
        if (options != undefined ){
            if (options.min != undefined ){
                min = options.min ;
            }
            if (options.max != undefined ){
                max = options.max ;
            }
        }
        for(var i=0; i<coefs.length; i++){
            var coef = addCoef(fldr,coefs[i],solvers) ;
            if (min != undefined ){
                coef.min(min) ;
            }
            if (max != undefined ){
                coef.max(max) ;
            }
            coefGui[coefs[i]] = coef ;
        }
        return coefGui ;

        /* addCoef */if ( env.time > env.breakTime 
                    && env.notBreaked 
                    && env.vltBreak     ){
                env.breakVltNow() ;
            }

        function addCoef( fldr,
                coef,
                solvers     ){
            var coefGui =   fldr.add( env, coef )
                .onChange(
                        function(){
                        Abubu.setUniformInSolvers(  coef,
                                env[coef],
                                solvers  ) ;
                        } ) ;

            return coefGui ;

        }
    }

    return ;
} /* End of createGui */

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

    /* time coeficients         */
    this.C_tau_x1    =   1.0 ;
    this.C_tau_m     =   1.0 ;
    this.C_tau_h     =   1.0 ;
    this.C_tau_j     =   1.0 ;
    this.C_tau_d     =   1.0 ;
    this.C_tau_f     =   1.0 ;

    /* Current Multipliers   */
    this.C_K1   = 1.0 ;
    this.C_x1   = 1.0 ;
    this.C_Na   = 1.0 ;
    this.C_s    = 1.0 ;
    this.D_Ca    = 0.0 ;
    this.D_Na    = 0.0 ;


    this.g_s    = 0.09 ;
    this.g_Na   = 4.0 ;
    this.g_NaC  = 0.005 ;

    /* Display Parameters       */
    this.colormap    =   'rainbowHotSpring';
    this.dispWidth   =   512 ;
    this.dispHeight  =   512 ;
    this.frameRate   =   2400 ;
    this.timeWindow  =   1000 ;
    this.probeVisiblity = false ;

    this.tiptVisiblity= false ;
    this.tiptThreshold=  -70.;
    this.tiptColor    = "#FFFFFF";

    this.saveClrPlotPrefix = '' ;
    this.saveClrPlot    = function(){
        var prefix ;
        try{
            prefix = eval(env.saveClrPlotPrefix) ;
        }catch(e){
            prefix = this.saveClrPlotPrefix ;
        }
        
        if (prefix == undefined ){
            prefix = this.saveClrPlotPrefix ;
        }else{
            prefix = prefix + '_' ;
        }

        Abubu.saveCanvas( 'canvas_1',
        {
            number  : this.time ,
            postfix : '_'+this.colormap ,
            prefix  : prefix,
            format  : 'png'
        } ) ;
    }

    this.saveVltPlotPrefix = '' ;
    this.saveVltPlot = function(){
        var prefix ;
        try{
            prefix = eval(env.saveVltPlotPrefix) ;
        }catch(e){
            prefix = this.saveVltPlotPrefix ;
        }
        
        if (prefix == undefined ){
            prefix = this.cntPltPrefix ;
        }else{
            prefix = prefix + '_' ;
        }

        Abubu.saveCanvas( 'canvas_2',
        {
            number  : this.time ,
            postfix : '_vlt',
            prefix  : prefix,
            format  : 'png'
        } ) ;
   
    }
     
    /* Recording */
    this.rec = {} ;
    this.rec.recording = false ;
    this.rec.toggleRecording = function(){
        env.rec.recording = !env.rec.recording ;
        env.rec.recorder.setRecordingStatus(this.recording) ;
    } ;
    this.rec.reset = function(){
        env.rec.recorder.resetRecording(); },
    this.rec.interval = 10 ;
    this.rec.fileName = 'vlt.dat' ;
    this.rec.save = function(){
        var fileName ;
        try{
            fileName = eval(env.rec.fileName) ;
        }catch(e){
            fileName = env.rec.fileName ;
        }
        if ( fileName == undefined ){
            fileName = 'vlt.dat' ;
        }
        env.rec.recorder.setFileName(fileName) ;
        env.rec.recorder.save() ;
    } ;

    /* APD Measuremnet */
    this.apd = {} ;
    this.apd.measuring = false ;
    this.apd.average = 0.;
    this.apd.last = 0. ;
    this.apd.noApsMeasured = 0 ;
    this.apd.threshold = -75 ;
    this.apd.apCounts = 10 ;
    
    /* Autopace                 */
    this.paceMaker          = {} ;
    this.paceMaker.active   = false ;
    this.paceMaker.period   = 300 ;
    this.paceMaker.position = [0.5,0.5] ;
    this.paceMaker.radius   = 0.01 ;
    this.paceMaker.value    = 10 ;
    this.paceMaker.pickPosition = function(){
        env.clicker = 'Pace-Maker Location' ;
        gui.smlPrmFldr.clicker.updateDisplay() ;
    }

    /* Solver Parameters        */
    this.width       =   512 ;
    this.height      =   512 ;
    this.dt          =   1.e-1 ;
    this.cfl         =   1.0 ;
    this.ds_x        =   18 ;
    this.ds_y        =   18 ;

    /* Autopace                 */
    this.pacing      = false ;
    this.pacePeriod  = 300 ;
    this.autoPaceRadius= 0.01 ;

    /* Solve                    */
    this.solve       = function(){
        this.running = !this.running ;
        return ;
    } ;
    this.time        = 0.0 ;
    this.clicker     = 'Pace Region';
    this.oldClicker  = this.clicker;

    this.autoBreakThreshold = -40 ;
    //this.bvltNow     = breakVlt ;
    this.ry          = 0.5 ;
    this.vltBreak    = true ;
    this.breakTime   = 400 ;
    this.notBreaked  = true ;

    this.autostop    = false;
    this.autostopInterval = 300 ;

    this.savePlot2DPrefix = '' ;
    this.savePlot2D    = function(){
        this.running = false ;
        var prefix ;
        try{
            prefix = eval(env.savePlot2DPrefix) ;
        }catch(e){
            prefix = this.savePlot2DPrefix ;
        }
        Abubu.saveCanvas( 'canvas_1',
        {
            number  : this.time ,
            postfix : '_'+this.colormap ,
            prefix  : prefix,
            format  : 'png'
        } ) ;
    }

    /* Clicker                  */
    this.clickRadius     = 0.1 ;
    this.clickPosition   = [0.5,0.5] ;
    this.conductionValue = [-83.0,0,0] ;
    this.paceValue       = [0,0,0,0] ;
}

/*========================================================================
 * Initialization of the GPU and Container
 *========================================================================
 */
function loadWebGL()
{
    var canvas_1 = document.getElementById("canvas_1") ;
    var canvas_2 = document.getElementById("canvas_2") ;

    canvas_1.width = 512 ;
    canvas_1.height = 512 ;

    env = new Environment() ;
    params = env ;
/*-------------------------------------------------------------------------
 * stats
 *-------------------------------------------------------------------------
 */
    var stats       = new Stats() ;
    document.body.appendChild( stats.domElement ) ;

/*------------------------------------------------------------------------
 * creating tables
 *------------------------------------------------------------------------
 */
    var ca_x1= [0.0005,     0.083,  50.,    0.0,
                0.0,        0.057,          1.0     ] ;

    var cb_x1= [0.0013,     -0.06,  20.,    0.0,
                0.0,        -0.04,          1.0     ] ;

    var ca_m = [0.0000,     0.0,    47.,   -1.0,
                47.,        -0.1,           -1.0    ] ;

    var cb_m = [40.,        -0.056, 72.,    0.0,
                0.0,        0.0,            0.0     ] ;

    var ca_h = [.126,       -.25,   77.,    0.0,
                0.0,        0.0,            0.0     ] ;

    var cb_h = [1.7,        0.0,    22.5,   0.0,
                0.0,        -0.082,         1.0     ] ;

    var ca_j = [.055,       -.25,   78.0,   0.0,
                0.0,        -0.2,           1.0     ] ;

    var cb_j = [.3,         0.0,    32.,    0.0,
                0.0,        -0.1,           1.0     ] ;

    var ca_d = [0.095,      -0.01,  -5.,    0.0,
                0.0,        -0.072,         1.0     ] ;

    var cb_d = [0.07,       -0.017, 44.,    0.0,
                0.0,        0.05,           1.0     ] ;

    var ca_f = [0.012,      -0.008, 28.,    0.0,
                0.0,        0.15,           1.0     ] ;

    var cb_f = [.0065,      -0.02,  30.,    0.0,
                0.0,        -0.2,           1.0     ] ;

    /* function to calculate the coeficients */
    function abCoef(Vm,C){
        var al =
            (C[0]*Math.exp(C[1]*(Vm+C[2])) + C[3]*(Vm+C[4]))/
            (Math.exp(C[5]*(Vm+C[2])) + C[6]) ;
        return al ;
    }

    var nSamples = 512 ;                /* no. of samples           */

    var Vlt = new Float32Array(nSamples) ;
    var tab = new Float32Array(nSamples*4) ;

    for(var i=0 ; i< nSamples; i++){
        /* Assume params.minVlt< Vlt < params.maxVlt */
        Vlt[i] = (i+0.5)*(params.maxVlt-params.minVlt)/nSamples
            + params.minVlt ;
    }

    /* mtht */
    for(var i = 0; i<nSamples; i++){
        var indx = i*4 ;
        var V = Vlt[i] ;

        var a_m  = abCoef(V, ca_m) ;
        var b_m  = abCoef(V, cb_m) ;
        var a_h  = abCoef(V, ca_h ) ;
        var b_h  = abCoef(V, cb_h ) ;

        /* m_inf        */
        tab[ indx   ] = a_m/(a_m+b_m) ;

        /* tau_m        */
        tab[ indx+1 ] = 1.0/(a_m+b_m) ;


        /* h_inf        */
        tab[ indx+2 ] = a_h/(a_h + b_h) ;

        /* tau_h        */
        tab[ indx+3 ] = 1.0/(a_h + b_h) ;

    }
    var mtht = new Abubu.TableTexture(tab, nSamples ) ;

    /* jtdt */
    for(var i = 0; i<nSamples; i++){
        var indx = i*4 ;
        var V = Vlt[i] ;

        var a_j = abCoef(V, ca_j ) ;
        var b_j = abCoef(V, cb_j ) ;
        var a_d = abCoef(V, ca_d ) ;
        var b_d = abCoef(V, cb_d ) ;

        /* j_inf        */
        tab[ indx   ] = a_j/(a_j+b_j) ;

        /* tau_j        */
        tab[ indx+1 ] = 1.0/(a_j+b_j) ;

        /* d_inf        */
        tab[ indx+2 ] = a_d/(a_d+b_d) ;

        /* tau_d        */
        tab[ indx+3 ] = 1.0/(a_d+b_d) ;
    }
    var jtdt = new Abubu.TableTexture( tab, nSamples ) ;

    /* xtft */
    for(var i = 0; i<nSamples; i++){
        var indx = i*4 ;
        var V = Vlt[i] ;

        var a_x1 = abCoef( V, ca_x1 ) ;
        var b_x1 = abCoef( V, cb_x1 ) ;
        var a_f  = abCoef( V, ca_f  ) ;
        var b_f  = abCoef( V, cb_f  ) ;
        tab[ indx   ] = a_x1/(a_x1 + b_x1) ;
        tab[ indx+1 ] = 1.0/(a_x1 + b_x1 ) ;
        tab[ indx+2 ] = a_f/(a_f + b_f) ;
        tab[ indx+3 ] = 1.0/(a_f + b_f) ;
    }
    var xtft = new Abubu.TableTexture( tab, nSamples ) ;

    /* ikix */
    for(var i = 0; i<nSamples; i++){
        var indx = i*4 ;
        var Vm = Vlt[i] ;

        tab[ indx   ] = 0.35 *(4*(Math.exp(0.04 * (Vm + 85)) - 1) /
                (Math.exp(0.08 * (Vm + 53))
                    + Math.exp(0.04 * (Vm + 53)))
                + 0.2 * ((Vm + 23) / (1 - Math.exp(-0.04 * (Vm + 23)))));
        tab[ indx+1 ] = 0.8 * ( Math.exp(0.04 * (Vm + 77)) - 1)/
                                Math.exp(0.04 * (Vm + 35));
        tab[ indx+2 ] = 0.0 ;
        tab[ indx+3 ] = 0.0 ;
    }
    var ikix = new Abubu.TableTexture( tab, nSamples ) ;

/*------------------------------------------------------------------------
 * defining all render targets
 *------------------------------------------------------------------------
 */
    env.fmhjd     = new Abubu.FloatRenderTarget(512, 512) ;
    env.smhjd     = new Abubu.FloatRenderTarget(512, 512) ;
    env.fvcxf     = new Abubu.FloatRenderTarget(512, 512) ;
    env.svcxf     = new Abubu.FloatRenderTarget(512, 512) ;

/*------------------------------------------------------------------------
 * init solver to initialize all textures
 *------------------------------------------------------------------------
 */
    env.init  = new Abubu.Solver( {
       fragmentShader  : initShader.value ,
       vertexShader    : vertShader.value ,
       renderTargets   : {
           outFmhjd    : { location : 0, target: env.fmhjd     } ,
           outSmhjd    : { location : 1, target: env.smhjd     } ,
           outFvcxf    : { location : 2, target: env.fvcxf     } ,
           outSvcxf    : { location : 3, target: env.svcxf     }
       }
    } ) ;

/*------------------------------------------------------------------------
 * comp1 and comp2 solvers for time stepping
 *------------------------------------------------------------------------
 */
    env.compUniforms = function(_inVcxf, _inMhjd ){
        this.inMhjd     = { type : 's',     value : _inMhjd         } ;
        this.inVcxf     = { type : 't',     value : _inVcxf         } ;

        this.mtht       = { type : 't',     value : mtht            } ;
        this.jtdt       = { type : 't',     value : jtdt            } ;
        this.xtft       = { type : 't',     value : xtft            } ;
        this.ikix       = { type : 't',     value : ikix            } ;

        this.C_tau_f    = { type : 'f',     value : env.C_tau_f     } ;
        this.C_tau_x1   = { type : 'f',     value : env.C_tau_x1    } ;
        this.C_tau_m    = { type : 'f',     value : env.C_tau_m     } ;
        this.C_tau_h    = { type : 'f',     value : env.C_tau_h     } ;
        this.C_tau_j    = { type : 'f',     value : env.C_tau_j     } ;
        this.C_tau_d    = { type : 'f',     value : env.C_tau_d     } ;

        this.C_K1       = { type : 'f',     value : env.C_K1        } ;
        this.C_x1       = { type : 'f',     value : env.C_x1        } ;
        this.C_Na       = { type : 'f',     value : env.C_Na        } ;
        this.C_s        = { type : 'f',     value : env.C_s         } ;

        this.D_Ca        = { type : 'f',     value : env.D_Ca        } ;
        this.D_Na        = { type : 'f',     value : env.D_Na       } ;
        
        this.g_s        = { type : 'f',     value : env.g_s         } ;
        this.g_Na       = { type : 'f',     value : env.g_Na        } ;
        this.g_NaC      = { type : 'f',     value : env.g_NaC       } ;
        
        this.minVlt     = { type : 'f',     value : env.minVlt      } ;
        this.maxVlt     = { type : 'f',     value : env.maxVlt      } ;
        this.ds_x       = { type : 'f',     value : env.ds_x        } ;
        this.ds_y       = { type : 'f',     value : env.ds_y        } ;
        this.diffCoef   = { type : 'f',     value : env.diffCoef    } ;
        this.C_m        = { type : 'f',     value : env.C_m         } ;
        this.dt         = { type : 'f',     value : env.dt          } ;

    } ;

    env.compTargets = function(_outVcxf, _outMhjd){
        this.outMhjd     = { location : 0  , target :  _outMhjd     } ;
        this.outVcxf     = { location : 1  , target :  _outVcxf     } ;
    } ;

    env.comp1 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        vertexShader    : vertShader.value,
        uniforms        : new env.compUniforms( env.fvcxf, env.fmhjd ) ,
        renderTargets   : new env.compTargets(  env.svcxf, env.smhjd ) ,
    } ) ;

    env.comp2 = new Abubu.Solver( {
        fragmentShader  : compShader.value,
        vertexShader    : vertShader.value,
        uniforms        : new env.compUniforms( env.svcxf, env.smhjd ) ,
        renderTargets   : new env.compTargets(  env.fvcxf, env.fmhjd ) ,
    } ) ;

/*------------------------------------------------------------------------
 * click solver
 *------------------------------------------------------------------------
 */
    env.click = new Abubu.Solver( {
        vertexShader    : vertShader.value ,
        fragmentShader  : clickShader.value ,
        uniforms        : {
            map         : { type: 't',  value : env.fvcxf           } ,
            clickValue   : { type: 'v4', value : [0,0,0,0 ]         } ,
            clickPosition: { type: 'v2', value : env.clickPosition  } ,
            clickRadius  : { type: 'f',  value : env.clickRadius    } ,
        } ,
        renderTargets   : {
            FragColor   : { location : 0,   target : env.svcxf      } ,
        } ,
        clear           : true ,
    } ) ;
    env.clickCopy = new Abubu.Copy(env.svcxf, env.fvcxf ) ;

/*------------------------------------------------------------------------
 * recorder.probe
 *------------------------------------------------------------------------
 */
    env.rec.probe = new Abubu.Probe( env.fvcxf, { channel : 'r', 
            probePosition : [0.5,0.5] } ) ;
    env.rec.recorder = new Abubu.ProbeRecorder(env.rec.probe,
            { 
                sampleRate : env.rec.interval, 
                recording: false , 
                fileName : env.rec.fileName} ) ;


/*------------------------------------------------------------------------
 * apd 
 *------------------------------------------------------------------------
 */
    env.apd.probe = new Abubu.APD( env.fvcxf, 
            {channel : 'r', threshold : env.apd.threshold} ) ;

/*------------------------------------------------------------------------
 * pace
 *------------------------------------------------------------------------
 */
    env.paceMaker.solver = new Abubu.Solver({
        fragmentShader  : paceShader.value,
        vertexShader    : vertShader.value,
        uniforms        : {
            inVcxf      : { type: 't',  value : env.fvcxf               },
            pacePosition: { type: 'v2', value : env.paceMaker.position  },
            paceRadius  : { type : 'f', value : env.paceMaker.radius    } ,
        } ,
        renderTargets: {
            outVcxf : {location : 0 , target : env.svcxf }
            }
    } ) ;

    env.paceMaker.caller = new Abubu.IntervalCaller({
        interval : env.paceMaker.period,
        callback : function(){
            env.paceMaker.solver.render() ;
            env.clickCopy.render() ;
        } ,
        active  : false
    } ) ;

/*------------------------------------------------------------------------
 * breakVlt
 *------------------------------------------------------------------------
 */
    env.breakVlt = new Abubu.Solver({
        vertexShader    : vertShader.value ,
        fragmentShader  : bvltShader.value ,
        uniforms    : { 
            map : { type : 't', value : env.fvcxf   } ,
            ry  : { type : 'f', value : env.ry      } ,
        },
        renderTargets : {
           outMap   : { location : 0 , target : env.svcxf } ,
        } ,
        clear : true ,
    } ) ;
    env.breakCopy = new Abubu.Copy(env.svcxf, env.fvcxf ) ;

    env.breakVltNow = function(){
        env.breakVlt.render() ;
        env.breakCopy.render() ;
        env.notBreaked = false ;
        refreshDisplay() ;
    }
           
/*------------------------------------------------------------------------
 * Signal Plot
 *------------------------------------------------------------------------
 */
    env.plot = new Abubu.SignalPlot( {
            noPltPoints : 1024,
            grid        : 'on' ,
            nx          : 5 ,
            ny          : 6 ,
            xticks : { mode : 'auto', unit : 'ms', font:'11pt Times'} ,
            yticks : { mode : 'auto', unit : 'mv' } ,
            canvas      : canvas_2,
    });

    env.plot.addMessage(    'Membrane Potential at the Probe',
                        0.5,0.05,
                    {   font : "12pt Arial" ,
                        align: "center"                          } ) ;

    env.vsgn = env.plot.addSignal( env.fvcxf, {
            channel : 'r',
            minValue : -90 ,
            maxValue : 30 ,
            restValue: -83,
            color : [0.5,0,0],
            visible: true,
            linewidth : 3,
            timeWindow: env.timeWindow,
            probePosition : [0.5,0.5] , } ) ;

/*------------------------------------------------------------------------
 * disp
 *------------------------------------------------------------------------
 */
    env.disp= new Abubu.Plot2D({
        target : env.svcxf ,
        prevTarget : env.fvcxf ,
        colormap : env.colormap,
        canvas : canvas_1 ,
        minValue: -90 ,
        maxValue: 10 ,
        tipt : false ,
        tiptThreshold : env.tiptThreshold ,
        probeVisible : false ,
        colorbar : true ,
        unit : 'mv',
    } );
    env.disp.showColorbar() ;
    env.disp.addMessage(  'Beeler-Reuter Model',
                        0.05,   0.05, /* Coordinate of the
                                         message ( x,y in [0-1] )   */
                        {   font: "Bold 14pt Arial",
                            style:"#ffffff",
                            align : "start"             }   ) ;
    env.disp.addMessage(  'Simulation by Abouzar Kaboudian @ CHAOS Lab',
                        0.05,   0.1,
                        {   font: "italic 10pt Arial",
                            style: "#ffffff",
                            align : "start"             }  ) ;

/*------------------------------------------------------------------------
 * initialize
 *------------------------------------------------------------------------
 */
    env.initialize = function(){
        env.time = 0 ;
        env.paceTime = 0 ;
        env.breaked = false ;
        env.notBreaked = !env.breaked ;
        env.init.render() ;
        env.plot.init(0) ;
        env.disp.initialize() ;
        refreshDisplay() ;
    }

/*-------------------------------------------------------------------------
 * Render the programs
 *-------------------------------------------------------------------------
 */
   env.initialize() ;

/*------------------------------------------------------------------------
 * createGui
 *------------------------------------------------------------------------
 */
   createGui() ;

/*------------------------------------------------------------------------
 * clicker
 *------------------------------------------------------------------------
 */
    canvas_1.addEventListener("click",      onClick,        false   ) ;
    canvas_1.addEventListener('mousemove',
            function(e){
                if ( e.buttons >=1 ){
                    onClick(e) ;
                }
            } , false ) ;

/*------------------------------------------------------------------------
 * rendering the program ;
 *------------------------------------------------------------------------
 */
    env.render = function(){
        if (env.running){
            for(var i=0 ; i< env.frameRate/120 ; i++){
                env.comp1.render() ;
                env.comp2.render() ;
                env.time += 2.0*env.dt ;
                env.paceTime += 2.0*env.dt ;
                stats.update();
                stats.update() ;
                env.disp.updateTipt() ;
                env.plot.update(env.time) ;
                env.rec.recorder.record(env.time) ;
            }

            if ( env.time > env.breakTime 
                    && env.notBreaked 
                    && env.vltBreak     ){
                env.breakVltNow() ;
            }

            refreshDisplay();
        }
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
 * refreshDisplay
 *========================================================================
 */
function refreshDisplay(){
    env.disp.render() ;
    env.plot.render() ;

    env.paceMaker.caller.call(env.time) ;
    if ( env.apd.measuring ){
        env.apd.average = env.apd.probe.measure(env.time) ;
        env.apd.last    = env.apd.probe.apd ;
        env.apd.noApsMeasured = env.apd.probe.noApsMeasured ;
    }

}

/*========================================================================
 * onClick
 *========================================================================
 */
function onClick(e){
    env.clickPosition[0] =
        ((e.clientX+e.view.scrollX)-canvas_1.offsetLeft) / env.dispWidth ;
    env.clickPosition[1] =  1.0-
        ((e.clientY+e.view.scrollY)-canvas_1.offsetTop) / env.dispWidth ;

    env.click.setUniform('clickPosition',env.clickPosition) ;

    if (    env.clickPosition[0]   >   1.0 ||
            env.clickPosition[0]   <   0.0 ||
            env.clickPosition[1]   >   1.0 ||
            env.clickPosition[1]   <   0.0 ){
        return ;
    }
    clickRender() ;
    return ;
}
/*========================================================================
 * Render and display click event
 *========================================================================
 */
function clickRender(){
    switch( env['clicker']){
    case 'Pace Region':
        env.click.setUniform('clickValue',env.paceValue) ;
        clickSolve() ;
        requestAnimationFrame(clickSolve) ;
        env.oldClicker = env.clicker ;
        break ;
        
   case 'Signal Loc. Picker':
        env.plot.setProbePosition( env.clickPosition ) ;
        env.disp.setProbePosition( env.clickPosition ) ;
        env.apd.probe.reset({probePosition : env.clickPosition }) ;
        env.rec.probe.setPosition( new Float32Array(env.clickPosition) ) ;
        env.plot.init() ;
        refreshDisplay() ;
        env.oldClicker = env.clicker ;
        break ;

    case 'Pace-Maker Location':
        env.paceMaker.position = new Float32Array(env.clickPosition) ;
        env.paceMaker.solver.setUniform('pacePosition',
                env.paceMaker.position ) ;
        env.clicker = env.oldClicker ;
        gui.smlPrmFldr.clicker.updateDisplay() ;
    }
    
    return ;
}
/*========================================================================
 * solve click event
 *========================================================================
 */
function clickSolve(){
    env.click.render() ;
    env.clickCopy.render() ;
    refreshDisplay() ;
}

/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * End of require()
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
loadWebGL() ;
} ) ;
