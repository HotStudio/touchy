// touchy is a jQuery plugin for handling Webkit touch events
// originally written by Bill Fisher 2011
// basic plugin architecture taken from http://docs.jquery.com/Plugins/Authoring
// Mobile Safari events documented here: http://developer.apple.com/library/safari/#documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html

//console.log("touchy loaded");

(function($){

    var methods = {
        init: function(options){
            return this.each(function(){
                var $this = $(this);
            //code
            });
        },
        lockScreen: function(){
            document.body.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, false);
        },
        isPortrait: function(){
            return Math.abs(window.orientation) != 90
        },

        touchStart: function(callback){
            return this.each(function(){
                var $this = $(this);
                $this.bind('touchstart', callback);
            });
        },
    
        touchEnd: function(callback){
            return this.each(function(){
                var $this = $(this);
                $this.bind('touchend', callback);
            });
        },    

        /* -------------------- pinch ------------------------
        *
        * Arguments:
        *   direction: string. "in" or "out".
        *   options: object literal. this argument is optional; default settings can be used instead.
        *   callback: function(startPoint, pinchDistance)
        *     received parameters:
        *       startPoint: object literal containing x and y values
        *       pinchDistance: number.  the difference in pixels between the starting distance and the triggering distance
        *
        * No Options Example:
        *   $("#touchme").touchy( "pinch", "in", function(start){console.log("pinch in: " + start.x + ", " + start.y)} );
        *
        * Full Options Example:
        *   $("#touchme").touchy( "pinch",
        *                         "in",
        *                         {
        *                          'triggerOnce': false,
        *                          'pxThresh': 25
        *                         },
        *                         function(start, dist){
        *                           console.log("pinch in: " + start.x + ", " + start.y + ", " + dist);
        *                         }
        *                       );
        *
        * ---------------------------------------------- */
        pinch: function(direction, options, callback){
            var getTouchPoints = function(e){
                var p = {}, // points data
                    t = e.originalEvent.touches;
                if(t.length > 1){ //multi-touch gesture
                    p.x1 = t[0].pageX,
                    p.y1 = t[0].pageY,
                    p.x2 = t[1].pageX,
                    p.y2 = t[1].pageY,
                    p.centerX = (p.x1 + p.x2) / 2,
                    p.centerY = (p.y1 + p.y2) / 2;
                }
                p = p || false;
                return p;
            }
            
            var eventHandlers = {
                touchStart: function(e){
                    var data = $(this).data('pinch'),
                        points = getTouchPoints(e);
                    if(points){ //two finger gesture
                        data.startPoint.x = points.centerX;
                        data.startPoint.y = points.centerY;
                        data.startDistance = Math.sqrt( Math.pow( (points.x2 - points.x1), 2 ) + Math.pow( (points.y2 - points.y1), 2 ) );
                    }
                },
                touchMove: function(e){
                    var $this = $(this),
                        data = $this.data('pinch'),
                        startPoint = data.startPoint,
                        startDistance = data.startDistance,
                        scale = data.scale || 1.0,
                        points = getTouchPoints(e),
                        centerPoint,
                        moveDistance,
                        direction,
                        pinchDistance;

                    if(!data.pinched && points){ //two finger gesture
                        centerPoint = data.centerPoint = {x: points.centerX, y: points.centerY};

                        direction = scale < 1 ? "in" : "out";
                        moveDistance = Math.sqrt( Math.pow( (points.x2 - points.x1), 2 ) + Math.pow( (points.y2 - points.y1), 2 ) );
                        pinchDistance = scale < 1 ? startDistance - moveDistance : moveDistance - startDistance;

                        if (pinchDistance > data.settings[direction].pxThresh){
                            data.settings[direction].callback.call($this, scale, centerPoint, startDistance, startPoint);
                            if(data.settings[direction].triggerOnce){
                                $(this).data('pinch').pinched = true;
                            }
                        }
                    }
                },
                gestureChange: function(e){
                    var $this = $(this),
                        data = $this.data('pinch'),
                        startPoint = data.startPoint,
                        centerPoint = data.centerPoint || startPoint,
                        startDistance = data.startDistance,
                        event = e.originalEvent,
                        scale = data.scale = event.scale;

                    if(!data.pinched){
                        data.settings[direction].callback.call($this, scale, centerPoint, startDistance, startPoint);
                        if(data.settings[direction].triggerOnce){
                            $(this).data('pinch').pinched = true;
                        }
                    }
                    
                    
                },
                touchEnd: function(e){
                    $(this).data('pinch').pinched = false;
                }
            };
            
            
            
            var args = arguments;
            var DirectionDefaults = function(){
                return {
                    'triggerOnce': false,
                    'pxThresh': 50,
                    'callback': null
                };
            };
            var settings = {
                'in': new DirectionDefaults,
                'out': new DirectionDefaults
            };
            return this.each(function(){
                var opts; //options
                var cb;   //callback
                if (typeof args[1] == 'function'){
                    cb = args[1];
                    opts = false;
                }
                else {
                    cb = args[2];
                    opts = args[1];
                }

                // modify the settings based on the parameters passed in
                if ( opts ) {
                    $.extend( settings[direction], opts );
                }
                settings[direction].callback = cb;

                var $this = $(this),
                data = $this.data('pinch');

                // store the persistent data in the jQuery element wrapper
                if (!data) {
                    $(this).data('pinch', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'settings': settings,
                        'pinched': false
                    });
                }

                if ( opts ) {
                    $.extend( $(this).data('pinch').settings[direction], opts );
                }
                $(this).data('pinch').settings[direction].callback = cb;

                // TO DO: dry up
                
                $this.bind(
                    "touchstart", 
                    {
                        direction: direction
                    }, 
                    eventHandlers.touchStart);
                    
                $this.bind(
                    "touchmove", 
                    {
                        direction: direction
                    }, 
                    eventHandlers.touchMove);
                   
                $this.bind(
                    "gesturechange", 
                    {
                        direction: direction
                    },
                    eventHandlers.gestureChange);
                   
                $this.bind(
                    "touchend", 
                    {
                        direction: direction
                    }, 
                    eventHandlers.touchEnd);
                   

            });
        },


        /* -------------------- touchTimer ----------------------------
        *
        * also known as 'long press'
        *
        *
        */
        touchTimer: function(options, callback){
            var eventHandlers = {
                touchStart: function(e){
                    var $this = $(this),
                    data = $this.data('touchTimer');
                    var t = e.originalEvent.touches;
                    if (t.length == 1){
                        data.startPoint = {
                            x: t[0].pageX, 
                            y: t[0].pageY
                            };
                        data.startDate = e.timeStamp;
                    }
                }, 
                touchEnd: function(e){
                    var $this = $(this),
                    data = $this.data('touchTimer');
                    $this.data('touchTimer', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'settings': settings,
                        'held': false
                    });
          
                    var dateNow = new Date();
                    if (dateNow - data.startDate > data.settings.msThresh){
                        data.settings.callback.call($this, data.startPoint);
                    }
                } 
            }
            var args = arguments;
            var settings = {
                'msThresh': 100,
                'holdCallback': null,
                'endCallback': null
            }    
      
            return this.each(function(){
                var cb, opts;
                if (typeof args[0] == 'function'){
                    cb = args[0];
                    opts = false;
                }
                else {
                    opts = args[0];
                    cb = args[1];
                }

                // modify the settings based on the parameters passed in
                if ( opts ) {
                    $.extend( settings, opts );
                }
                settings.callback = cb;

                var $this = $(this),
                data = $this.data('touchTimer');          
          
          
                // store the persistent data in the jQuery element wrapper
                if (!data) {
                    $(this).data('touchTimer', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'settings': settings,
                        'held': false
                    });
                }

                if ( opts ) {
                    $.extend( $(this).data('touchTimer').settings, opts );
                }
                $(this).data('touchTimer').settings.callback = cb;           
          
                $this.bind("touchstart", eventHandlers.touchStart);
                $this.bind("touchend", eventHandlers.touchEnd);          
            });
        },
    
    
    
    
        /* -------------------- touchHold --------- not currently working!!!!  -------------------
        *
        * also known as 'long press'
        *
        *
        */
        touchHold: function(options, holdCallback, endCallback){
            var eventHandlers = {
                touchStart: function(e){
                    var $this = $(this),
                    data = $this.data('touchHold');
              
                    //console.log($this);

                    var t = e.originalEvent.touches;
                    if (t.length == 1){
                        data.startPoint = {
                            x: t[0].pageX, 
                            y: t[0].pageY
                            };
                        data.startDate = e.timeStamp;
                        var dateNow;
                        data.timeout = setTimeout(function(){
                            //console.log($this);
                            dateNow = new Date();
                            if ( dateNow - data.startDate > settings.msThresh){
                                //console.log($this);
                                data.settings.holdCallback.call($this, data.startPoint);
                            }
                            else {
                                // log the milliseconds here in the data object... include them in the endCallback...
                                var callee = arguments.callee;
                                setTimeout(function($this){
                        
                                    callee($this);
                                }, 50);
                            }
                
                        }, 50);
                    }
                }, 
                touchEnd: function(e){
                    var $this = $(this),
                    data = $this.data('touchHold');
                    $this.data('touchHold', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'settings': settings,
                        'held': false
                    });
                    clearTimeout(data.timeout);
                    data.settings.endCallback.call($this, data.startPoint);
                } 
            }
            var args = arguments;
            var settings = {
                'msThresh': 3000,
                'holdCallback': null,
                'endCallback': null
            }    
      
            return this.each(function(){
                var holdcb, endcb, opts;
                if (typeof args[0] == 'function'){
                    holdcb = args[0];
                    endcb = args[1];
                    opts = false;
                }
                else {
                    opts = args[0];
                    holdcb = args[1];
                    endcb = args[2];
                }

                // modify the settings based on the parameters passed in
                if ( opts ) {
                    $.extend( settings, opts );
                }
                settings.holdCallback = holdcb;
                settings.endCallback = endcb;

                var $this = $(this),
                data = $this.data('touchHold');          
          
          
                // store the persistent data in the jQuery element wrapper
                if (!data) {
                    $(this).data('touchHold', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'settings': settings,
                        'held': false
                    });
                }

                if ( opts ) {
                    $.extend( $(this).data('touchHold').settings, opts );
                }
                $(this).data('touchHold').settings.holdCallback = holdcb; 
                $(this).data('touchHold').settings.endCallback = endcb; 
          
          
                $this.bind("touchstart", eventHandlers.touchStart);
                $this.bind("touchend", eventHandlers.touchEnd);          
            });
        },
    
    
    

        /* ------------------- touchHoldMove -------------------------
        *
        *
        *
        */
        touchHoldMove: function(options, callback){
            // if the user touches the screen with one finger and keeps it there for a short while, and then moves their finger
            // TO DO: clean up extraneous data storage
            var eventHandlers = {
                touchStart: function(e){
                    var $this = $(this),
                    data = $this.data('touchHoldMove');

                    var t = e.originalEvent.touches;
                    if (t.length == 1){
                        $this.data('touchHoldMove').startPoint = {
                            x: t[0].pageX, 
                            y: t[0].pageY
                            };
                        $this.data('touchHoldMove').startDate = e.timeStamp;
                    }
                },
                touchMove: function(e){
                    var t = e.originalEvent.touches;
                    if (t.length == 1){
                        var $this = $(this),
                        data = $this.data('touchHoldMove'),
                        startPoint = data.startPoint,
                        lastMoveDate = data.moveDate || data.startDate,
                        lastMovePoint = data.movePoint.x ? data.movePoint : data.startPoint,
                        moveDate = $this.data('touchHoldMove').moveDate = e.timeStamp,
                        movePoint = {
                            x:null, 
                            y:null
                        };
                        if ( data.held || (moveDate - lastMoveDate) > data.settings.msThresh ){
                            $this.data('touchHoldMove').held = true;
                            movePoint.x = e.originalEvent.touches[0].pageX;
                            movePoint.y = e.originalEvent.touches[0].pageY;
                            $this.data('touchHoldMove').movePoint = movePoint;
                            data.settings.callback.call($this, movePoint, lastMovePoint, startPoint);
                        }
                    }
                },
                touchEnd: function(e){
                    var $this = $(this);
                    $(this).data('touchHoldMove', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'movePoint': {
                            x:null, 
                            y:null
                        },
                        'moveDate': null,
                        'settings': settings,
                        'held': false
                    });
                }
            }
            var args = arguments;
            var settings = {
                'msThresh': 100,
                'callback': null
            }

            return this.each(function(){

                var opts;
                var cb;
                if (typeof args[0] == 'function'){
                    cb = args[0];
                    opts = false;
                }
                else {
                    cb = args[1];
                    opts = args[0];
                }

                // modify the settings based on the parameters passed in
                if ( opts ) {
                    $.extend( settings, opts );
                }
                settings.callback = cb;

                var $this = $(this),
                data = $this.data('touchHoldMove');

                // store the persistent data in the jQuery element wrapper
                if (!data) {
                    $(this).data('touchHoldMove', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'movePoint': {
                            x:null, 
                            y:null
                        },
                        'moveDate': null,
                        'settings': settings,
                        'held': false
                    });
                }

                if ( opts ) {
                    $.extend( $(this).data('touchHoldMove').settings, opts );
                }
                $(this).data('touchHoldMove').settings.callback = cb;

                $this.bind("touchstart", eventHandlers.touchStart);
                $this.bind("touchmove", eventHandlers.touchMove);
                $this.bind("touchend", eventHandlers.touchEnd);

            });

        },


        doubleTap: function(options, callback){
            // code
        },


        /* --------------------- swipe -----------------------
        *
        * Arguments:
        *   direction: string. "left", "right", "up" or "down".
        *   options: object literal. this argument is optional; default settings can be used instead.
        *   callback: function(direction)
        *     received parameter:
        *       direction: string.  copied from swipe() method arguments, so that one callback can handle multiple directions.
        *
        * No Options Example:
        *   $("#touchme").touchy("swipe", "left", this.slide);
        *
        * Full Options Example:
        *   $("#touchme").touchy( "swipe",
        *                         "left",
        *                         {
        *                           'pxThresh': 100,
        *                           'msThresh': 400
        *                         },
        *                         function(direction){
        *                           console.log(direction);
        *                         }
        *                       );
        *
        * ---------------------------------------------- */
        swipe: function(direction, options, callback){
            // if you are using swipe on an element, you don't want the whole body to move with touchmove
            document.body.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, false);

            /* * * swipe event handlers * * */
            var eventHandlers = {
                touchStart: function(e){
                    var $this = $(this),
                    data = $this.data('swipe');

                    var t = e.originalEvent.touches;
                    if (t.length == 1){
                        $this.data('swipe').startPoint = {
                            x: t[0].pageX, 
                            y: t[0].pageY
                            };
                        $this.data('swipe').startDate = e.timeStamp;
                    }
                    else {
                //multi-finger swipe code could be added here, but you would need to revise touchMove too
                }
                },
                touchMove: function(e){

                    var $this = $(this),
                    data = $this.data('swipe'),
                    t = e.originalEvent.touches;

                    if (!data.swiped && t.length == 1){
                        var startDate = data.startDate,
                        startPoint = data.startPoint,
                        moveDate = $this.data('swipe').moveDate = e.timeStamp,
                        movePoint = {
                            x:null, 
                            y:null
                        },
                        swipe = false,
                        direction = null,
                        hDistance = null,
                        vDistance = null,
                        rightish = false,
                        downish = false;

                        movePoint.x = e.originalEvent.touches[0].pageX;
                        movePoint.y = e.originalEvent.touches[0].pageY;
                        $this.data('swipe').movePoint = movePoint;

                        // figure out which way we are going... probably could use revision.
                        if (startPoint.x > movePoint.x ){
                            //left
                            hDistance = startPoint.x - movePoint.x;
                        }
                        else {
                            //right
                            rightish = true;
                            hDistance = movePoint.x - startPoint.x;
                        }
                        if (startPoint.y > movePoint.y){
                            //up -- remember 0,0 is top left
                            vDistance = startPoint.y - movePoint.y;
                        }
                        else {
                            //down
                            downish = true;
                            vDistance = movePoint.y - startPoint.y;
                        }
                        if (hDistance > vDistance){
                            direction = rightish ? "right" : "left";
                        }
                        else{
                            direction = downish ? "down" : "up";
                        }

                        if ( (direction == e.data.direction) &&
                            ((moveDate - startDate) < data.settings[direction].msThresh) &&
                            ( hDistance > data.settings[direction].pxThresh || vDistance > data.settings[direction].pxThresh) ){
                            data.settings[direction].callback.call($this, direction);
                            $this.data('swipe').swiped = true;
                        }
                    }
                },
                touchEnd: function(){
                    $(this).data('swipe').swiped = false;
                }
            }

            /* * * swipe set up * * */
            var swipeArguments = arguments;
            var DirectionDefaults = function(){
                return {
                    'pxThresh': 50,
                    'msThresh': 100,
                    'callback': null
                }
            };
            var settings = {
                'left': new DirectionDefaults,
                'right': new DirectionDefaults,
                'up': new DirectionDefaults,
                'down': new DirectionDefaults
            }

            return this.each(function(){

                var opts;
                var cb;
                if (typeof swipeArguments[1] == 'function'){
                    cb = swipeArguments[1];
                    opts = false;
                }
                else {
                    cb = swipeArguments[2];
                    opts = swipeArguments[1];
                }

                // modify the settings based on the parameters passed in
                if ( opts ) {
                    $.extend( settings[direction], opts );
                }
                settings[direction].callback = cb;

                var $this = $(this),
                data = $this.data('swipe');

                // store the persistent data in the jQuery element wrapper
                if (!data) {
                    $(this).data('swipe', {
                        'target': $this,
                        'startPoint': {
                            x:null, 
                            y:null
                        },
                        'startDate': null,
                        'movePoint': {
                            x:null, 
                            y:null
                        },
                        'moveDate': null,
                        'settings': settings,
                        'swiped': false
                    });
                }

                if ( opts ) {
                    $.extend( $(this).data('swipe').settings[direction], opts );
                }
                $(this).data('swipe').settings[direction].callback = cb;

                $this.bind("touchstart", {
                    direction: direction
                }, eventHandlers.touchStart);
                $this.bind("touchmove", {
                    direction: direction
                }, eventHandlers.touchMove);
                $this.bind("touchend", {
                    direction: direction
                }, eventHandlers.touchEnd);

            });
        }
    } //end public methods


    $.fn.touchy = function(method) {
  
        // Method calling logic
        // ...so that you can call these methods like so:
        // $("#elementID").touchy("method", arg1, arg2, arg3, etc.).someOtherJQueryFunction().etc();
    
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist within jQuery.touchy' );
        }   

    };
})( jQuery );

